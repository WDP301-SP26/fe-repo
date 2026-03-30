'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildNavigationLabel } from '@/lib/navigation';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface PortalHeaderProps {
  scope: 'student' | 'lecturer' | 'admin';
}

export function PortalHeader({ scope }: PortalHeaderProps) {
  const pathname = usePathname();
  const { rootLabel, pageLabel } = buildNavigationLabel(scope, pathname);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Image
        src="/brand/jihub.svg"
        alt="JiHub logo"
        width={32}
        height={32}
        className="h-6 w-6 rounded-sm sm:h-7 sm:w-7 md:h-8 md:w-8"
      />

      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-lg leading-tight">{pageLabel}</span>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">{rootLabel}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
