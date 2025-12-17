'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface NewPostsBannerProps {
  count: number;
  onRefresh: () => void;
}

export default function NewPostsBanner({
  count,
  onRefresh,
}: NewPostsBannerProps) {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <button
          onClick={onRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-200 hover:scale-105"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="font-medium">
            새 게시글 {count}개
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
