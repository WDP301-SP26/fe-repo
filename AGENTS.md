<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

## Next.js 16 Proxy (Middleware)

**Important:** Next.js 16 renamed `middleware.ts` to `proxy.ts`. Both files serve the same purpose but Next.js only allows **one** to exist.

### File Location

- **Correct:** `apps/web/src/proxy.ts`
- **Incorrect:** `apps/web/src/middleware.ts` (will cause build error)

### Usage

The proxy file is used for:

- Route protection (authentication checks)
- Redirects based on auth state
- Request/response modification

### Example: Cookie-based Authentication

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');

  if (!authToken && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/protected/:path*'],
};
```

### Common Error

```
Error: Both middleware file "./src\src\middleware.ts" and
proxy file "./src\src\proxy.ts" are detected.
```

**Solution:** Delete `middleware.ts` and use only `proxy.ts`.

## Build Commands

### Build Web Application

```bash
pnpm exec nx run @fe-repo/web:build
```

Or using shorthand:

```bash
nx build web
```

### Common Build Issues

- **File lock error (Windows):** Clear Nx cache with `nx reset` and rebuild
- **Port mismatch:** Verify `NEXT_PUBLIC_API_URL` in `.env.local` points to correct backend port (8080)
