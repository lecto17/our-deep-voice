import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { useToastMutation } from './useToastMutation';
import { TOAST_MESSAGES } from '@/config/toastMessages';

export default function useMood() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string>('');

  const { mutate: saveMood, isLoading } = useToastMutation(
    async ({ mood, channelId }: { mood: string; channelId: string }) => {
      return fetch('/api/mood', {
        method: 'POST',
        body: JSON.stringify({ mood, channelId }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to save mood');
        return res.json();
      });
    },
    {
      successMessage: TOAST_MESSAGES.MOOD_SAVE_SUCCESS,
      errorMessage: TOAST_MESSAGES.MOOD_SAVE_ERROR,
      onSuccess: (_, variables) => {
        router.push(`/channels/${variables.channelId}/mood/response`);
      },
    }
  );

  const handleSubmit = async (e: FormEvent, channelId: string) => {
    e.preventDefault();
    if (!selectedMood) {
      toast.error(TOAST_MESSAGES.MOOD_SELECT_ERROR);
      return;
    }

    await saveMood({ mood: selectedMood, channelId });
  };

  return { handleSubmit, selectedMood, setSelectedMood, isLoading };
}
