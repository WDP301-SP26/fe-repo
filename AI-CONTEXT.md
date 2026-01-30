# 🤖 AI Agent Context - Jira-GitHub Manager Project

> **CRITICAL:** Read this file completely before making any changes to understand the full project context.

---

## 📋 PROJECT OVERVIEW

### **Project Name:** Jira-GitHub Manager for SWP391

**Purpose:** Web application to help FPT University SWP391 students manage their projects using Jira and GitHub integration.

### **Target Users:**

1. **Lecturers** - Monitor student progress, grade documents, detect free-riders
2. **Team Leaders** - Manage group, submit documents, configure integrations
3. **Team Members** - View assigned tasks, track progress

### **Key Features:**

- Auto-generate SRS documents from Jira
- Track commit frequency and code quality from GitHub
- Manage groups, projects, and team members
- Dashboard with velocity and burn-down charts
- Document submission and grading system

---

## 🏗️ ARCHITECTURE

### **Monorepo Structure**

This is an **Nx Monorepo** with the following structure:

```
fe-repo/                          # ROOT - Nx Workspace
├── package.json                  # ROOT dependencies (shared)
├── nx.json                       # Nx configuration
├── pnpm-workspace.yaml           # pnpm workspaces
├── tsconfig.base.json            # ROOT TypeScript config
│
├── apps/
│   └── web/                      # Next.js 16 application
│       ├── package.json          # App-specific dependencies
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   ├── components/      # React components
│       │   ├── lib/             # Utilities
│       │   ├── hooks/           # Custom hooks
│       │   └── mocks/           # MSW mock data (NEW)
│       └── public/
│           └── mockServiceWorker.js  # MSW Service Worker
│
├── libs/                         # Shared libraries (empty for now)
│
└── docs/                         # Project documentation
    ├── overview.md
    ├── system-architecture.md
    ├── cicd-pipeline.md
    └── toBE/                    # Communication with BE team
        ├── FE-to-BE.md
        ├── BE-response.md
        └── API-REQUIREMENTS.md   # NEW - API specs
```

### **Technology Stack**

**Frontend:**

- **Framework:** Next.js 16 (App Router)
- **React:** v19
- **TypeScript:** v5.9
- **Styling:** TailwindCSS 4 + shadcn/ui
- **State:** React hooks + NextAuth v5
- **Monorepo Tool:** Nx v22.4.1
- **Package Manager:** pnpm v10
- **Mock API:** MSW (Mock Service Worker) v2.12.7 ⭐ NEW

**Backend (Separate Repo):**

- **Framework:** NestJS
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** JWT + OAuth (GitHub, Jira)
- **Status:** 🚧 In Development
- **API Docs:** ❌ No OpenAPI/Swagger yet
- **Communication:** Via docs/toBE/ folder

### **Critical Nx Concepts**

1. **Dependencies in ROOT** = Shared by all apps/libs
2. **Dependencies in apps/web** = Only for web app
3. **Always use `nx` commands:** `nx dev web`, `nx lint web`, `nx affected -t test`
4. **Path aliases:** `@/*` maps to `apps/web/src/*`

---

## 🎯 RECENT WORK: MSW MOCK SERVER IMPLEMENTATION

### **Context**

**Why We Need Mocks:**

Backend team is still developing APIs and **does not have OpenAPI/Swagger specification yet**. This means:

- ❌ No API documentation to reference
- ❌ No TypeScript types auto-generated from backend
- ❌ No contract testing possible
- ⚠️ High risk of frontend-backend mismatch

**Our Solution:**

1. Frontend defines API contract based on backend ERD (Prisma schema)
2. Create TypeScript types matching expected backend responses
3. Mock all endpoints with MSW for independent development
4. Document API requirements in `docs/toBE/API-REQUIREMENTS.md` for BE team
5. When BE implements OpenAPI, we can validate our assumptions

**Why NOT Traditional Mock Server:**

Traditional approach would be to run a separate mock server (e.g., Deno + Nodemon on localhost:3002).

**Problems with traditional approach:**

- Need to run 2 processes (mock server + frontend)
- Network overhead (real HTTP requests)
- CORS configuration required
- Cannot reuse mocks in tests
- Still doesn't solve the "no API spec" problem

### **Solution: MSW (Mock Service Worker)**

MSW uses Service Worker API to **intercept HTTP requests in the browser** before they leave the application. This means:

