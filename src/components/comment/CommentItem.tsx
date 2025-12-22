'use client';

import Avatar from '@/components/avatar/Avatar';
import { SupaComment } from '@/types/post';
import { SupaUserProfile } from '@/types/user';
import ReactionList from '../ui/reaction/ReactionList';
import { TransformedReactionStats } from '@/types/reaction';
import ReactionSelector from '../ui/reaction/ReactionSelector';
import { parseDate } from '@/utils/utils';
import { motion } from 'framer-motion';

type CommentItemProps = {
  comment: SupaComment;
  user: Pick<SupaUserProfile, 'avatarUrl' | 'userName'>;
  reactions: TransformedReactionStats[];
  onReactionClick: (postOrCommentId: string, reaction: string) => void;
};

const CommentItem = ({
  comment: { body, id, createdAt },
  user,
  reactions,
  onReactionClick,
}: CommentItemProps) => {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-surface-subtle transition-colors duration-200"
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex-shrink-0">
          <Avatar
            user={user}
            size="xs"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* 사용자명과 댓글 내용 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-text-primary text-sm">
                  {user?.userName}
                </span>
                <span className="text-xs text-text-tertiary">•</span>
                <span className="text-xs text-text-secondary">
                  {parseDate(createdAt || '')}
                </span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed break-words">
                {body}
              </p>
            </div>
          </div>

          {/* 반응 버튼들 */}
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center space-x-1">
              <ReactionList
                postOrCommentId={id!}
                reactions={reactions}
                onReactionClick={onReactionClick}
              />
              <ReactionSelector
                postOrCommentId={id!}
                onReactionClick={onReactionClick}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CommentItem;
