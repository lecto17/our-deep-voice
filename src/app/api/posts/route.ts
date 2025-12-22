// import { validateSession } from '@/actions/action';
import { getAuthenticatedUser } from '@/actions/action';
import { getPosts } from '@/service/supa-post';
import { getDateYYYYMMDDWithDash } from '@/utils/utils';
import { NextRequest } from 'next/server';

// export async function GET() {
//   const user = await validateSession();
//   if (!user) return new Response("not loggined", { status: 403 });
//   // const data = await getFollowingsPost(getNameByEmail(user.email));
//   const { id } = await findUserIdBy(user.email);
//   const data = await getFollowingsPost(id);
//   return new Response(JSON.stringify(data), { status: 200 });
// }

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return new Response('not loggined', { status: 403 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || getDateYYYYMMDDWithDash();
  const channelId = searchParams.get('channelId');

  const page = Number(searchParams.get('page')) || 0;
  const limit = Number(searchParams.get('limit')) || 10;

  if (!channelId) return new Response('channelId is required', { status: 400 });

  const data = await getPosts(date, channelId, page, limit, user.id);
  const formattedData = data.map((post) => {
    // console.log('[API] Post data check:', {
    //   id: post.id,
    //   reactions: post.reactions,
    // });
    return {
      ...post,
      reactions:
        post.reactions?.map(
          (reaction: {
            emoji: string;
            count: number;
            reactionUserIdList: string[];
          }) => {
            const list =
              reaction.reactionUserIdList ||
              (reaction as any).reaction_user_id_list ||
              [];
            // console.log('[API] Reaction check:', {
            //   emoji: reaction.emoji,
            //   listLength: list?.length,
            //   firstItem: list?.[0],
            //   userId: user.id
            // });
            return {
              emoji: reaction.emoji,
              count: reaction.count,
              reactedByMe: Array.isArray(list) ? list.includes(user.id) : false,
            };
          },
        ) || [],
    };
  });

  return new Response(JSON.stringify(formattedData), { status: 200 });
}
