import PostList from '@/components/posts/PostList';
import { getFeedPosts } from '@/service/supa-post';
import { SupaPost } from '@/types/post';

type Props = {
  channelId: string;
  date: string;
  userId: string;
};

// 첫 페이지 게시글을 서버에서 조회해 PostList의 초기 데이터로 넘긴다
const PostListWithInitialData = async ({ channelId, date, userId }: Props) => {
  let posts: SupaPost[] | undefined;
  try {
    posts = await getFeedPosts(date, channelId, 0, 10, userId);
  } catch (error) {
    // 서버 조회가 실패하면 기존처럼 클라이언트에서 조회한다
    console.error('[PostListWithInitialData] 첫 페이지 조회 실패:', error);
  }

  return (
    <PostList
      channelId={channelId}
      initialData={posts && { date, posts }}
    />
  );
};

export default PostListWithInitialData;
