# 🔐 DOPPLER - SECRETOPS PLATFORM

> **TL;DR:** Doppler là một nền tảng quản lý secrets an toàn, thay thế cho `.env` files, giúp bạn lưu trữ và đồng bộ API keys, database credentials, và sensitive data một cách tập trung.

---

## 🎯 DOPPLER LÀ GÌ?

**Doppler** là một **SecretOps Platform** - nền tảng quản lý **secrets** (API keys, passwords, credentials) cho developers và teams.

### ❌ **Vấn đề truyền thống:**

```bash
# ❌ KHÔNG AN TOÀN
.env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JIRA_API_TOKEN="super_secret_token_123"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
JWT_SECRET="my-super-secret-jwt-key"

# Vấn đề:
# 1. .env file bị commit nhầm lên Git → Lộ secret
# 2. Mỗi developer có .env khác nhau → Không đồng bộ
# 3. Không có audit log → Không biết ai thay đổi gì
# 4. Không có version control cho secrets
# 5. Khó quản lý khi có nhiều environments (dev, staging, prod)
```

### ✅ **Giải pháp với Doppler:**

```bash
# ✅ AN TOÀN
# Không còn .env files!
# Tất cả secrets được lưu trên Doppler cloud (encrypted)

# Developer chỉ cần chạy:
doppler run -- npm start

# Doppler tự động inject secrets vào process
# → Không cần .env file nữa! 🎉
```

---

## 🏗️ KIẾN TRÚC DOPPLER

```mermaid
graph TB
    subgraph Developers["👨‍💻 DEVELOPERS"]
        Dev1["Dev 1<br/>(Local)"]
        Dev2["Dev 2<br/>(Local)"]
    end

    subgraph DopplerCloud["☁️ DOPPLER CLOUD"]
        Dashboard["Doppler Dashboard<br/>(Web UI)"]

        subgraph Projects["📁 PROJECTS"]
            Project1["jira-github-manager"]

            subgraph Environments["🌍 ENVIRONMENTS"]
                DevEnv["Development<br/>- API Keys (dev)<br/>- DB URL (dev)"]
                StagingEnv["Staging<br/>- API Keys (staging)<br/>- DB URL (staging)"]
                ProdEnv["Production<br/>- API Keys (prod)<br/>- DB URL (prod)"]
            end
        end

        Secrets["🔐 Encrypted Secrets<br/>AES-256"]
        Logs["📊 Activity Logs<br/>- Who changed what<br/>- When<br/>- Rollback capability"]
    end

    subgraph CI_CD["🚀 CI/CD"]
        GitHubActions["GitHub Actions"]
        Vercel["Vercel"]
    end

    subgraph Production["🏭 PRODUCTION"]
        Server["Production Server"]
    end

    Dev1 -->|"doppler run"| DopplerCloud
    Dev2 -->|"doppler run"| DopplerCloud
    Dashboard --> Projects
    Projects --> Secrets
    Projects --> Logs

    GitHubActions -->|"Service Token"| DopplerCloud
    Vercel -->|"Integration"| DopplerCloud
    Server -->|"Service Token"| DopplerCloud

    style DopplerCloud fill:#6B46C1,color:#fff
    style Secrets fill:#E53E3E,color:#fff
```

---

## 🎨 KEY FEATURES

### 1. **Centralized Secret Management**

- Tất cả secrets ở 1 chỗ
- Team members share cùng secrets
- Không còn "It works on my machine" 😅

### 2. **Multi-Environment Support**

```
Project: jira-github-manager
├── Development
│   ├── DATABASE_URL=postgres://localhost:5432/dev
│   ├── JIRA_API_TOKEN=dev_token_xxx
│   └── JWT_SECRET=dev_secret_123
│
├── Staging
│   ├── DATABASE_URL=postgres://staging.db/mydb
│   ├── JIRA_API_TOKEN=staging_token_xxx
│   └── JWT_SECRET=staging_secret_456
│
└── Production
    ├── DATABASE_URL=postgres://prod.db/mydb
    ├── JIRA_API_TOKEN=prod_token_xxx
    └── JWT_SECRET=prod_secret_789
```

### 3. **Version Control for Secrets**

```
📅 History:
2024-01-20 15:30 - Nguyễn Văn A updated JWT_SECRET
2024-01-19 10:15 - Trần Thị B updated DATABASE_URL
2024-01-18 09:00 - Lê Văn C created JIRA_API_TOKEN

→ Có thể rollback về version cũ bất cứ lúc nào!
```

### 4. **Security Features**

- ✅ **AES-256 encryption** at rest
- ✅ **TLS encryption** in transit
- ✅ **Audit logs** - Ai thay đổi gì, khi nào
- ✅ **Role-based access control** (RBAC)
- ✅ **Read-only tokens** cho production

