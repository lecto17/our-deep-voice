import { useClickOutside } from '@/hooks/useClickOutside';
import { useRef, useState } from 'react';
import { VscReactions } from 'react-icons/vsc';
import { REACTION_BAR_ITEMS } from '@/types/reaction';
import { motion } from 'framer-motion';

type ReactionSelectorProps = {
  onReactionClick: (postId: string, reaction: string) => void;
  postOrCommentId: string;
};

const ReactionSelector = ({
  onReactionClick,
  postOrCommentId,
}: ReactionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setIsOpen(false));

  const handleReaction = (reaction: string) => {
    onReactionClick(postOrCommentId, reaction);
    setIsOpen(false); // 리액션 선택 후 드롭다운 닫기
  };

  return (
    <div
      ref={containerRef}
      className="flex relative"
    >
      <VscReactions
        onClick={toggleOpen}
        size={24}
        className="cursor-pointer w-fit"
      />

      <ul
        className={`flex absolute left-7 bottom-0 bg-white space-x-2 rounded-md shadow-md px-2 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        {REACTION_BAR_ITEMS.map((item) => (
          <motion.li
            key={item.id}
            className="text-lg p-1 cursor-pointer hover:bg-gray-100 rounded-md"
            onClick={() => handleReaction(item.icon)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {item.icon}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default ReactionSelector;
