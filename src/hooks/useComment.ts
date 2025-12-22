import useSWR, { useSWRConfig } from 'swr';
import { SupaComment } from '@/types/post';
import { useCallback, useState } from 'react';
import { useToastMutation } from './useToastMutation';
import { TOAST_MESSAGES } from '@/config/toastMessages';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { CommentReactionRecord } from '@/types/realtime';
import {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
} from '@supabase/supabase-js';
import useUser from './useUser';
import { useParams } from 'next/navigation';

export default function useComment(postId: string) {
  const {
    data: comments,
    isLoading,
    mutate,
  } = useSWR<SupaComment[]>(`/api/posts/${postId}`);
  const [showBottomCommentSection, setShowBottomCommentSection] =
    useState(false);
  const { channelId } = useParams();
  const { user } = useUser(channelId as string);
  const { mutate: globalMutate } = useSWRConfig();

  // usePosts의 updatePostLike에는 useCallback을 감싸주지 않음.
  // 해당 함수를 호출할 때마다 새롭게 전달되는 매개변수를 전달하고 이걸 기반으로 api 요청을 하기에 useCallback 필요없음.
  // updateComment 같은 경우는 함수 호출마다 comment를 새롭게 전달받긴 하지만, 이 함수 외부 변수인 postId에 의존하고 있는데,
  // 이 변수가 바뀌지 않는다면 함수는 그대로 사용해도 괜찮음. 그렇기에 useCallback 감아줌.
  const updateComment = useCallback(
    async (comment: Omit<SupaComment, 'reactions'>) => {
      return await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ postId, comment }),
      }).then((res) => res.json());
    },
    [postId],
  );

  const { mutate: addCommentMutation, isLoading: isAddingComment } =
    useToastMutation(
      async (comment: SupaComment) => {
        return updateComment(comment);
      },
      {
        successMessage: TOAST_MESSAGES.COMMENT_CREATE_SUCCESS,
        errorMessage: TOAST_MESSAGES.COMMENT_CREATE_ERROR,
      },
    );

  const setComment = useCallback(
    async (comment: SupaComment) => {
      let newComments;
      if (comment?.id) {
        newComments = comments?.map(({ id, ...rest }) =>
          id === comment.id
            ? { id, ...rest, body: comment.body }
            : { id, ...rest },
        );
      } else {
        newComments = [
          ...(comments?.length ? comments : []),
          {
            ...comment,
            avatarUrl: comment.avatarUrl,
            userName: comment.userName,
          },
        ];
      }

      // Optimistic update
      mutate(newComments, { revalidate: false });

      try {
        await addCommentMutation(comment);
        const searchParams = new URLSearchParams(window.location.search);
        await globalMutate(`/api/posts?date=${searchParams.get('date')}`);
      } catch (error) {
        // 에러 시 롤백
        mutate(comments, { revalidate: true });
      }
    },
    [comments, mutate, addCommentMutation, globalMutate],
  );

  const toggleReactionOnComment = async (commentId: string, emoji: string) => {
    let newReactions = [],
      addFlag = false;

    // Optimistic update: UI를 먼저 업데이트
    const optimisticComments = comments?.map((comment) => {
      if (comment.id === commentId) {
        const existingReaction = comment.reactions?.find(
          (r: { emoji: string }) => r.emoji === emoji,
        );

        if (existingReaction?.reactedByMe && existingReaction.emoji === emoji) {
          // 이미 있으면 제거
          newReactions = comment.reactions.map((reaction) => {
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

          if (comment.reactions?.length === 0) {
            newReactions = [
              {
                emoji,
                count: 1,
                reactedByMe: true,
              },
            ];
          } else {
            let added = false;
            newReactions =
              comment.reactions?.map((_reaction) => {
                if (_reaction.emoji === emoji) {
                  added = true;
                  return {
                    ..._reaction,
                    count: _reaction.count + 1,
                    reactedByMe: true,
                  };
                }

                return _reaction;
              }) || [];

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
          ...comment,
          reactions: newReactions,
        };
      }
      return comment;
    });

    // Optimistic update 적용
    mutate(optimisticComments, { revalidate: false });

    try {
      let result;
      if (addFlag) {
        result = await fetch(`/api/comments/${commentId}/reaction`, {
          method: 'POST',
          body: JSON.stringify({
            commentId,
            emoji,
          }),
        }).then((res) => res.json());
      } else {
        result = await fetch(
          `/api/comments/${commentId}/reaction/${encodeURIComponent(emoji)}`,
          {
            method: 'DELETE',
          },
        ).then((res) => res.json());
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      // 에러 발생 시 원래 상태로 롤백
      mutate(comments, { revalidate: true });
      // 에러는 컴포넌트로 전파하지 않음 (조용히 실패)
    }
  };

  const handleCommentReactionChange = useCallback(
    (
      payload:
        | RealtimePostgresInsertPayload<CommentReactionRecord>
        | RealtimePostgresDeletePayload<CommentReactionRecord>,
    ) => {
      let commentId: string | null = null;
      let emoji: string | null = null;
      let type: 'INSERT' | 'DELETE' | null = null;

      if (payload.eventType === 'INSERT') {
        commentId = payload.new.comment_id;
        emoji = payload.new.emoji;
        type = 'INSERT';
      } else if (payload.eventType === 'DELETE') {
        commentId = payload.old.comment_id ?? null;
        if ('emoji' in payload.old) {
          emoji = (payload.old as CommentReactionRecord).emoji;
        }
        type = 'DELETE';
      }

      if (!commentId) return;

      // 현재 로드된 댓글 중에 해당 commentId가 있는지 확인
      // update function 사용
      mutate(
        (currentComments) => {
          if (!currentComments) return currentComments;

          // 만약 해당 댓글이 목록에 없다면 무시
          const targetCommentIndex = currentComments.findIndex(
            (c) => c.id === commentId,
          );
          if (targetCommentIndex === -1) return currentComments;

          if (type === 'DELETE' && !emoji) {
            // emoji 모르면 revalidate
            mutate(undefined, { revalidate: true });
            return currentComments;
          }

          if (type && emoji) {
            return currentComments.map((comment) => {
              if (comment.id === commentId) {
                const existingReaction = comment.reactions.find(
                  (r) => r.emoji === emoji,
                );
                let newReactions = [...comment.reactions];

                if (type === 'INSERT') {
                  if (existingReaction) {
                    newReactions = newReactions.map((r) =>
                      r.emoji === emoji ? { ...r, count: r.count + 1 } : r,
                    );
                  } else {
                    newReactions.push({
                      emoji: emoji!,
                      count: 1,
                      reactedByMe: false,
                    });
                  }
                } else if (type === 'DELETE') {
                  if (existingReaction) {
                    newReactions = newReactions
                      .map((r) =>
                        r.emoji === emoji
                          ? { ...r, count: Math.max(0, r.count - 1) }
                          : r,
                      )
                      .filter((r) => r.count > 0);
                  }
                }
                return { ...comment, reactions: newReactions };
              }
              return comment;
            });
          }
          return currentComments;
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  // 댓글 창이 열려있을 때만 구독 활성화
  useRealtimeSubscription({
    channelId: (channelId as string) || '',
    currentUserId: user?.userId,
    enabled: !!channelId, // channelId가 있으면 항상 구독 (Desktop 등에서 댓글이 보일 수 있음)
    onCommentReactionChange: handleCommentReactionChange,
  });

  const toggleBottomCommentSection = useCallback(() => {
    setShowBottomCommentSection(!showBottomCommentSection);
  }, [showBottomCommentSection]);

  return {
    comments,
    isLoading,
    setComment,
    isAddingComment,
    toggleReactionOnComment,
    toggleBottomCommentSection,
    showBottomCommentSection,
  };
}
