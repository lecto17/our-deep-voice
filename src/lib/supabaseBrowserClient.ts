import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// 싱글톤 패턴: 브라우저에서 하나의 클라이언트 인스턴스만 사용
let client: SupabaseClient | undefined;

export function createClient() {
  if (client) {
    return client;
  }

  console.log('[Supabase] 클라이언트 생성 중...', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    },
  );

  console.log('[Supabase] 클라이언트 생성 완료');

  return client;
}
