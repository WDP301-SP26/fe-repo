# Frontend Requirements for Backend Team

## Overview

The Frontend (FE) uses **NextAuth.js (v5)** for authentication and **Prisma** as the ORM. Based on the SQL DDL provided by the BE team, we have identified gaps that need to be addressed for the authentication flow to work.

## 1. Authentication Schema (Critical Analysis)

### A. Missing `provider_account_id` in `IntegrationToken` (CRITICAL)

The `IntegrationToken` table stores OAuth tokens, but it **missing the most important field**: `provider_account_id`.

- **Why is this critical?**
  - This is the **Unique ID** of the user on the external platform (e.g., GitHub User ID `12345` or Jira Account ID `550e8400-e29b...`).
  - We **cannot** rely on `github_username` in the `User` table for login, because users can change their GitHub username. The ID never changes.
  - When a user logs in via GitHub, NextAuth receives this ID. We must query the database for this ID to know which User it belongs to.
  - Without this column, we cannot securely link a GitHub login to an internal User.

- **Required SQL Change**:

  ```sql
  ALTER TABLE "IntegrationToken"
  ADD COLUMN "provider_account_id" VARCHAR(255) NOT NULL;

  -- Recommended: Ensure one ID doesn't link to multiple users for the same provider
  CREATE UNIQUE INDEX "integration_token_unique_provider"
  ON "IntegrationToken" ("provider", "provider_account_id");
  ```

### B. Missing `image` in `User` (UX Requirement)

The `User` table lacks a field to store the user's avatar URL. NextAuth automatically fetches this from GitHub/Jira.

- **Required SQL Change**:
  ```sql
  ALTER TABLE "User"
  ADD COLUMN "image" VARCHAR(500);
  ```

### C. Enum Usage Note

The SQL uses Enums (`'GITHUB'`) while NextAuth usually uses lowercase strings (`'github'`).

- **Action**: FE will handle the case mapping (e.g., `'github'` -> `'GITHUB'`) in the database adapter layer. BE does not need to change this, but should be aware.

## 2. Next Steps for BE

1.  **Execute the SQL `ALTER` commands** above.
2.  **Provide the Connection String** (`DATABASE_URL`) to the FE team.
3.  (Optional) Provide the full `schema.prisma` if available, otherwise FE will generate it from the DB.
