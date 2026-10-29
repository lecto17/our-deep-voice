import { Suspense } from 'react';
import DateList from '../date/DateList';
import PostListWithInitialData from '../posts/PostListWithInitialData';
import PostSkeleton from '../posts/PostSkeleton';
import AvatarLocalNav from '../navigation/AvatarLocalNav';
import InfoPanel from '../ui/InfoPanel';

type Props = {
  channelId: string;
  date: string;
  userId: string;
};

export default function Home({ channelId, date, userId }: Props) {
  // // SWR로 프로필 정보 가져오기 (캐시에서 즉시 로드)
  // const { data: profile, isLoading: profileLoading } = useSWR(
  //   user?.id ? `/api/profile/${user.id}` : null,
  // );

  // if (profileLoading) {
  //   return <div>로딩 중...</div>;
  // }

  if (channelId == null) {
    return <div>ChannelId is required</div>;
  }

  return (
    <section className="w-full h-full flex flex-col sm:flex-row max-w-[850px]">
      <div className="w-full h-full flex flex-col sm:basis-3/4 overflow-hidden bg-gray-100 relative">
        {/* <StoryList /> */}
        <DateList />
        {/* 첫 페이지 게시글은 서버에서 조회해 스트리밍하고, 그동안 스켈레톤을 보여준다 */}
        <Suspense fallback={<PostListFallback />}>
          <PostListWithInitialData
            channelId={channelId}
            date={date}
            userId={userId}
          />
        </Suspense>
      </div>
      <div className="hidden sm:block h-full bg-gray-100 basis-1/4 ml-8 border-l border-gray-200">
        <AvatarLocalNav channelId={channelId} />
        <InfoPanel />
      </div>
    </section>
  );
}

// PostList의 로딩 상태와 같은 모양
const PostListFallback = () => (
  <div className="flex flex-col items-center h-full min-h-full overflow-y-auto p-5 space-y-6 pb-32 bg-surface-page bg-opacity-50">
    <div className="w-full flex flex-col items-center mt-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  </div>
);
