'use client';

import React, { useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { toast } from 'sonner';

type CreateChannelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: () => void;
};

const useCreatChannelModal = (
  onClose: () => void,
  onChannelCreated: () => void,
) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    password: '',
    isPrivate: false,
  });

  useClickOutside(modalRef, onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('채널명과 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          password: formData.password.trim(),
          isPrivate: formData.isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error('채널 생성에 실패했습니다.');
      }

      // const newChannel = await response.json();
      // onChannelCreated(newChannel);
      onChannelCreated();

      // 폼 초기화
      setFormData({
        name: '',
        description: '',
        password: '',
        isPrivate: false,
      });
      onClose();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('채널 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isPrivate' ? !!value : value,
    }));
  };

  return {
    modalRef,
    handleSubmit,
    handleInputChange,
    formData,
    setFormData,
    isLoading,
  };
};

export default function CreateChannelModal({
  isOpen,
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  const {
    modalRef,
    handleSubmit,
    handleInputChange,
    formData,
    setFormData,
    isLoading,
  } = useCreatChannelModal(onClose, onChannelCreated);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg w-full max-w-md"
        ref={modalRef}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            새 채널 만들기
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4"
        >
          {/* 채널명 */}
          <div className="flex w-full min-h-32 justify-between gap-4">
            <div className="flex-1 basis-1/2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                채널명 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="채널명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
                required
              />
            </div>
            <div className="flex-1 basis-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                채널 공개 여부 *
              </label>
              <div className="flex items-center justify-between bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isPrivate: false }))
                  }
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    !formData.isPrivate
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  공개
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, isPrivate: true }))
                  }
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    formData.isPrivate
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  비공개
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formData.isPrivate ? (
                  <span className="flex items-baseline">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    비공개 채널 - 채널 목록에 노출되지 않습니다.
                  </span>
                ) : (
                  <span className="flex items-baseline">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    공개 채널 - 채널 목록에 노출됩니다.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 채널 설명 */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              채널 설명 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="채널에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={200}
              required
            />
          </div>

          {/* 비밀번호 (선택사항) */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호 (선택사항)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              비밀번호를 설정하면 해당 채널에 입장할 때 필요합니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '생성 중...' : '채널 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
