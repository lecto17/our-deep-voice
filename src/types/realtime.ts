/**
 * Supabase Realtime 페이로드 타입 정의
 */

// 게시글 테이블 레코드
export interface PostRecord {
  id: string;
  author_id: string;
  channel_id: string;
  caption: string;
  image_key: string;
  blur_image_key?: string;
  created_at: string;
  updated_at: string | null;
}

// 공감 테이블 레코드
export interface PostReactionRecord {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// 댓글 테이블 레코드
export interface CommentRecord {
  id: string;
  post_id: string;
  channel_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string | null;
}

// Supabase Realtime 페이로드 기본 구조
export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: null | string[];
}

// 댓글 공감 테이블 레코드
export interface CommentReactionRecord {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// 각 테이블별 페이로드 타입
export type PostRealtimePayload = RealtimePayload<PostRecord>;
export type PostReactionRealtimePayload = RealtimePayload<PostReactionRecord>;
export type CommentRealtimePayload = RealtimePayload<CommentRecord>;
export type CommentReactionRealtimePayload =
  RealtimePayload<CommentReactionRecord>;