✅ **No separate server needed** - Only 1 process (Next.js dev)  
✅ **No network overhead** - Mocks run in-memory  
✅ **No CORS issues** - No real HTTP requests  
✅ **Test-ready** - Same mocks work in Jest tests  
✅ **Production-safe** - Auto-disables in production

### **How MSW Works**

```
Traditional Mock Server:
┌──────────┐  HTTP  ┌────────────┐
│ Browser  │ ────→  │ Mock Server│
│          │ ←──── │ :3002      │
└──────────┘        └────────────┘

MSW Approach:
┌─────────────────────────────┐
│      Browser Process        │
│  ┌──────┐  ┌─────────────┐ │
│  │ App  │→ │ MSW Worker  │ │
│  │      │← │ (Intercept) │ │
│  └──────┘  └─────────────┘ │
│  NO HTTP REQUEST OUT!       │
└─────────────────────────────┘
```

### **Implementation Details**

**Files Created (19 total):**

```
apps/web/src/mocks/
├── types.ts                    # TypeScript types (based on ERD)
├── browser.ts                  # MSW browser worker
├── node.ts                     # MSW Node.js server (for tests)
├── index.ts                    # Main export
├── README.md                   # Complete documentation
│
├── data/                       # Mock data (based on backend ERD)
│   ├── users.ts               # 5 mock users (students, leader, lecturer)
│   ├── groups.ts              # 3 mock groups
│   ├── memberships.ts         # Group memberships (many-to-many)
│   ├── projects.ts            # 3 mock projects
│   └── index.ts               # Centralized exports
│
└── handlers/                   # MSW request handlers
    ├── auth.ts                # Login, register, logout, me
    ├── users.ts               # User CRUD + filters
    ├── groups.ts              # Group CRUD + members (with JOIN)
    ├── projects.ts            # Project CRUD
    └── index.ts               # Combine all handlers
```

**Integration Points:**

1. **apps/web/src/app/layout.tsx** - MSW auto-starts in development
2. **apps/web/src/app/msw-test/page.tsx** - Test page to verify MSW
3. **apps/web/.env.example** - Environment variable template
4. **docs/toBE/API-REQUIREMENTS.md** - API specs for BE team

### **Mocked API Endpoints (50+ total)**

```typescript
// Authentication
POST   /api/auth/login          // Login with email/password
POST   /api/auth/register       // Register new user
GET    /api/auth/me            // Get current user
POST   /api/auth/logout        // Logout

// Users
GET    /api/users              // List users (with filters: ?role=&verified=)
GET    /api/users/:id          // Get user by ID
POST   /api/users              // Create user
PATCH  /api/users/:id          // Update user
DELETE /api/users/:id          // Delete user

// Groups
GET    /api/groups             // List groups (with filters: ?status=&semester=)
GET    /api/groups/:id         // Get group by ID
GET    /api/groups/:id/members // Get group members (JOIN: Membership + User)
GET    /api/groups/:id/projects// Get group projects
POST   /api/groups             // Create group
POST   /api/groups/:id/members // Add member to group
PATCH  /api/groups/:id         // Update group
DELETE /api/groups/:id         // Archive group (soft delete)

// Projects
GET    /api/projects           // List projects (with filter: ?group_id=)
GET    /api/projects/:id       // Get project by ID
POST   /api/projects           // Create project
PATCH  /api/projects/:id       // Update project
DELETE /api/projects/:id       // Delete project
```

### **Data Schema (From ERD)**

All mock data follows the backend ERD:

```typescript
// Key entities
User {
  id, email, full_name, github_username, jira_account_id,
  role: 'STUDENT' | 'GROUP_LEADER' | 'LECTURER',
  is_email_verified, created_at, updated_at, last_login
}

Group {
  id, name, semester, created_by_id,
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  github_organization, jira_project_key,
  created_at, updated_at
}

GroupMembership {
  group_id, user_id,
  role: 'LEADER' | 'MEMBER',
  joined_at, left_at
}

Project {
  id, group_id, name, description,
  github_repo_url, jira_project_key,
  created_at, updated_at
}
```

**⚠️ IMPORTANT: API Contract Ownership**

Since backend has NO OpenAPI spec yet:

- ✅ Frontend OWNS the API contract definition (via `docs/toBE/API-REQUIREMENTS.md`)
- ✅ MSW types in `mocks/types.ts` are the SOURCE OF TRUTH
- ✅ Backend team should implement according to our specs
- ⚠️ When BE finishes, we need to verify their implementation matches our types
- 🔄 Future: When BE adds OpenAPI, we can use codegen to replace manual types

