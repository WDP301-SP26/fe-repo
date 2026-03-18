'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildNavigationLabel } from '@/lib/navigation';
import { usePathname } from 'next/navigation';

interface PortalHeaderProps {
  scope: 'student' | 'lecturer' | 'admin';
}

export function PortalHeader({ scope }: PortalHeaderProps) {
  const pathname = usePathname();
  const { rootLabel, pageLabel } = buildNavigationLabel(scope, pathname);

  return (
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
  );
}
