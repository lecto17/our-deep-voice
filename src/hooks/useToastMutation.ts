import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 토스트 메시지를 포함한 Mutation Hook
 *
 * @description
 * - 비동기 작업(Mutation)에 대한 로딩 상태 관리
 * - 성공/실패 시 자동 토스트 메시지 표시
 * - 컴포넌트에서 토스트 로직 제거하여 관심사 분리
 *
 * @example
 * ```ts
 * const { mutate, isLoading } = useToastMutation(
 *   async (data) => {
 *     return fetch('/api/post', { method: 'POST', body: JSON.stringify(data) });
 *   },
 *   {
 *     successMessage: '포스트가 작성되었습니다',
 *     errorMessage: '포스트 작성에 실패했습니다',
 *     onSuccess: (result) => router.push('/'),
 *   }
 * );
 *
 * await mutate({ text: 'Hello' });
 * ```
 */

export interface UseToastMutationOptions<TData, TVariables> {
  /** 성공 시 표시할 메시지 */
  successMessage?: string;
  /** 실패 시 표시할 메시지 */
  errorMessage?: string;
  /** 성공 시 실행할 콜백 */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** 실패 시 실행할 콜백 */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  /** 작업 완료 후 항상 실행할 콜백 */
  onSettled?: (
    data: TData | undefined,
    error: Error | undefined,
    variables: TVariables
  ) => void | Promise<void>;
}

export const useToastMutation = <TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseToastMutationOptions<TData, TVariables>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [data, setData] = useState<TData | undefined>();

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await mutationFn(variables);
        setData(result);

        // 성공 토스트
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        // 성공 콜백
        await options?.onSuccess?.(result, variables);

        // settled 콜백
        await options?.onSettled?.(result, undefined, variables);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // 실패 토스트
        if (options?.errorMessage) {
          toast.error(options.errorMessage);
        }

        // 실패 콜백
        await options?.onError?.(error, variables);

        // settled 콜백
        await options?.onSettled?.(undefined, error, variables);

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setError(undefined);
    setData(undefined);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
};