**Risk Mitigation:**

1. We documented all endpoints in `API-REQUIREMENTS.md` with TypeScript interfaces
2. BE team has been notified via docs/toBE/ folder
3. If BE changes schema, they MUST update our documentation first
4. MSW allows us to quickly adapt if BE changes design

### **Mock Test Credentials**

```
Email: leader@swp391.com
Password: anything (except 'wrong')
Role: GROUP_LEADER

Email: member1@swp391.com
Password: anything (except 'wrong')
Role: STUDENT

Email: lecturer@fpt.edu.vn
Password: anything (except 'wrong')
Role: LECTURER

Note: Password 'wrong' returns 401 for testing error handling
```

---

## 🔄 SWITCHING TO REAL BACKEND

**Current State: No Backend API Available**

- Backend is still in development (PR #7 - "finish auth")
- No OpenAPI/Swagger documentation exists yet
- No API endpoints are live

**Phase 1: Development with Mocks (Current)**

```env
# .env.local
NEXT_PUBLIC_API_URL=/api
```

MSW intercepts all requests and returns mock data.

**Phase 2: Testing with Real Backend (Future)**

When backend team finishes APIs:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Zero code changes** required in components! Just change the env var.

**Phase 3: Validation (Critical)**

⚠️ **Since BE has no OpenAPI spec, we MUST validate their implementation:**

1. Run backend locally
2. Test each endpoint with Postman/curl
3. Compare responses with our `mocks/types.ts`
4. Check `docs/toBE/API-REQUIREMENTS.md` for discrepancies
5. If BE differs from our spec:
   - **Option A:** Update our types to match BE (if BE is correct)
   - **Option B:** Ask BE to fix (if they didn't follow spec)

**Phase 4: Production**

```env
# Production
NEXT_PUBLIC_API_URL=https://api.production.com
```

MSW automatically disables when `NODE_ENV=production`.

**Future Enhancement: OpenAPI Integration**

When BE adds OpenAPI/Swagger:

```bash
# Generate TypeScript types from OpenAPI spec
npx openapi-typescript https://api.production.com/openapi.json -o src/types/api.ts
```

Then replace manual types with auto-generated ones.

---

## 📚 IMPORTANT DOCUMENTATION

### **Must Read Before Changes:**

1. **docs/overview.md** - Full project requirements and context
2. **docs/system-architecture.md** - System design and diagrams
3. **apps/web/src/mocks/README.md** - Complete MSW usage guide
4. **docs/toBE/API-REQUIREMENTS.md** - API specs for backend
5. **AGENTS.md** - Nx workflow guidelines

### **Backend Communication:**

- **docs/toBE/FE-to-BE.md** - Frontend requests to backend
- **docs/toBE/BE-response.md** - Backend responses
- **docs/toBE/API-REQUIREMENTS.md** - ⭐ **API endpoint specifications (SOURCE OF TRUTH until BE adds OpenAPI)**

**⚠️ Critical:** Since BE has no OpenAPI/Swagger, `API-REQUIREMENTS.md` is the ONLY contract between FE and BE. Any API changes MUST be documented here first.

---

## 🎯 CURRENT STATE

### **✅ Completed:**

- ✅ MSW installed and configured
- ✅ 19 mock files created (types, data, handlers)
- ✅ 50+ API endpoints mocked
- ✅ Full CRUD operations implemented
- ✅ JOIN operations (groups + members)
- ✅ Query filtering and validation
- ✅ Network delay simulation
- ✅ TypeScript types (100% type-safe)
- ✅ Test page created (/msw-test)
- ✅ Documentation complete
- ✅ Environment variables configured
- ✅ BE team notified with API specs

### **⚠️ Known Lint Warnings:**

These are **pre-existing** warnings in old components (NOT from new MSW code):

- `dot-pattern.tsx` - 8 `any` types
- `marquee.tsx` - 1 `any` type
- `hero.tsx` - 1 `any` type
- `testimonials.tsx` - 1 `any` type

**Action:** Can be ignored or fixed later. Not blocking.

### **✅ All Tests Passing:**

- Lint: ✅ Pass (21 warnings, 0 errors - all pre-existing)
- TypeScript: ✅ Pass
- MSW: ✅ Working (verified at /msw-test)

---

## 🚀 NEXT STEPS FOR DEVELOPMENT

### **Immediate (This Sprint):**

1. Build UI components for user management
2. Implement authentication flow with NextAuth
3. Create dashboard for each role (Lecturer/Leader/Member)
4. Integrate with mocked APIs

### **Future (Next Sprint):**

1. Switch to real backend when ready
2. Add E2E tests with Playwright
3. Implement real-time features (WebSocket)
4. Add analytics and monitoring

---

## ⚠️ CRITICAL RULES FOR AI AGENTS

### **DO:**

- ✅ **Always use `nx` commands** (never npm/npx for tasks)
- ✅ **Check current file contents** before editing
- ✅ **Follow Nx monorepo structure** (ROOT vs app dependencies)
- ✅ **Read docs/overview.md** for business requirements
- ✅ **Use TypeScript** - no `any` types in new code
- ✅ **Follow established patterns** in mocks/ folder
- ✅ **Update docs/** when changing architecture

### **DON'T:**

- ❌ **Never install deps directly** in apps/ without checking if it should be in ROOT
- ❌ **Never modify BE repo** - use docs/toBE/ for communication
- ❌ **Never delete MSW files** - FE depends on them for development
- ❌ **Never hardcode API URLs** - always use env vars
- ❌ **Never commit .env.local** - only .env.example

### **Common Pitfalls:**

1. **"Where do I install this dependency?"**
   - Shared by multiple apps? → ROOT package.json
   - Only used in web app? → apps/web/package.json

2. **"How do I run commands?"**
   - Always: `nx <target> <project>` (e.g., `nx dev web`)
   - Never: `cd apps/web && npm run dev`

3. **"MSW not working?"**
   - Check: `mockServiceWorker.js` exists in `apps/web/public/`
   - Check: Console shows `[MSW] Mocking enabled`
   - Check: `NODE_ENV=development`

4. **"Backend says endpoint doesn't match?"**
   - Refer to: `docs/toBE/API-REQUIREMENTS.md`
   - Check: Request/response format in `mocks/handlers/`

5. **"BE team says they implemented differently?"**
   - **STOP!** Don't change FE code immediately
   - First: Check if BE followed `API-REQUIREMENTS.md`
   - If NO: Ask BE to follow the spec (we documented first)
   - If YES: Our assumption was wrong, update both `types.ts` AND `API-REQUIREMENTS.md`
   - Never let FE and docs diverge!

6. **"Should we wait for BE to finish before starting UI?"**
   - **NO!** That's why we have MSW
   - Build UI components using mock data
   - When BE is ready, test integration and fix any mismatches
   - MSW allows parallel development

---

## 📞 CONTACT & RESOURCES

### **Team Structure:**

- **Frontend:** Nx monorepo (this repo)
- **Backend:** NestJS (separate repo - BE-repo)
- **Communication:** docs/toBE/ folder

### **Pull Requests:**

- **FE Repo:** https://github.com/WDP301-SP26/FE-repo
  - Current branch: `test/be-local`
  - Active PR: #9 - Test/be local
  - Default: `main`

- **BE Repo:** https://github.com/WDP301-SP26/BE-repo
  - Current branch: `auth`
  - Active PR: #7 - finish auth
  - Default: `main`

### **Useful Links:**

- [Nx Documentation](https://nx.dev)
- [MSW Documentation](https://mswjs.io)
- [Next.js 14+ App Router](https://nextjs.org/docs/app)

---

## 🏁 SUMMARY FOR QUICK ONBOARDING

**In 3 sentences:**

1. This is an **Nx monorepo** with a Next.js 16 app for managing SWP391 student projects via Jira/GitHub integration.
2. We just implemented **MSW (Mock Service Worker)** to mock 50+ API endpoints, allowing FE to develop independently from BE.
3. When BE is ready, we only need to change `NEXT_PUBLIC_API_URL` environment variable - no code changes required.

**First Task as New AI Agent:**

1. Read `docs/overview.md` - Understand business requirements
2. Read `apps/web/src/mocks/README.md` - Understand mocking setup
3. Visit `http://localhost:3000/msw-test` - Verify MSW is working
4. Check `docs/toBE/API-REQUIREMENTS.md` - Know what BE needs to implement

**Ready to code!** 🚀

---

**Last Updated:** January 29, 2026  
**Status:** ✅ MSW Complete - Ready for UI Development  
**Next Milestone:** Implement Dashboard UI for 3 user roles
