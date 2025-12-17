import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  setModalOpen?: (isOpen: boolean) => void;
};

export const useChannelHomeManageAction = ({ setModalOpen }: Props) => {
  const router = useRouter();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const handleSetActiveChannelId = (channelId: string) => {
    setActiveChannelId(channelId);
  };

  const handleCheckPassword = async (password: string, channelId?: string) => {
    const targetChannelId = channelId || activeChannelId;
    if (targetChannelId === null) return false;

    try {
      const response = await fetch(
        `/api/channels/${targetChannelId}/check-password`,
        {
          method: 'POST',
          body: JSON.stringify({ password }),
        },
      );

      if (response.status === 401) {
        toast.error('비밀번호가 일치하지 않습니다.');
        return false;
      }

      if (!response.ok) {
        toast.error('비밀번호 확인에 실패하였습니다.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking password:', error);
      toast.error('비밀번호 확인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleParticipateChannel = async (channelId?: string) => {
    const targetChannelId = channelId || activeChannelId;
    if (targetChannelId === null) return;

    try {
      const response = await fetch(`/api/channels/${targetChannelId}/join`, {
        method: 'POST',
        body: JSON.stringify({ channelId: targetChannelId }),
      });
      if (response.ok) {
        router.push(`/channels/${targetChannelId}`);
      }
    } catch (error) {
      console.error('Error participating channel:', error);
      toast.error('채널 참여에 실패했습니다.');
    }
  };

  // 채널 참여/탈퇴
  const handleChannelAction = async (
    e: React.MouseEvent<HTMLButtonElement>,
    channelId: string,
    action: 'PARTICIPATE' | 'LEAVE',
    joinedStatus: boolean,
    needsPassword?: boolean,
  ) => {
    // 상위 Link 태그 기본 이동과 이벤트 버블링 방지
    e.preventDefault();
    e.stopPropagation();
    try {
      if (
        (action === 'PARTICIPATE' && joinedStatus) ||
        (action === 'PARTICIPATE' && !joinedStatus && !needsPassword)
      ) {
        return router.push(`/channels/${channelId}`);
      }

      if (action === 'PARTICIPATE' && !joinedStatus && needsPassword) {
        setActiveChannelId(channelId);
        setModalOpen?.(true);
        return;
      }

      const response = await fetch(`/api/channels/${channelId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 채널 탈퇴 시 채널 목록 새로고침
        window.location.reload();
      } else {
        toast.error(
          action === 'LEAVE'
            ? '채널 탈퇴에 실패했습니다.'
            : '채널 참여에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('Error handling channel action:', error);
      toast.error('오류가 발생했습니다.');
    }
  };

  // 새 채널 생성 후 처리
  const handleChannelCreated = () => {
    window.location.reload();
  };

  return {
    handleCheckPassword,
    handleParticipateChannel,
    handleChannelAction,
    handleChannelCreated,
    handleSetActiveChannelId,
  };
};
