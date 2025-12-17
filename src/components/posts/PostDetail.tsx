'use client';

import CommentForm from '@/components/comment/CommentForm';
import CommentItem from '@/components/comment/CommentItem';
import PostUserAvatar from '@/components/posts/PostUserAvatar';
// import ActionBar from '@/components/ui/ActionBar';
import useComment from '@/hooks/useComment';
import { SupaPost } from '@/types/post';
import { parseDate } from '@/utils/utils';
import { useCallback } from 'react';
import ReactionList from '../ui/reaction/ReactionList';
import ReactionSelector from '../ui/reaction/ReactionSelector';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/utils/blur-placeholder';

const PostDetail = ({
  post,
  onReactionClick,
}: {
  post: SupaPost;
  onReactionClick: (postId: string, reaction: string) => void;
}) => {
  const {
    id,
    createdAt,
    imageKey,
    blurImageKey,
    caption,
    author: { userName, avatarUrl },
    reactions,
  } = post;
  const { comments, setComment, toggleReactionOnComment } = useComment(id);

  const suppressEventBubbling = useCallback((e: React.MouseEvent<Element>) => {
    e.stopPropagation();
  }, []);

  return (
    <article
      className="w-[350px] min-h-[500px] h-[80%] flex flex-col items-center overflow-hidden rounded-md sm:pt-0 sm:w-[75%] sm:h-[90%] sm:flex-row bg-white "
      onClick={suppressEventBubbling}
    >
      {/* 상단 (프로필, 이미지) 영역 */}
      <div className="flex flex-col w-full h-[80%] sm:h-full sm:basis-3/5">
        <div className="flex items-center p-3 sm:hidden">
          <PostUserAvatar
            user={{ userName, avatarUrl }}
            noLocation
          />
        </div>
        <div className="relative w-full h-[80%] sm:h-full">
          <Image
            className="object-cover hover:cursor-pointer"
            src={imageKey}
            alt={`photo by ${userName}`}
            fill
            sizes="(max-width: 640px) 350px, 60vw"
            quality={90}
            priority
            placeholder={blurImageKey ? 'blur' : 'empty'}
            blurDataURL={blurImageKey || BLUR_DATA_URL}
          />
        </div>
      </div>
      {/* 하단 (반응, 댓글) 영역, 모바일에서는 댓글 미출력 */}
      <div className="w-full h-[20%] flex flex-col sm:h-full sm:basis-2/5">
        <div className="hidden items-center border-b border-gray-200 p-2 mb-2 sm:flex sm:w-full">
          <PostUserAvatar user={{ userName, avatarUrl }} />
        </div>
        <div className="hidden sm:flex sm:flex-col sm:p-3">
          <div className="flex items-center mb-2">
            <PostUserAvatar
              user={{ userName, avatarUrl }}
              avatarSize="xs"
              noLocation
            >
              <span>{caption}</span>
            </PostUserAvatar>
          </div>

          <ul className="comments-wrapper hidden sm:flex max-h-[128px] sm:max-h-[448px] flex-col space-y-1 overflow-y-auto">
            {comments != null &&
              comments.length > 0 &&
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={{
                    userName: comment.userName,
                    avatarUrl: comment.avatarUrl,
                  }}
                  reactions={comment.reactions}
                  onReactionClick={toggleReactionOnComment}
                />
              ))}
          </ul>
        </div>
        <div className="h-full flex flex-col flex-1 justify-end">
          <div className="flex flex-col p-3 text-sm sm:p-3 sm:text-base">
            <ReactionSelector
              onReactionClick={onReactionClick}
              postOrCommentId={post.id}
            />
            <ReactionList
              postOrCommentId={post.id}
              reactions={reactions}
              onReactionClick={onReactionClick}
            />
            <p className="mt-3 text-neutral-400">{parseDate(createdAt)}</p>
          </div>
          <div className="hidden sm:flex flex-col">
            <CommentForm
              formStyle={'border-t border-gray-300 p-1 sm:p-3'}
              postId={id}
              onSubmit={setComment}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostDetail;
