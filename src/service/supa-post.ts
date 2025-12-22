import { RawSupaPost, SupaComment, SupaPost } from '@/types/post';
import { objectMapper } from '@/utils/mapper';
import { serverSupabase } from '@/lib/supabaseServerClient';

export const getPosts = async (
  date: string,
  channelId: string,
  page: number,
  limit: number,
  userId?: string,
) => {
  const client = await serverSupabase();

  // posts 테이블과 users 테이블로 만든 뷰에서 게시글 조회
  const { data: posts, error } = await client
    .from('posts_enriched')
    .select('*')
    .eq('channel_id', channelId)
    .gte('created_at', `${date}T00:00:00.000`)
    .lte('created_at', `${date}T23:59:59.999`)
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) throw error;

  // userId가 있는 경우, 해당 유저의 리액션 정보를 별도로 조회하여 병합
  if (userId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: myReactions } = await client
      .from('post_reactions')
      .select('post_id, emoji')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (myReactions && myReactions.length > 0) {
      posts.forEach((post) => {
        // 내 리액션 찾기
        const myPostReactions = myReactions.filter(
          (r) => r.post_id === post.id,
        );

        myPostReactions.forEach((myReaction) => {
          // reactions 배열 확인 (JSONB 컬럼)
          if (Array.isArray(post.reactions)) {
            const existingReaction = post.reactions.find(
              (r: any) => r.emoji === myReaction.emoji,
            );

            if (existingReaction) {
              // 이미 해당 이모지 리액션 그룹이 있다면, user_id_list에 내 ID 추가
              // (API에서 reactedByMe 계산 시 사용됨)
              if (
                Array.isArray(existingReaction.reaction_user_id_list) &&
                !existingReaction.reaction_user_id_list.includes(userId)
              ) {
                existingReaction.reaction_user_id_list.push(userId);
              } else if (!existingReaction.reaction_user_id_list) {
                existingReaction.reaction_user_id_list = [userId];
              }
            } else {
              // 리액션 그룹이 없다면 새로 추가 (드문 경우)
              post.reactions.push({
                emoji: myReaction.emoji,
                count: 1,
                reaction_user_id_list: [userId],
              });
            }
          } else if (!post.reactions) {
            post.reactions = [
              {
                emoji: myReaction.emoji,
                count: 1,
                reaction_user_id_list: [userId],
              },
            ];
          }
        });
      });
    }
  }

  const postsWithCommentCount = await Promise.all(
    posts.map(async (post) => {
      const { data: comments } = await client
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .eq('channel_id', channelId);

      return { ...post, commentCount: comments?.length || 0 };
    }),
  );

  //     return { ...post, comments: _transfored };
  //   }),
  // );

  const transformedData = postsWithCommentCount?.map(objectMapper);
  return transformedData as RawSupaPost[];
};

export const getPostComments = async (id: string, channelId?: string) => {
  const client = await serverSupabase();
  const { data, error } = await client
    .from('comments_enriched')
    .select('*')
    .eq('post_id', id);
  // .eq('channel_id', channelId);

  if (error) throw error;
  return data.map(objectMapper);
};

export const addPost = async (
  post: Pick<
    SupaPost,
    'authorId' | 'caption' | 'imageKey' | 'channelId' | 'blurImageKey'
  >,
) => {
  const client = await serverSupabase();
  const { authorId, caption, imageKey, channelId, blurImageKey } = post;
  const { data, error } = await client
    .from('posts')
    .insert({
      author_id: authorId,
      caption,
      image_key: imageKey,
      blur_image_key: blurImageKey,
      channel_id: channelId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const addComment = async (
  postId: string,
  channelId: string,
  userId: string,
  comment: SupaComment,
) => {
  const client = await serverSupabase();
  const { data, error } = await client
    .from('comments')
    .insert({
      post_id: postId,
      channel_id: channelId,
      author_id: userId,
      body: comment.body,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const addReactionOnPost = async (
  postId: string,
  userId: string,
  emoji: string,
) => {
  const client = await serverSupabase();
  const {
    data: { user: authUser },
  } = await client.auth.getUser();

  const { error } = await client.from('post_reactions').insert({
    post_id: postId,
    user_id: userId,
    emoji,
  });

  if (error) throw error;

  const { data, error: selectError } = await client
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('emoji', emoji);

  if (selectError) throw selectError;

  return data;
};

export const deleteReactionOnPost = async (
  postId: string,
  userId: string,
  emoji: string,
) => {
  const client = await serverSupabase();
  const { error } = await client
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('emoji', emoji)
    .eq('user_id', userId);

  if (error) throw error;

  return true;
};
