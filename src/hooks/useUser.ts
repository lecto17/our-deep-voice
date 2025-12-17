import useSWR, { useSWRConfig } from 'swr';
import {
  DetailUser,
  OnboardingUserProfile,
  SupaUserProfile,
  UserProfile,
} from '@/types/user';
import { useToastMutation } from './useToastMutation';
import { TOAST_MESSAGES } from '@/config/toastMessages';

export default function useUser(channelId: string) {
  const key = channelId ? `/api/me?channelId=${channelId}` : null;
  const { data: user, isLoading, mutate } = useSWR<SupaUserProfile>(key);

  const {
    mutate: updateProfileMutation,
    isLoading: isUpdatingProfile,
  } = useToastMutation(
    async (data: Omit<OnboardingUserProfile, 'id'>) => {
      const formData = new FormData();
      formData.append('userName', data.userName);
      if (data.avatarFile) {
        formData.append('avatarFile', data.avatarFile as File);
      }

      return fetch(`/api/me?channelId=${channelId}`, {
        method: 'PUT',
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update profile');
        return res.json();
      });
    },
    {
      successMessage: TOAST_MESSAGES.PROFILE_UPDATE_SUCCESS,
      errorMessage: TOAST_MESSAGES.PROFILE_UPDATE_ERROR,
      onSuccess: () => {
        mutate();
      },
    }
  );

  return {
    user,
    isLoading,
    updateUserProfile: updateProfileMutation,
    isUpdatingProfile,
  };
}
