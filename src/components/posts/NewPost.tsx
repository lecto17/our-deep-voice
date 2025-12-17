'use client';

import Avatar from '@/components/avatar/Avatar';
import PublishButton from '@/components/button/PublishButton';
import FileUpload from '@/components/input/FileUpload';
import Loading from '@/components/loading/Loading';
import usePosts from '@/hooks/usePosts';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useUser from '@/hooks/useUser';

const NewPost = ({ channelId }: { channelId: string }) => {
  const router = useRouter();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [file, setFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [placeholder, setPlaceholder] = useState('오늘의 일기를 적어보세요 ✍️');
  const [today, setToday] = useState<string>('');

  const { addPost } = usePosts(channelId);
  const { user: userProfile } = useUser(channelId);
  const prefixUrl = `/channels/${channelId}`;

  const handleClickPublish = async () => {
    setLoading(true);
    try {
      await addPost(textAreaRef.current?.value || '', file || undefined);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.toString());
    } finally {
      router.push(`${prefixUrl}`);
      setLoading(false);
    }
  };

  const getRandomPlaceholder = () => {
    const placeholders = [
      '오늘의 일기를 적어보세요 ✍️',
      '오늘 하루 기분을 색감으로 표현한다면 어떤 색감일까요? ✍️',
      '오늘 하루 가장 기억에 남는 순간이 있나요? 가장 크게 웃었거나 슬프거나 했던 순간들을 작성해보세요. ✍️',
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleClickPublish();
    }
  };

  // CSR 마운트 이후에만 랜덤 placeholder와 날짜를 설정하여 hydration 불일치 방지
  useEffect(() => {
    setPlaceholder(getRandomPlaceholder());
    setToday(new Date().toLocaleDateString());
  }, []);

  return (
    <div className="relative w-full h-full min-h-[60vh] p-4 sm:p-6 flex items-start justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {loading && (
        <div className="absolute z-20 inset-0 w-full h-full backdrop-blur-[2px] bg-sky-400/10">
          <Loading />
        </div>
      )}

      <div className="w-full max-w-2xl">
        {error && (
          <p className="mb-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center min-w-0">
              {userProfile ? (
                <Avatar user={userProfile} />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
              )}
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold text-neutral-800 truncate dark:text-neutral-100">
                  {userProfile?.userName ?? '불러오는 중...'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {today}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <PublishButton onClick={handleClickPublish} />
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4">
            <FileUpload
              file={file}
              onChange={setFile}
              size="sm"
            />
          </div>

          <div className="px-0 -z-10 sm:px-2 pb-4">
            <div className="mx-4 sm:mx-6 relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 shadow-inner">
              <div className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  오늘의 기록
                </p>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {today}
                </span>
              </div>

              <div className="relative px-0 pb-6">
                {/* 뒤 레이어: 공책 라인 */}
                <div
                  className="absolute inset-0 z-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(2, 132, 199, 0.12) 0, rgba(2, 132, 199, 0.12) 1px, transparent 1px, transparent 32px)',
                  }}
                />
                {/* 앞 레이어: 왼쪽 여백선 + 바인더 홀 */}
                <div className="absolute inset-y-0 left-12 w-px z-0 bg-rose-200/80 pointer-events-none" />
                <div className="absolute left-4 z-0 pointer-events-none hidden sm:block">
                  <div className="w-4 h-4 rounded-full bg-neutral-200 ring-1 ring-neutral-300/70 shadow-inner mt-6" />
                  <div className="w-4 h-4 rounded-full bg-neutral-200 ring-1 ring-neutral-300/70 shadow-inner mt-36" />
                  <div className="w-4 h-4 rounded-full bg-neutral-200 ring-1 ring-neutral-300/70 shadow-inner mt-36" />
                </div>

                {/* 텍스트 입력 영역 */}
                <div className="relative z-10 px-4 sm:px-6 pt-1">
                  <textarea
                    ref={textAreaRef}
                    aria-label="일기장 입력"
                    placeholder={placeholder}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent outline-none resize-none min-h-64 sm:min-h-80 pl-16 text-base sm:text-lg leading-[32px] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                </div>

                {/* 상단 가장자리 비네팅 */}
                <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/0 via-black/0 to-black/0 dark:from-white/0 dark:via-white/0 dark:to-white/0" />
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-5">
            <PublishButton onClick={handleClickPublish} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
