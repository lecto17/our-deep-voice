import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/actions/action';

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return redirect('/auth/login');
  }

  console.log('redirect to channels');

  return redirect('/channels');
}
