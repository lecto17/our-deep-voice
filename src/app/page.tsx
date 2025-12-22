import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/actions/action';

type HomePageProps = {
  searchParams: Promise<{ date: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return redirect('/auth/login');
  }

  return redirect('/channels');
}
