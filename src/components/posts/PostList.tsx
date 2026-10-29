'use client';
import { LOADING_BAR_COLOR } from '@/constants/color';
import PostCard from '@/components/posts/PostCard';
import PostSkeleton from '@/components/posts/PostSkeleton';
import GridSpinner from '@/components/spinner/GridSpinner';
import usePosts from '@/hooks/usePosts';
import { useSearchParams } from 'next/navigation';
import { getDateYYYYMMDDWithDash } from '@/utils/utils';
import { useCallback, useState } from 'react';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import NewPostsBanner from '@/components/posts/NewPostsBanner';
import { motion } from 'framer-motion';
import { SupaPost } from '@/types/post';

interface IntersectAreaProps {
  onIntersect: () => void;
  isLoading?: boolean;
}

const IntersectArea = ({
  onIntersect,
  isLoading = false,
}: IntersectAreaProps) => {
  const ref = useInfiniteScroll(onIntersect);

  return (
    <div
      ref={ref}
      className="h-10 w-full flex justify-center items-center"
    >
      {isLoading && <GridSpinner color={LOADING_BAR_COLOR} />}
    </div>
  );
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type Props = {
  channelId: string;
  // 서버에서 조회한 첫 페이지 (조회한 날짜와 함께 받는다)
  initialData?: { date: string; posts: SupaPost[] };
};

const PostList = ({ channelId, initialData }: Props) => {
  const date =
    useSearchParams().get('date') ||
    getDateYYYYMMDDWithDash().replaceAll('-', '');

  console.log('[PostList] 렌더링됨:', { channelId, date });

  // 첫 진입 때 서버에서 그린 게시글은 등장 애니메이션 없이 바로 보여준다
  // (투명도 0으로 시작하면 하이드레이션 전까지 보이지 않는다). 마운트 시점에 한 번만 정한다
  const [ssrPostIds] = useState(
    () =>
      new Set(
        initialData?.date === date ? initialData.posts.map((p) => p.id) : [],
      ),
  );

  const {
    posts,
    isLoading,
    addCommentOnPost,
    toggleReactionOnPost,
    setSize,
    isLoadingMore,
    newPostsCount,
    handleRefresh,
  } = usePosts(
    channelId,
    date,
    // 다른 날짜로 이동한 직후 이전 날짜의 데이터가 보이지 않도록 날짜가 같을 때만 쓴다
    initialData?.date === date ? initialData.posts : undefined,
  );

  console.log('[PostList] usePosts 결과:', {
    postsCount: posts?.length,
    newPostsCount,
    isLoading,
  });

  const handleIntersect = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  return (
    <>
      <NewPostsBanner
        count={newPostsCount}
        onRefresh={handleRefresh}
      />
      <motion.ul
        className="flex flex-col items-center h-full min-h-full overflow-y-auto p-5 space-y-6 pb-32 bg-surface-page bg-opacity-50"
        variants={container}
        initial={ssrPostIds.size ? false : 'hidden'}
        animate="show"
      >
        {/* 초기 데이터가 있으면 SWR이 isLoading을 true로 주더라도 게시글을 바로 보여준다 */}
        {isLoading && !posts.length ? (
          <div className="w-full flex flex-col items-center mt-4">
            {/* Show 3 skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts != null && posts.length > 0 ? (
          <>
            {posts.map((post, idx) => (
              <motion.li
                key={post.id}
                variants={item}
                // 나중에 추가되는 게시글(날짜 이동, 무한 스크롤)은 부모의 initial={false}를 물려받지 않도록 명시한다
                initial={ssrPostIds.has(post.id) ? false : 'hidden'}
                className="w-full flex justify-center"
              >
                <PostCard
                  key={post.id}
                  post={post}
                  priority={idx < 2}
                  addCommentOnPost={addCommentOnPost}
                  toggleReactionOnPost={toggleReactionOnPost}
                />
              </motion.li>
            ))}
            <IntersectArea
              onIntersect={handleIntersect}
              isLoading={isLoadingMore}
            />
          </>
        ) : (
          <motion.div
            variants={item}
            className="w-full flex flex-col items-center justify-center mt-20 text-center px-4"
          >
            <div className="relative mb-6">
              <div className="text-8xl">📭</div>
              <motion.div
                className="absolute -top-2 -right-2 text-4xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                ✨
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-3">
              아직 게시글이 없어요
            </h3>
            <p className="text-text-secondary text-base mb-6 whitespace-pre-line max-w-md">
              {'해당 일자에 게시글이 없습니다.\n가장 먼저 이야기를 들려주세요!'}
            </p>
            <div className="bg-surface-subtle/50 border border-surface-subtle rounded-2xl px-6 py-4 max-w-sm">
              <p className="text-text-tertiary text-sm">
                💡 첫 번째로 일상을 공유해보세요
              </p>
            </div>
          </motion.div>
        )}
      </motion.ul>
    </>
  );
};

export default PostList;
