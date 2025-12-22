import { addReactionOnPost, deleteReactionOnPost } from '@/service/supa-post';
import { getAuthenticatedUser } from '@/actions/action';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { postId, emoji } = await request.json();
  const user = await getAuthenticatedUser();
  if (!user) {
    return new Response('Authenticated Error');
  }
  return await addReactionOnPost(postId, user.id, emoji)
    .then((el) =>
      NextResponse.json({
        emoji: el[0].emoji,
        count: el.length,
        reactedByMe: el.map((el) => el.user_id).includes(user.id),
      }),
    )
    .catch((err) => new Response(JSON.stringify(err), { status: 500 }));
  // .catch((err) => console.log(err));
}
