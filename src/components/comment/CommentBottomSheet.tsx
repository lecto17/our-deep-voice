'use client';

import BottomSheet from '../ui/bottom-sheet/BottomSheet';
import CommentItem from './CommentItem';
import { SupaComment } from '@/types/post';

type CommentBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  comments: SupaComment[];
  toggleReactionOnComment: (commentId: string, emoji: string) => void;
};

const CommentBottomSheet = ({
  open,
  onClose,
  comments,
  toggleReactionOnComment,
}: CommentBottomSheetProps) => {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
    >
      <div className="w-full min-h-[75%] flex flex-col bg-surface-card rounded-tl-xl rounded-tr-xl cursor-default">
        {/* 댓글 헤더 */}
        <div className="sticky top-0 z-10 bg-surface-card border-b border-surface-subtle px-4 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">댓글</h3>
            <div className="text-sm text-text-secondary">
              {comments?.length || 0}개
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="flex-1 overflow-y-auto">
          {comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-text-tertiary">💬</span>
              </div>
              <p className="text-text-secondary text-sm">아직 댓글이 없어요</p>
              <p className="text-text-tertiary text-xs mt-1">
                첫 번째 댓글을 남겨보세요
              </p>
            </div>
          ) : (
            <div className="pb-3 space-y-2">
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={{
                    userName: comment.userName,
                    avatarUrl: comment.avatarUrl,
                  }}
                  reactions={comment.reactions}
                  onReactionClick={toggleReactionOnComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default CommentBottomSheet;
