'use client';
import { LOADING_BAR_COLOR } from '@/constants/color';
import PostCard from '@/components/posts/PostCard';
import PostSkeleton from '@/components/posts/PostSkeleton';
import GridSpinner from '@/components/spinner/GridSpinner';
import usePosts from '@/hooks/usePosts';
import { useSearchParams } from 'next/navigation';
import { getDateYYYYMMDDWithDash } from '@/utils/utils';
import { useCallback } from 'react';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import NewPostsBanner from '@/components/posts/NewPostsBanner';

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

const PostList = ({ channelId }: { channelId: string }) => {
  const date =
    useSearchParams().get('date') ||
    getDateYYYYMMDDWithDash().replaceAll('-', '');

  console.log('[PostList] 렌더링됨:', { channelId, date });

  const {
    posts,
    isLoading,
    addCommentOnPost,
    toggleReactionOnPost,
    setSize,
    isLoadingMore,
    newPostsCount,
    handleRefresh,
  } = usePosts(channelId, date);

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
      <ul className="flex flex-col items-center h-full min-h-full overflow-y-auto p-5 space-y-6 pb-32 bg-surface-page bg-opacity-50">
        {isLoading ? (
          <div className="w-full flex flex-col items-center mt-4">
            {/* Show 3 skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts != null && posts.length > 0 ? (
          <>
            {posts.map((post, idx) => (
              <li
                key={post.id}
                className="w-full flex justify-center"
              >
                <PostCard
                  key={post.id}
                  post={post}
                  priority={idx < 2}
                  addCommentOnPost={addCommentOnPost}
                  toggleReactionOnPost={toggleReactionOnPost}
                />
              </li>
            ))}
            <IntersectArea
              onIntersect={handleIntersect}
              isLoading={isLoadingMore}
            />
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center mt-32 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              아직 게시글이 없어요
            </h3>
            <p className="text-text-secondary whitespace-pre-line">
              {
                '해당 일자에 게시글이 없습니다.\n가장 먼저 이야기를 들려주세요! 🙂'
              }
            </p>
          </div>
        )}
      </ul>
    </>
  );
};

export default PostList;
