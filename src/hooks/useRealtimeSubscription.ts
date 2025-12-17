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
}

export function useRealtimeSubscription({
  channelId,
  currentUserId,
  enabled,
  onPostInsert,
  onPostDelete,
  onReactionChange,
  onCommentInsert,
}: UseRealtimeSubscriptionProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled || !channelId) {
      return;
    }

    // 채널 이름을 고유하게 생성
    const realtimeChannelName = `channel-${channelId}-realtime`;

    // Realtime 채널 생성
    channelRef.current = supabase.channel(realtimeChannelName);

    // posts 테이블 구독
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          // 타입 단언: Supabase는 실제로 올바른 데이터를 반환하지만 타입 시스템이 이를 모름
          const typedPayload = payload as RealtimePostgresInsertPayload<PostRecord>;

          // 본인이 작성한 게시글은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.author_id === currentUserId) {
            return;
          }
          onPostInsert?.(typedPayload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const typedPayload = payload as RealtimePostgresDeletePayload<PostRecord>;
          onPostDelete?.(typedPayload);
        },
      );

    // post_reactions 테이블 구독
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_reactions',
        },
        (payload) => {
          const typedPayload = payload as RealtimePostgresInsertPayload<PostReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.new.user_id === currentUserId) {
            return;
          }
          onReactionChange?.(typedPayload);
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
          const typedPayload = payload as RealtimePostgresDeletePayload<PostReactionRecord>;

          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && typedPayload.old.user_id === currentUserId) {
            return;
          }
          onReactionChange?.(typedPayload);
        },
      );

    // comments 테이블 구독
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresInsertPayload<CommentRecord>;

        // 본인의 댓글은 제외 (Optimistic Update 사용)
        if (currentUserId && typedPayload.new.author_id === currentUserId) {
          return;
        }
        onCommentInsert?.(typedPayload);
      },
    );

    // 구독 시작
    channelRef.current.subscribe();

    // 클린업 함수
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    channelId,
    currentUserId,
    enabled,
    onPostInsert,
    onPostDelete,
    onReactionChange,
    onCommentInsert,
  ]);

  return {
    isSubscribed: !!channelRef.current,
  };
}
