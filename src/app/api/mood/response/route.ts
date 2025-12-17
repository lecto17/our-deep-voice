import { NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/actions/action';
import { getMoodStatistics } from '@/service/supa-mood';
import { moodMapper } from '@/constants/mood';

const getKeyByValue = (map: Map<string, number>, value: number) => {
  for (const [key, val] of map.entries()) {
    if (val === value) return key;
  }
  return null; // 없을 경우
};

export async function GET(request: NextRequest) {
  const headers = request.headers;
  const authorization = headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) return new Response('UnAuthenticated Error');

  const user = await getAuthenticatedUser(token);
  if (!user) return new Response('UnAuthenticated Error');

  // channelId를 쿼리 파라미터에서 가져옴
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  console.log('mood response route channelId', channelId);

  if (channelId == null) {
    return new Response('ChannelId is required', { status: 400 });
  }

  const data = await getMoodStatistics(user.id, channelId).catch((error) => {
    console.error('Error fetching mood statistics:', error);
    return {
      moodCountsResult: [],
      myMood: null,
      totalCounts: 0,
      error: error.message,
    };
  });

  const formattedMoodCountsResult = data.moodCountsResult.map((item) => {
    const key = parseInt(Object.keys(item)[0] || '0');
    return {
      [getKeyByValue(moodMapper, key) as string]: item[key],
    };
  });

  const formattedData = {
    moodCountsResult: Object.assign({}, ...formattedMoodCountsResult),
    myMood: getKeyByValue(moodMapper, data.myMood || 0),
    totalCounts: data.totalCounts,
  };

  return new Response(JSON.stringify(formattedData), { status: 200 });
}
