import { auth } from '@/auth';
import { getDefaultRouteForRole } from '@/lib/routes';
import { redirect } from 'next/navigation';

export default async function LegacyLoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  redirect('/signin');
}
