'use client';

import { useEffect } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/mocks/browser').then(({ startMockServiceWorker }) => {
        startMockServiceWorker()
          .then(() => {
            console.log('✅ MSW is ready');
          })
          .catch((error) => {
            console.error('Failed to start MSW:', error);
          });
      });
    }
  }, []);

  return <>{children}</>;
}
