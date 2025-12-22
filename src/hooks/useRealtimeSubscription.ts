import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseBrowserClient';
import {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';
import {
  PostRecord,
  PostReactionRecord,
  CommentRecord,
  CommentReactionRecord,
} from '@/types/realtime';

interface UseRealtimeSubscriptionProps {
  channelId: string;
  currentUserId?: string;
  enabled: boolean;
  onPostInsert?: (payload: RealtimePostgresInsertPayload<PostRecord>) => void;
  onPostDelete?: (payload: RealtimePostgresDeletePayload<PostRecord>) => void;
  onReactionChange?: (
    payload:
      | RealtimePostgresInsertPayload<PostReactionRecord>
      | RealtimePostgresDeletePayload<PostReactionRecord>,
  ) => void;
  onCommentInsert?: (
    payload: RealtimePostgresInsertPayload<CommentRecord>,
  ) => void;
  onCommentReactionChange?: (
    payload:
      | RealtimePostgresInsertPayload<CommentReactionRecord>
      | RealtimePostgresDeletePayload<CommentReactionRecord>,
  ) => void;
}

export function useRealtimeSubscription({
  channelId,
  currentUserId,
  enabled,
  onPostInsert,
  onPostDelete,
  onReactionChange,
  onCommentInsert,
  onCommentReactionChange,
}: UseRealtimeSubscriptionProps) {
  const postsChannelRef = useRef<RealtimeChannel | null>(null);
  const reactionsChannelRef = useRef<RealtimeChannel | null>(null);
  const commentsChannelRef = useRef<RealtimeChannel | null>(null);
  const commentReactionsChannelRef = useRef<RealtimeChannel | null>(null);

  // 콜백 함수들을 ref로 저장하여 의존성 배열에서 제외
  const onPostInsertRef = useRef(onPostInsert);
  const onPostDeleteRef = useRef(onPostDelete);
  const onReactionChangeRef = useRef(onReactionChange);
  const onCommentInsertRef = useRef(onCommentInsert);
  const onCommentReactionChangeRef = useRef(onCommentReactionChange);

  // 콜백 ref 업데이트
  onPostInsertRef.current = onPostInsert;
  onPostDeleteRef.current = onPostDelete;
  onReactionChangeRef.current = onReactionChange;
  onCommentInsertRef.current = onCommentInsert;
  onCommentReactionChangeRef.current = onCommentReactionChange;

  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !channelId || !supabase) {
      return;
    }

    // 각 테이블마다 별도의 채널 생성 (mismatch 에러 방지)
    // 컴포넌트 인스턴스마다 고유한 채널명을 사용하여 바인딩 충돌 방지
    const suffix = Math.random().toString(36).slice(2, 7);
    const postsChannelName = `posts-${channelId}-${suffix}`;
    const reactionsChannelName = `reactions-${channelId}-${suffix}`;
    const commentsChannelName = `comments-${channelId}-${suffix}`;
    const commentReactionsChannelName = `comment_reactions-${channelId}-${suffix}`;

    // posts 테이블 구독 - event를 명시적으로 분리
    // 임시: filter 제거하고 클라이언트에서 필터링 (mismatch 에러 우회)
    postsChannelRef.current = supabase
      .channel(postsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresInsertPayload<PostRecord>;

          // 채널 필터링: 다른 채널의 게시글 제외
          if (typedPayload.new.channel_id !== channelId) {
            return;
          }

          // 본인이 작성한 게시글은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.author_id === currentUserId) {
            return;
          }
          onPostInsertRef.current?.(typedPayload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresDeletePayload<PostRecord>;

          // 채널 필터링: 다른 채널의 게시글 제외
          if (typedPayload.old.channel_id !== channelId) {
            return;
          }

          onPostDeleteRef.current?.(typedPayload);
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[Realtime] posts 구독 오류:', err);
        }
      });

    // post_reactions 테이블 구독 - event를 명시적으로 분리
    // 참고: post_reactions 테이블에는 channel_id가 없으므로 filter 없이 구독
    reactionsChannelRef.current = supabase
      .channel(reactionsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_reactions',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresInsertPayload<PostReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.user_id === currentUserId) {
            return;
          }
          onReactionChangeRef.current?.(typedPayload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_reactions',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresDeletePayload<PostReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.old.user_id === currentUserId) {
            return;
          }
          onReactionChangeRef.current?.(typedPayload);
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[Realtime] reactions 구독 오류:', err);
        }
      });

    // comments 테이블 구독 - event를 명시적으로 분리
    // 임시: filter 제거하고 클라이언트에서 필터링 (mismatch 에러 우회)
    commentsChannelRef.current = supabase
      .channel(commentsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresInsertPayload<CommentRecord>;

          // 채널 필터링: 다른 채널의 댓글 제외
          if (typedPayload.new.channel_id !== channelId) {
            return;
          }

          // 본인의 댓글은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.author_id === currentUserId) {
            return;
          }
          onCommentInsertRef.current?.(typedPayload);
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[Realtime] comments 구독 오류:', err);
        }
      });

    // comment_reactions 테이블 구독 - event를 명시적으로 분리
    commentReactionsChannelRef.current = supabase
      .channel(commentReactionsChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_reactions',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresInsertPayload<CommentReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.user_id === currentUserId) {
            return;
          }
          onCommentReactionChangeRef.current?.(typedPayload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comment_reactions',
        },
        (payload) => {
          const typedPayload =
            payload as RealtimePostgresDeletePayload<CommentReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.old.user_id === currentUserId) {
            return;
          }
          onCommentReactionChangeRef.current?.(typedPayload);
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[Realtime] comment_reactions 구독 오류:', err);
        }
      });

    // 클린업 함수
    return () => {
      if (postsChannelRef.current) {
        supabase.removeChannel(postsChannelRef.current);
        postsChannelRef.current = null;
      }
      if (reactionsChannelRef.current) {
        supabase.removeChannel(reactionsChannelRef.current);
        reactionsChannelRef.current = null;
      }
      if (commentsChannelRef.current) {
        supabase.removeChannel(commentsChannelRef.current);
        commentsChannelRef.current = null;
      }
      if (commentReactionsChannelRef.current) {
        supabase.removeChannel(commentReactionsChannelRef.current);
        commentReactionsChannelRef.current = null;
      }
    };
  }, [channelId, currentUserId, enabled]);

  return {
    isSubscribed:
      !!postsChannelRef.current ||
      !!reactionsChannelRef.current ||
      !!commentsChannelRef.current ||
      !!commentReactionsChannelRef.current,
  };
}
