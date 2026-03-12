'use client';

import { Icons } from '@/components/icons';
import Section from '@/components/section';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CtaSection() {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getDashboardHref = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'lecturer') return '/lecturer';
    if (role === 'admin') return '/dashboard/admin';
    return '/student';
  };

  return (
    <Section
      id="cta"
      title="Ready to get started?"
      subtitle="Start your free trial today."
      className="bg-primary/10 rounded-xl py-16"
    >
      <div className="flex flex-col w-full sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
        {!isMounted ? (
          <div className="h-10 w-[160px] bg-primary/20 animate-pulse rounded-md" />
        ) : isAuthenticated ? (
          <Link
            href={getDashboardHref()}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full sm:w-auto text-background flex gap-2',
            )}
          >
            <Icons.logo className="h-6 w-6" />
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full sm:w-auto text-background flex gap-2',
            )}
          >
            <Icons.logo className="h-6 w-6" />
            Get started for free
          </Link>
        )}
      </div>
    </Section>
  );
}
