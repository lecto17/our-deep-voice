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
import { format, register } from 'timeago.js';
import ko from 'timeago.js/lib/lang/ko';

register('ko', ko);

import ReactionSelector from '../ui/reaction/ReactionSelector';
import ReactionList from '../ui/reaction/ReactionList';
import { useParams, useSearchParams } from 'next/navigation';
import useComment from '@/hooks/useComment';
import CommentBottomSheet from '../comment/CommentBottomSheet';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/utils/blur-placeholder';

interface PostCardProps {
  post: SupaPost;
  priority?: boolean;
  addCommentOnPost: (comment: SupaComment, postId: string) => void;
  toggleReactionOnPost: (postId: string, emoji: string) => void;
}

const location = 'Incheon, Korea';

const PostCard = ({
  post,
  priority,
  addCommentOnPost,
  toggleReactionOnPost,
}: PostCardProps) => {
  const [showable, setShowable] = useState(false);
  const pathParams = useSearchParams();
  const date = pathParams.get('date');
  const { channelId } = useParams();

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
    <article className="bg-surface-card border border-surface-subtle shadow-md hover:shadow-lg transition-shadow duration-300 rounded-3xl p-6 mb-4 w-[90%] min-w-[320px] sm:min-w-[468px]">
      <div className="flex w-fit items-center mb-4">
        <PostUserAvatar
          user={{
            userName,
            avatarUrl,
          }}
          avatarSize="middle"
          location={location}
        >
          <span className="text-text-tertiary text-xs mt-0.5">
            {format(createdAt, 'ko')}
          </span>
        </PostUserAvatar>
      </div>
      {imageKey && (
        <div className="w-full flex justify-center mb-4">
          <Image
            className="w-full max-w-[468px] object-cover aspect-square rounded-2xl hover:cursor-pointer hover:brightness-105 transition-all duration-300"
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

      <div className="mb-4">
        <p
          className={`whitespace-pre-line text-text-primary ${
            caption.length < 50 ? 'text-lg font-medium' : 'text-base'
          }`}
        >
          {caption}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-surface-subtle">
        <div className="flex items-center gap-2">
          <ReactionSelector
            onReactionClick={toggleReactionOnPost}
            postOrCommentId={post.id}
          />
          <ReactionList
            postOrCommentId={post.id}
            reactions={reactions}
            onReactionClick={toggleReactionOnPost}
          />
        </div>

        <div className="flex items-center gap-2">
          <CommentCount
            countOfComments={commentCount}
            onClick={toggleBottomCommentSection}
          />
        </div>
      </div>

      <div className="mt-3">
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
