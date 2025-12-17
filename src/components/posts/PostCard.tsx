'use client';

import CommentCount from '@/components/comment/CommentCount';
import CommentForm from '@/components/comment/CommentForm';
import ModalContainer from '@/components/modal/ModalContainer';
import ModalPortal from '@/components/portal/ModalPortal';
import PostDetail from '@/components/posts/PostDetail';
import PostUserAvatar from '@/components/posts/PostUserAvatar';
import { SupaComment, SupaPost } from '@/types/post';
import { parseDate } from '@/utils/utils';
import { useState } from 'react';
import ReactionSelector from '../ui/reaction/ReactionSelector';
import ReactionList from '../ui/reaction/ReactionList';
import usePosts from '@/hooks/usePosts';
import { useParams, useSearchParams } from 'next/navigation';
import useComment from '@/hooks/useComment';
import CommentBottomSheet from '../comment/CommentBottomSheet';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/utils/blur-placeholder';

interface PostCardProps {
  post: SupaPost;
  priority?: boolean;
  addCommentOnPost: (comment: SupaComment, postId: string) => void;
}

const location = 'Incheon, Korea';

const PostCard = ({ post, priority, addCommentOnPost }: PostCardProps) => {
  const [showable, setShowable] = useState(false);
  const pathParams = useSearchParams();
  const date = pathParams.get('date');
  const { channelId } = useParams();

  const { toggleReactionOnPost } = usePosts(channelId as string, date || '');

  const {
    comments,
    showBottomCommentSection,
    toggleBottomCommentSection,
    toggleReactionOnComment,
  } = useComment(post.id);

  const showPostModal = () => {
    setShowable(true);
  };

  const {
    id,
    createdAt,
    imageKey,
    blurImageKey,
    authorId,
    caption,
    commentCount,
    author: { userName, avatarUrl },
    reactions,
  } = post;

  return (
    <article className="border border-gray-200 shadow-md rounded-lg p-3 mb-3 w-[90%] min-w-[320px] sm:min-w-[468px]">
      <div className="flex w-fit items-center mb-3">
        <PostUserAvatar
          user={{
            userName,
            avatarUrl,
          }}
          location={location}
        />
      </div>
      {imageKey && (
        <div className="w-full flex justify-center">
          <Image
            className="max:w-[320px] sm:max-w-[468px] object-cover aspect-square hover:cursor-pointer"
            src={imageKey}
            width={468}
            height={468}
            sizes="(max-width: 640px) 320px, 468px"
            quality={90}
            alt={`photo by ${authorId}`}
            fetchPriority={priority ? 'high' : 'low'}
            onClick={showPostModal}
            loading={priority ? 'eager' : 'lazy'}
            placeholder={blurImageKey ? 'blur' : 'empty'}
            blurDataURL={blurImageKey || BLUR_DATA_URL}
          />
        </div>
      )}
      {showable && (
        <ModalPortal>
          <ModalContainer onClose={() => setShowable(false)}>
            <PostDetail
              key={id}
              post={post}
              onReactionClick={toggleReactionOnPost}
            />
          </ModalContainer>
        </ModalPortal>
      )}
      <div className="my-2">
        <ReactionSelector
          onReactionClick={toggleReactionOnPost}
          postOrCommentId={post.id}
        />
      </div>

      <ReactionList
        postOrCommentId={post.id}
        reactions={reactions}
        onReactionClick={toggleReactionOnPost}
      />
      <div className="py-2">
        <p className="flex items-center whitespace-pre-line mb-1 sm:mb-2">
          {caption}
        </p>
        <p className="mb-2 sm:mb-5 text-gray-400 text-sm">
          {parseDate(createdAt)}
        </p>
        <CommentCount
          countOfComments={commentCount}
          onClick={toggleBottomCommentSection}
        />
        <CommentForm
          postId={post.id}
          onSubmit={addCommentOnPost}
        />
      </div>
      {showBottomCommentSection && (
        <CommentBottomSheet
          open={showBottomCommentSection}
          onClose={toggleBottomCommentSection}
          comments={comments || []}
          toggleReactionOnComment={toggleReactionOnComment}
        />
      )}
    </article>
  );
};

export default PostCard;
