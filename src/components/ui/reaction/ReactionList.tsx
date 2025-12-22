import { TransformedReactionStats } from '@/types/reaction';
import { motion } from 'framer-motion';

type ReactionListProps = {
  postOrCommentId: string;
  reactions: TransformedReactionStats[];
  onReactionClick: (postOrCommentId: string, reaction: string) => void;
  showCount?: boolean;
  maxDisplay?: number; // 최대 표시할 리액션 개수
};

const ReactionList = ({
  postOrCommentId,
  reactions,
  onReactionClick,
  showCount = true,
  maxDisplay = 10,
}: ReactionListProps) => {
  const sortedReactions = reactions
    ?.filter((reaction) => reaction.count > 0)
    ?.sort((reactionA, reactionB) => reactionB.count - reactionA.count)
    .slice(0, maxDisplay);

  if (sortedReactions?.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {sortedReactions?.map(({ emoji, count, reactedByMe }) => {
        return (
          <motion.button
            key={emoji}
            onClick={() => onReactionClick(postOrCommentId, emoji)}
            className={`flex items-center space-x-1 rounded-full px-2 py-0.5 transition-colors cursor-pointer ${
              reactedByMe
                ? 'bg-blue-300 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            disabled={!onReactionClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <span className="text-sm sm:text-base">{emoji}</span>
            {showCount && count > 0 && (
              <span className="text-gray-600 font-medium">{count}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ReactionList;
