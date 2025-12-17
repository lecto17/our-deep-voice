'use client';
import React, { useEffect } from 'react';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/config/toastMessages';

type UserProfileProps = {
  channelId: string;
};

const UserProfile = ({ channelId }: UserProfileProps) => {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { user, updateUserProfile, isUpdatingProfile } = useUser(channelId);

  useEffect(() => {
    if (user != null) {
      setNickname(user.userName || '');
      setPreviewUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);

      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        toast.success(TOAST_MESSAGES.PROFILE_IMAGE_SELECT_SUCCESS);
      };
      reader.onerror = () => {
        toast.error(TOAST_MESSAGES.IMAGE_LOAD_ERROR);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error(TOAST_MESSAGES.PROFILE_NICKNAME_EMPTY_ERROR);
      return;
    }

    try {
      await updateUserProfile({
        userName: nickname.trim(),
        avatarFile: profileImage,
      });
      router.push(`/channels/${channelId}/onboarding/complete`);
    } catch (error) {
      console.error('Onboarding failed:', error);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex items-center justify-center p-2">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">프로필 설정</h1>
          <p className="text-gray-600">닉네임과 프로필 이미지를 설정해주세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* 프로필 이미지 업로드 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="프로필 미리보기"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>

              <label
                htmlFor="profile-image"
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </label>

              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={inputRef}
              />
            </div>

            <p className="text-sm text-gray-500 text-center">
              프로필 이미지를 선택해주세요 (선택사항)
            </p>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              닉네임 *
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={20}
              required
            />
            <p className="mt-1 text-xs text-gray-500">{nickname.length}/20</p>
          </div>

          {/* 버튼들 */}
          <div className="flex">
            <button
              type="submit"
              disabled={!nickname.trim() || isUpdatingProfile}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdatingProfile ? '처리 중...' : '완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
