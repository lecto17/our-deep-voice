import { useCacheKeyContext } from '@/context/CacheKeyContext';
import { SupaComment, SupaPost } from '@/types/post';
import { getDateYYYYMMDDWithDash } from '@/utils/utils';
import { useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { useToastMutation } from './useToastMutation';
import { TOAST_MESSAGES } from '@/config/toastMessages';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import useUser from './useUser';
import {
  RealtimePostgresInsertPayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';
import { PostRecord, PostReactionRecord, CommentRecord } from '@/types/realtime';

export default function usePosts(channelId: string, date?: string) {
  const { postsKey } = useCacheKeyContext();
  const today = getDateYYYYMMDDWithDash().replaceAll('-', '');
  const key = `${postsKey}?channelId=${channelId}&date=${date || today}`;

  // 현재 사용자 정보
  const { user } = useUser(channelId);

  // 새 게시글 카운트 상태
  const [newPostsCount, setNewPostsCount] = useState(0);

  // 오늘 날짜인지 확인 (실시간 구독은 오늘만 활성화)
  const isToday = !date || date === today;

  const getKey = (pageIndex: number, previousPageData: SupaPost[]) => {
    if (previousPageData && !previousPageData.length) return null; // reached the end
    return `${key}&page=${pageIndex}&limit=10`; // SWR key
  };

  const {
    data: postPages,
    isLoading,
    isValidating: isLoadingMore,
    error,
    mutate,
    setSize,
    size,
  } = useSWRInfinite<SupaPost[]>(
    getKey,
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateFirstPage: false,
    },
  );

  const posts = postPages ? postPages.flat() : [];

  const { mutate: globalMutate } = useSWRConfig();

  const {
    mutate: addPostMutation,
    isLoading: isAddingPost,
  } = useToastMutation(
    async ({ text, file }: { text: string; file?: File }) => {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('channelId', channelId);

      if (file) {
        formData.append('file', file);
        formData.append('fileName', file.name);
      }

      return fetch('/api/post', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to create post');
        return res.json();
      });
    },
    {
      successMessage: TOAST_MESSAGES.POST_CREATE_SUCCESS,
      errorMessage: TOAST_MESSAGES.POST_CREATE_ERROR,
      onSuccess: () => {
        mutate(undefined, { revalidate: true });
      },
    }
  );

  const addPost = (text: string, file?: File) => {
    return addPostMutation({ text, file });
  };

  const upsertCommentOnPost = useCallback(
    (postId: string, comment: SupaComment) => {
      return fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ postId, comment, channelId }),
      }).then((res) => res.json());
    },
    [],
  );

  const addCommentOnPost = useCallback(
    async (comment: SupaComment, postId: string) => {
      let newPostPages;
      if (comment?.id) {
        // newPosts = comments?.map(({ id, ...rest }) =>
        //   id === comment.id
        //     ? { id, ...rest, comment: comment.comment }
        //     : { id, ...rest }
        // );
      } else {
        newPostPages = postPages?.map((page) =>
          page.map((el) => {
            if (postId === el.id) {
              return {
                ...el,
                commentCount: el.commentCount + 1,
              };
            } else return el;
          }),
        );
      }

      mutate(upsertCommentOnPost(postId, comment), {
        optimisticData: newPostPages,
        populateCache: false,
        revalidate: false,
        rollbackOnError: true,
      });

      globalMutate(`/api/posts/${postId}`);
    },
    [postPages, mutate, upsertCommentOnPost, globalMutate],
  );

  const toggleReactionOnPost = useCallback(
    async (postId: string, emoji: string) => {
      let newReactions,
        addFlag = false;

      // Optimistic update: UI를 먼저 업데이트
      const optimisticPostPages = postPages?.map((page) =>
        page.map((post) => {
          if (post.id === postId) {
            const existingReaction = post.reactions.find(
              (r: { emoji: string }) => r.emoji === emoji,
            );

            if (
              existingReaction?.reactedByMe &&
              existingReaction.emoji === emoji
            ) {
              // 이미 있으면 제거
              newReactions = post.reactions.map((reaction) => {
                if (reaction.emoji === emoji) {
                  return {
                    ...reaction,
                    count: reaction.count - 1 === 0 ? 0 : reaction.count - 1,
                    reactedByMe: false,
                  };
                }
                return reaction;
              });
            } else {
              // 없으면 추가
              addFlag = true;

              if (post.reactions.length === 0) {
                newReactions = [
                  {
                    emoji,
                    count: 1,
                    reactedByMe: true,
                  },
                ];
              } else {
                let added = false;
                newReactions = post.reactions.map((_reaction) => {
                  if (_reaction.emoji === emoji) {
                    added = true;
                    return {
                      ..._reaction,
                      count: _reaction.count + 1,
                      reactedByMe: true,
                    };
                  }

                  return _reaction;
                });

                if (!added) {
                  newReactions = [
                    ...newReactions,
                    {
                      emoji,
                      count: 1,
                      reactedByMe: true,
                    },
                  ];
                }
              }
            }
            return {
              ...post,
              reactions: newReactions,
            };
          }
          return post;
        }),
      );

      // Optimistic update 적용
      mutate(optimisticPostPages, { revalidate: false });

      try {
        if (addFlag) {
          await fetch(`/api/posts/${postId}/reaction`, {
            method: 'POST',
            body: JSON.stringify({
              postId,
              emoji,
            }),
          }).then((res) => res.json());
        } else {
          await fetch(
            `/api/posts/${postId}/reaction/${encodeURIComponent(emoji)}`,
            {
              method: 'DELETE',
            },
          ).then((res) => res.json());
        }
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
        // 에러 발생 시 원래 상태로 롤백
        mutate(postPages, { revalidate: true });
        // 에러는 컴포넌트로 전파하지 않음 (조용히 실패)
      }
    },
    [postPages, mutate, key],
  );

  // 실시간 이벤트 핸들러
  const handlePostInsert = useCallback(() => {
    // 새 게시글이 추가되면 카운트 증가
    setNewPostsCount((prev) => prev + 1);
  }, []);

  const handlePostDelete = useCallback(
    (payload: RealtimePostgresDeletePayload<PostRecord>) => {
      // 게시글 삭제 시 목록에서 제거
      const deletedPostId = payload.old.id;
      const updatedPages = postPages?.map((page) =>
        page.filter((post) => post.id !== deletedPostId),
      );
      mutate(updatedPages, { revalidate: false });
    },
    [postPages, mutate],
  );

  const handleReactionChange = useCallback(
    (
      payload:
        | RealtimePostgresInsertPayload<PostReactionRecord>
        | RealtimePostgresDeletePayload<PostReactionRecord>,
    ) => {
      // 공감 변경 시 해당 게시글만 revalidate
      let postId: string | null = null;

      if (payload.eventType === 'INSERT') {
        const insertPayload = payload as RealtimePostgresInsertPayload<PostReactionRecord>;
        postId = insertPayload.new.post_id;
      } else if (payload.eventType === 'DELETE') {
        const deletePayload = payload as RealtimePostgresDeletePayload<PostReactionRecord>;
        postId = deletePayload.old.post_id ?? null;
      }

      if (postId) {
        // 전체 페이지를 revalidate하여 최신 데이터 가져오기
        mutate(undefined, { revalidate: true });
      }
    },
    [mutate],
  );

  const handleCommentInsert = useCallback(
    (payload: RealtimePostgresInsertPayload<CommentRecord>) => {
      // 댓글 추가 시 해당 게시글의 댓글 카운트 증가
      const postId = payload.new.post_id;
      const updatedPages = postPages?.map((page) =>
        page.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post,
        ),
      );
      mutate(updatedPages, { revalidate: false });
    },
    [postPages, mutate],
  );

  // 실시간 구독 활성화 (오늘 날짜일 때만)
  useRealtimeSubscription({
    channelId,
    currentUserId: user?.id,
    enabled: isToday,
    onPostInsert: handlePostInsert,
    onPostDelete: handlePostDelete,
    onReactionChange: handleReactionChange,
    onCommentInsert: handleCommentInsert,
  });

  // 새로고침 핸들러 (배너 클릭 시 실행)
  const handleRefresh = useCallback(() => {
    setNewPostsCount(0);
    mutate(undefined, { revalidate: true });
  }, [mutate]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    error,
    addPost,
    isAddingPost,
    addCommentOnPost,
    toggleReactionOnPost,
    setSize,
    size: postPages?.length || 0,
    newPostsCount,
    handleRefresh,
  };
}
