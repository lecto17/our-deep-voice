'use client';
import { LOADING_BAR_COLOR } from '@/constants/color';
import PostCard from '@/components/posts/PostCard';
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
  const {
    posts,
    isLoading,
    addCommentOnPost,
    setSize,
    isLoadingMore,
    newPostsCount,
    handleRefresh,
  } = usePosts(channelId, date);

  const handleIntersect = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  return (
    <>
      <NewPostsBanner count={newPostsCount} onRefresh={handleRefresh} />
      <ul className="flex flex-col items-center h-full min-h-full overflow-y-auto p-5 space-y-10 pb-32">
      {isLoading ? (
        <div className="w-full flex justify-center mt-32">
          <GridSpinner color={LOADING_BAR_COLOR} />
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
              />
            </li>
          ))}
          <IntersectArea
            onIntersect={handleIntersect}
            isLoading={isLoadingMore}
          />
        </>
      ) : (
        <div className="w-full flex justify-center mt-32">
          <p className="text-gray-500 whitespace-pre-line">
            {'해당 일자에 게시글이 없습니다.\n\n먼저 게시글을 등록해보세요 🙂'}
          </p>
        </div>
      )}
    </ul>
    </>
  );
};

export default PostList;
