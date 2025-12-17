import { RawSupaPost, SupaComment, SupaPost } from '@/types/post';
import { objectMapper } from '@/utils/mapper';
import { serverSupabase } from '@/lib/supabaseServerClient';

export const getPosts = async (
  date: string,
  channelId: string,
  page: number,
  limit: number,
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

  // const postsWithComments = await Promise.all(
  //   posts.map(async (post) => {
  //     const { data: comments } = await client
  //       .from('comments')
  //       .select(
  //         `
  //           id, post_id, author_id, body, created_at
  //         `,
  //       )
  //       .eq('post_id', post.id)
  //       .eq('is_deleted', false)
  //       .order('created_at', { ascending: false });
  //     const _transfored = comments?.map(objectMapper) || [];
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
