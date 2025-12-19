import { useCacheKeyContext } from '@/context/CacheKeyContext';
import { toast } from 'sonner';
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
import {
  PostRecord,
  PostReactionRecord,
  CommentRecord,
} from '@/types/realtime';

export default function usePosts(channelId: string, date?: string) {
  console.log('🔴🔴🔴 [usePosts] 함수 시작!!! 🔴🔴🔴');

  const { postsKey } = useCacheKeyContext();
  const today = getDateYYYYMMDDWithDash().replaceAll('-', '');
  const key = `${postsKey}?channelId=${channelId}&date=${date || today}`;

  // 현재 사용자 정보
  const { user } = useUser(channelId);

  console.log('🟢🟢🟢 [usePosts] user 정보:', user);

  // 새 게시글 카운트 상태
  const [newPostsCount, setNewPostsCount] = useState(0);

  // 오늘 날짜인지 확인 (실시간 구독은 오늘만 활성화)
  const isToday = !date || date === today;
  console.log('🔵🔵🔵 [usePosts] isToday 확인:', { date, today, isToday });

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

  const { mutate: addPostMutation, isLoading: isAddingPost } = useToastMutation(
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
    },
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
    console.log('[usePosts] handlePostInsert 호출됨');
    // 새 게시글이 추가되면 카운트 증가
    setNewPostsCount((prev) => prev + 1);
    toast.info('다른 사용자가 새 글을 남겼어요!');
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
      console.log('👀 [usePosts] handleReactionChange payload:', payload);

      let postId: string | null = null;
      let emoji: string | null = null;
      let type: 'INSERT' | 'DELETE' | null = null;
      let userId: string | null = null;

      if (payload.eventType === 'INSERT') {
        const insertPayload =
          payload as RealtimePostgresInsertPayload<PostReactionRecord>;
        postId = insertPayload.new.post_id;
        emoji = insertPayload.new.emoji;
        userId = insertPayload.new.user_id;
        type = 'INSERT';
      } else if (payload.eventType === 'DELETE') {
        const deletePayload =
          payload as RealtimePostgresDeletePayload<PostReactionRecord>;
        postId = deletePayload.old.post_id ?? null; // old에 post_id가 없을 수도 있음 (설정에 따라)
        // 주의: REPLICA IDENTITY FULL이 아니면 old에 emoji가 없을 수 있음.
        // 현재 로직에서는 emoji를 모르면 카운트를 줄일 수 없음.
        if ('emoji' in deletePayload.old) {
          emoji = (deletePayload.old as PostReactionRecord).emoji;
        }
        userId = deletePayload.old.user_id ?? null;
        type = 'DELETE';
      }

      console.log('[usePosts] Reaction Change Parsed:', {
        postId,
        emoji,
        type,
        userId,
      });

      if (!postId || !postPages) return;

      // 내 액션은 이미 Optimistic Update로 처리되었을 수 있음 -> 중복 처리 방지
      // (단, 다른 기기에서의 내 액션은 처리해야 함... 여기서는 currentUser check 사용)
      if (user?.userId && userId === user.userId) {
        console.log('[usePosts] 내 리액션이므로 무시 (Optimistic Update 가정)');
        return;
      }

      if (type === 'DELETE' && !emoji) {
        // emoji를 모르면 전체 갱신 (fallback)
        console.log('[usePosts] DELETE인데 emoji 정보 없어서 전체 갱신');
        mutate(undefined, { revalidate: true });
        return;
      }

      if (type && emoji) {
        const updatedPages = postPages.map((page) =>
          page.map((post) => {
            if (post.id === postId) {
              const existingReaction = post.reactions.find(
                (r) => r.emoji === emoji,
              );
              let newReactions = [...post.reactions];

              if (type === 'INSERT') {
                if (existingReaction) {
                  newReactions = newReactions.map((r) =>
                    r.emoji === emoji ? { ...r, count: r.count + 1 } : r,
                  );
                } else {
                  newReactions.push({ emoji, count: 1, reactedByMe: false });
                }
              } else if (type === 'DELETE') {
                if (existingReaction) {
                  newReactions = newReactions
                    .map((r) =>
                      r.emoji === emoji
                        ? { ...r, count: Math.max(0, r.count - 1) }
                        : r,
                    )
                    .filter((r) => r.count > 0); // count 0이면 제거? UI 정책에 따라 결정. 보통 0이면 숨김.
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

        mutate(updatedPages, { revalidate: false });
      }
    },
    [mutate, postPages, user?.userId],
  );

  const handleCommentInsert = useCallback(
    (payload: RealtimePostgresInsertPayload<CommentRecord>) => {
      console.log('💬 [usePosts] handleCommentInsert:', payload);
      // 댓글 추가 시 해당 게시글의 댓글 카운트 증가
      const postId = payload.new.post_id;
      const authorId = payload.new.author_id;

      if (user?.userId && authorId === user.userId) {
        console.log('[usePosts] 내 댓글이므로 무시 (Optimistic Update 가정)');
        return;
      }

      const updatedPages = postPages?.map((page) =>
        page.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post,
        ),
      );
      mutate(updatedPages, { revalidate: false });

      // 게시글 상세 조회(댓글 목록 등) 캐시 무효화 -> 상세 진입 시 최신 댓글 보이게
      globalMutate(
        (key) =>
          typeof key === 'string' && key.includes(`/api/posts/${postId}`),
        undefined,
        { revalidate: true },
      );
    },
    [postPages, mutate, globalMutate, user?.userId],
  );

  // 실시간 구독 활성화 (오늘 날짜일 때만)
  useRealtimeSubscription({
    channelId,
    currentUserId: user?.userId,
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
