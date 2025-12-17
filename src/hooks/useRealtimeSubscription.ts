import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseBrowserClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface PostRealtimePayload {
  eventType: RealtimeEvent;
  new: any;
  old: any;
  table: 'posts' | 'post_reactions' | 'comments';
}

interface UseRealtimeSubscriptionProps {
  channelId: string;
  currentUserId?: string;
  enabled: boolean;
  onPostInsert?: (payload: any) => void;
  onPostDelete?: (payload: any) => void;
  onReactionChange?: (payload: any) => void;
  onCommentInsert?: (payload: any) => void;
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
          // 본인이 작성한 게시글은 제외 (Optimistic Update 사용)
          if (currentUserId && payload.new.author_id === currentUserId) {
            return;
          }
          onPostInsert?.(payload);
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
          onPostDelete?.(payload);
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
          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && payload.new.user_id === currentUserId) {
            return;
          }
          onReactionChange?.(payload);
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
          // 본인의 공감은 제외 (Optimistic Update 사용)
          if (currentUserId && payload.old.user_id === currentUserId) {
            return;
          }
          onReactionChange?.(payload);
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
        // 본인의 댓글은 제외 (Optimistic Update 사용)
        if (currentUserId && payload.new.author_id === currentUserId) {
          return;
        }
        onCommentInsert?.(payload);
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