### 5. **Integrations**

- ✅ **Vercel** (auto-sync secrets)
- ✅ **GitHub Actions** (CI/CD)
- ✅ **AWS, GCP, Azure**
- ✅ **Docker, Kubernetes**
- ✅ **And 50+ more...**

---

## 🚀 SETUP DOPPLER CHO DỰ ÁN JIRA-GITHUB MANAGER

### **STEP 1: Install Doppler CLI**

#### Windows (PowerShell):

```powershell
# Using winget (recommended)
winget install doppler.doppler

# Or using Scoop
scoop bucket add doppler https://github.com/DopplerHQ/scoop-doppler.git
scoop install doppler
```

#### macOS:

```bash
brew install dopplerhq/cli/doppler
```

#### Linux:

```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | sudo gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list
sudo apt-get update && sudo apt-get install doppler
```

---

### **STEP 2: Login to Doppler**

```bash
doppler login
# → Opens browser, login with GitHub/Google/Email
```

---

### **STEP 3: Create Project**

#### Via Web Dashboard:

1. Go to https://dashboard.doppler.com
2. Click "Create Project"
3. Name: `jira-github-manager`
4. Environments: Dev, Staging, Production

#### Via CLI:

```bash
doppler projects create jira-github-manager
```

---

### **STEP 4: Setup in Repository**

```bash
cd /path/to/jira-github/fe-repo

# Initialize Doppler for this project
doppler setup
# → Select project: jira-github-manager
# → Select config: dev (for local development)
```

Doppler sẽ tạo file `doppler.yaml`:

```yaml
# doppler.yaml
setup:
  - project: jira-github-manager
    config: dev
```

**Add to `.gitignore`:**

```bash
# .gitignore
.env
.env.*
doppler.yaml  # Optional, có thể commit để team dùng chung
```

---

### **STEP 5: Add Secrets**

#### Via Web Dashboard:

```
Dashboard → jira-github-manager → Development
+ Add Secret:
  - DATABASE_URL: postgresql://localhost:5432/jira_github_dev
  - JIRA_API_TOKEN: your_jira_token
  - GITHUB_TOKEN: ghp_xxxxxxxxxxxx
  - JWT_SECRET: your-super-secret-jwt-key
  - NEXT_PUBLIC_API_URL: http://localhost:3000
```

#### Via CLI:

```bash
# Set single secret
doppler secrets set DATABASE_URL="postgresql://localhost:5432/jira_github_dev"

# Set multiple secrets from .env file (one-time migration)
doppler secrets upload .env
```

---

### **STEP 6: Use Doppler in Development**

#### **Before (with .env):**

```bash
# ❌ Old way
npm run dev
# → Loads .env file
```

#### **After (with Doppler):**

```bash
# ✅ New way
doppler run -- npm run dev
# → Doppler injects secrets as env vars
```

#### **Update `package.json`:**

```json
{
  "scripts": {
    "dev": "doppler run -- next dev",
    "build": "doppler run -- next build",
    "start": "doppler run -- next start",
    "test": "doppler run -- jest"
  }
}
```

Now developers just run:

```bash
pnpm dev  # Doppler automatically injects secrets! 🎉
```

---

### **STEP 7: Use in Code**

**Không thay đổi code!** Doppler inject secrets as environment variables:

```typescript
// apps/web/src/lib/config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!, // From Doppler ✅
  },
  jira: {
    token: process.env.JIRA_API_TOKEN!, // From Doppler ✅
  },
  github: {
    token: process.env.GITHUB_TOKEN!, // From Doppler ✅
  },
  jwt: {
    secret: process.env.JWT_SECRET!, // From Doppler ✅
  },
};
```

---

### **STEP 8: GitHub Actions Integration**

#### Create Service Token:

```bash
doppler configs tokens create github-actions --config prd
# → Returns: dp.st.prd.xxxxxxxxxxxxx
```

#### Add to GitHub Secrets:

```
GitHub Repo → Settings → Secrets → New repository secret
Name: DOPPLER_TOKEN
Value: dp.st.prd.xxxxxxxxxxxxx
```

#### Update `.github/workflows/ci-cd.yml`:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: 🔐 Install Doppler CLI
        uses: dopplerhq/cli-action@v3

      - name: 📦 Install dependencies
        run: doppler run -- pnpm install
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}

      - name: 🏗️ Build
        run: doppler run -- pnpm build
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}

      - name: 🚀 Deploy
        run: doppler run -- vercel deploy --prod
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

---

### **STEP 9: Vercel Integration** (RECOMMENDED!)

#### Option 1: Direct Integration (Best)

