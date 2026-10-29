import { redirect } from 'next/navigation';
import { getAuthenticatedUser, getValidationOnChannel } from '@/actions/action';
import { getMyProfile } from '@/service/supa-user';
import { getDateYYYYMMDDWithDash, isValidDate } from '@/utils/utils';
import Home from '@/components/pages/Home';

type Props = {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ date: string }>;
};

const page = async ({ params, searchParams }: Props) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return redirect('/auth/login');
  }

  const { channelId } = await params;

  await getValidationOnChannel(channelId, user.id);

  const profile = await getMyProfile(user.id, channelId);
  if (profile == null || profile?.userName == null) {
    return redirect(`/channels/${channelId}/onboarding?step=1`);
  }

  // URL에서 date 파라미터 가져오기
  const { date: dateParam } = await searchParams;

  // date 파라미터가 없거나 유효하지 않으면 오늘 날짜로 리다이렉트
  if (!dateParam || !isValidDate(dateParam)) {
    const today = getDateYYYYMMDDWithDash().replaceAll('-', '');
    return redirect(`?date=${today}`);
  }

  return (
    <Home
      channelId={channelId}
      date={dateParam}
      userId={user.id}
    />
  );
};

export default page;
