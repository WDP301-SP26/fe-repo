export async function startMockServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  const { setupWorker } = await import('msw/browser');
  const { handlers } = await import('./handlers');

  const worker = setupWorker(...handlers);

  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
    quiet: false,
  });
}