```
1. Go to Doppler Dashboard
2. Integrations → Vercel → Connect
3. Select project: jira-github-manager
4. Select Vercel project: your-vercel-project
5. Map configs:
   - Development → Preview
   - Production → Production
```

**Done!** Vercel automatically syncs secrets from Doppler 🎉

#### Option 2: Manual via CLI

```bash
doppler secrets download --config prd --format env > .env.production
vercel env add .env.production
```

---

## 📊 DOPPLER WORKFLOW DIAGRAM

```mermaid
sequenceDiagram
    actor Dev as 👨‍💻 Developer
    participant CLI as Doppler CLI
    participant Cloud as Doppler Cloud
    participant App as Next.js App

    Dev->>CLI: doppler run -- npm run dev
    CLI->>Cloud: Authenticate + Fetch secrets
    Cloud-->>CLI: Return encrypted secrets
    CLI->>CLI: Decrypt secrets
    CLI->>App: Inject as environment variables
    App->>App: process.env.DATABASE_URL
    App-->>Dev: App running with secrets ✅

    Note over Dev,App: No .env file needed!
```

---

## 💰 PRICING

| Plan           | Price       | Features                                                                                            |
| -------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| **Free**       | $0/month    | ✅ Unlimited secrets<br/>✅ 5 users<br/>✅ Basic integrations<br/>⚠️ 30-day audit logs              |
| **Team**       | $12/user/mo | ✅ Unlimited users<br/>✅ RBAC<br/>✅ SSO<br/>✅ Unlimited audit logs<br/>✅ Auto-restart on change |
| **Enterprise** | Custom      | ✅ SLA<br/>✅ Dedicated support<br/>✅ Custom contracts                                             |

**For Students:** Free plan is **more than enough**! 🎉

---

## ✅ PROS & CONS

### ✅ **PROS:**

1. **Security** - Secrets encrypted, không còn `.env` files
2. **Centralized** - 1 source of truth cho toàn team
3. **Version control** - Rollback secrets like Git
4. **Audit logs** - Biết ai thay đổi gì
5. **Easy sync** - Auto-sync to Vercel, AWS, etc.
6. **FREE tier** - Unlimited secrets, 5 users

### ⚠️ **CONS:**

1. **Dependency** - Phụ thuộc vào Doppler service
2. **Learning curve** - Team cần học CLI commands
3. **Vendor lock-in** - Khó migrate ra khỏi Doppler
4. **Internet required** - Cần internet để fetch secrets

---

## 🎯 KHI NÀO NÊN DÙNG DOPPLER?

### ✅ **NÊN DÙNG** khi:

- 👥 Team > 2 người
- 🌍 Có nhiều environments (dev, staging, prod)
- 🔐 Cần quản lý nhiều secrets (>10)
- 📊 Cần audit logs và compliance
- 🔄 Cần sync secrets to cloud platforms (Vercel, AWS)

### ❌ **KHÔNG CẦN** khi:

- 👤 Solo developer, pet project
- 🏠 Chỉ local development
- 💰 Budget = $0 (nhưng free tier vẫn ok!)
- 🔌 Offline development

---

## 🆚 SO SÁNH VỚI CÁC GIẢI PHÁP KHÁC

| Solution                | Pros                        | Cons                      | Cost             |
| ----------------------- | --------------------------- | ------------------------- | ---------------- |
| **Doppler**             | ⭐⭐⭐⭐⭐ DX, Integrations | Vendor lock-in            | Free tier        |
| **.env files**          | Simple, no dependencies     | ❌ Insecure, hard to sync | Free             |
| **AWS Secrets Manager** | Part of AWS ecosystem       | Complex, AWS-only         | ~$0.40/secret    |
| **HashiCorp Vault**     | Very powerful               | Complex setup             | Free (self-host) |
| **GitHub Secrets**      | Built-in to GitHub          | CI/CD only                | Free             |

---

## 📚 LEARNING RESOURCES

- 📖 [Official Docs](https://docs.doppler.com)
- 🎥 [YouTube Tutorial](https://www.youtube.com/c/DopplerHQ)
- 💬 [Community Forum](https://community.doppler.com)
- 🐦 [Twitter @Doppler](https://twitter.com/doppler)

---

## 🎯 CONCLUSION

**For Jira-GitHub Manager project:**

```
🏆 RECOMMENDATION: USE DOPPLER ✅

Lý do:
1. Team project (4-6 người) → Cần centralized secrets
2. Multiple environments (dev, staging, prod)
3. Vercel integration → Auto-sync
4. Security compliance → Audit logs
5. FREE tier → Perfect cho sinh viên

Setup time: ~15 minutes
ROI: Massive security + collaboration improvement
```

---

**Bạn muốn tôi setup Doppler cho project ngay không?** 🚀
