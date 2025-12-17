import useUser from '@/hooks/useUser';
// import { Comment, SupaComment } from '@/types/post';
import { SupaComment } from '@/types/post';
// import { useSession } from "next-auth/react";
import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/config/toastMessages';

type CommentFormProps = {
  postId: string;
  formStyle?: string;
  // onSubmit: (comment: Comment, postId: string) => void;
  onSubmit: (comment: SupaComment, postId: string) => void;
};

const CommentForm = ({ postId, formStyle, onSubmit }: CommentFormProps) => {
  const { channelId }: { channelId: string } = useParams();

  const { user: userProfile } = useUser(channelId);
  const [value, setValue] = useState('');

  const handleChangeValue = useCallback((e: React.ChangeEvent) => {
    const comment = (e.target as HTMLInputElement).value;
    setValue(comment);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // 공백의 경우 early return 하여 UX 개선
    if (value.trim() === '') {
      toast.error(TOAST_MESSAGES.COMMENT_EMPTY_ERROR);
      return;
    }

    onSubmit(
      {
        body: value,
        userName: userProfile?.userName || '',
        avatarUrl: userProfile?.avatarUrl || '',
        reactions: [],
        channelId,
      },
      postId,
    );
    setValue('');
  };

  return (
    <form
      className={`flex w-full ${formStyle}`}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="댓글을 달아보세요🙂"
        aria-label="댓글 입력"
        className="w-full py-2 pr-4 outline-none text-sm"
        value={value}
        onChange={handleChangeValue}
      />
      <input
        type="submit"
        value="게시"
        className={`py-1 px-2 font-bold hover:text-black rounded-md text-sm cursor-pointer transition-all duration-300 ${
          value.trim().length ? 'text-sky-400' : 'text-gray-400'
        }`}
        disabled={!value.trim()}
      />
    </form>
  );
};

export default CommentForm;
