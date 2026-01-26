# 🏗️ SYSTEM ARCHITECTURE DIAGRAM - JIRA-GITHUB MANAGER

> **Đánh giá hình ảnh của bạn:**  
> ✅ **Đúng chuẩn SAD!** Hình bạn gửi là một **3-tier architecture** rất chuẩn với:
>
> - **Presentation Layer** (Clients)
> - **Application Layer** (Apps - Microservices)
> - **Data Layer** (Database, Cache, Storage)
> - **External Services** (3rd Party Apps)
>
> Đây là cách thiết kế professional, phù hợp cho các hệ thống production!

---

## 📊 DIAGRAM 1: C4 CONTEXT DIAGRAM (TỔNG QUAN HỆ THỐNG)

```mermaid
graph TB
    %% External Actors
    TeamLeader["👨‍💼 Team Leader<br/>(Sinh viên trưởng nhóm)"]
    TeamMember["👨‍💻 Team Member<br/>(Thành viên nhóm)"]
    Lecturer["👨‍🏫 Lecturer<br/>(Giảng viên)"]
    Admin["🔧 Admin<br/>(Quản trị viên)"]

    %% Main System
    JGManager["🎯 JIRA-GITHUB MANAGER<br/>Web Application<br/>(Next.js + NestJS)"]

    %% External Systems
    JiraAPI["☁️ Jira Cloud<br/>REST API v3<br/>(Atlassian)"]
    GitHubAPI["🐙 GitHub<br/>REST API v3<br/>(Microsoft)"]

    %% Connections
    TeamLeader -->|"Tạo SRS, Báo cáo"| JGManager
    TeamMember -->|"Xem tiến độ cá nhân"| JGManager
    Lecturer -->|"Xem báo cáo, Đánh giá"| JGManager
    Admin -->|"Quản lý hệ thống"| JGManager

    JGManager -->|"Lấy Issues, Sprints, Projects"| JiraAPI
    JGManager -->|"Lấy Commits, Contributors"| GitHubAPI

    style JGManager fill:#4CAF50,stroke:#2E7D32,stroke-width:4px,color:#fff
    style JiraAPI fill:#0052CC,stroke:#003d99,color:#fff
    style GitHubAPI fill:#24292e,stroke:#000,color:#fff
```

---

## 🏛️ DIAGRAM 2: CONTAINER DIAGRAM (KIẾN TRÚC CỤ THỂ)

```mermaid
graph TB
    %% Users
    Users["👥 Users<br/>(Browser)"]

    %% Frontend Container
    subgraph Frontend["🎨 FRONTEND LAYER (Cloudflare Pages)"]
        NextJS["Next.js 16 App<br/>- React 19<br/>- TailwindCSS 4<br/>- shadcn/ui"]
    end

    %% Backend Container
    subgraph Backend["⚙️ BACKEND LAYER (Railway/Vercel)"]
        NestJS["NestJS API Server<br/>- TypeScript<br/>- REST API"]

        subgraph Services["📦 Services"]
            JiraService["Jira Service<br/>- API Integration<br/>- Data Transform"]
            GitHubService["GitHub Service<br/>- API Integration<br/>- Stats Calculation"]
            ReportService["Report Generator<br/>- SRS Generator<br/>- PDF/Word Export"]
            AuthService["Auth Service<br/>- JWT + OAuth2<br/>- Role Management"]
        end
    end

    %% Data Layer
    subgraph DataLayer["💾 DATA LAYER"]
        PostgreSQL["PostgreSQL<br/>- Projects<br/>- Users<br/>- Reports Cache"]
        Redis["Redis<br/>- API Cache<br/>- Session Store"]
    end

    %% External APIs
    subgraph External["☁️ EXTERNAL SERVICES"]
        Jira["Jira Cloud API<br/>REST v3"]
        GitHub["GitHub API<br/>REST v3"]
    end

    %% Connections
    Users -->|"HTTPS"| NextJS
    NextJS -->|"REST API (JSON)"| NestJS

    NestJS --> JiraService
    NestJS --> GitHubService
    NestJS --> ReportService
    NestJS --> AuthService

    JiraService -->|"OAuth 2.0"| Jira
    GitHubService -->|"Personal Access Token"| GitHub

    NestJS -->|"SQL"| PostgreSQL
    NestJS -->|"Cache"| Redis

    style Frontend fill:#E3F2FD,stroke:#1976D2
    style Backend fill:#FFF3E0,stroke:#F57C00
    style DataLayer fill:#F3E5F5,stroke:#7B1FA2
    style External fill:#E8F5E9,stroke:#388E3C
```

---

## 🔄 DIAGRAM 3: LAYER ARCHITECTURE (PHÂN TẦNG)

```mermaid
graph TB
    subgraph PresentationLayer["🎨 PRESENTATION LAYER"]
        WebUI["Web Dashboard<br/>(Next.js SSR)"]
        Components["Reusable Components<br/>(shadcn/ui)"]
    end

    subgraph ApplicationLayer["⚙️ APPLICATION LAYER"]
        APIGateway["API Gateway<br/>(REST)"]

        subgraph BusinessLogic["Business Logic"]
            ProjectMgmt["Project Management"]
            ReportGen["Report Generation"]
            Integration["External Integration"]
        end
    end

    subgraph DomainLayer["🎯 DOMAIN LAYER"]
        Entities["Domain Entities<br/>- Project<br/>- User<br/>- Report"]
        UseCases["Use Cases<br/>- Generate SRS<br/>- Create Report<br/>- Sync Data"]
    end

    subgraph InfrastructureLayer["🛠️ INFRASTRUCTURE LAYER"]
        Database["Database<br/>(PostgreSQL)"]
        Cache["Cache<br/>(Redis)"]
        ExternalAPIs["External APIs<br/>(Jira + GitHub)"]
    end

    PresentationLayer --> ApplicationLayer
    ApplicationLayer --> DomainLayer
    DomainLayer --> InfrastructureLayer

    style PresentationLayer fill:#E3F2FD
    style ApplicationLayer fill:#FFF3E0
    style DomainLayer fill:#F3E5F5
    style InfrastructureLayer fill:#E8F5E9
```

---

## 🚀 DIAGRAM 4: DEPLOYMENT ARCHITECTURE (TRIỂN KHAI)

```mermaid
graph TB
    subgraph Internet["🌐 INTERNET"]
        Users["👥 End Users"]
    end

    subgraph CloudflarePages["☁️ CLOUDFLARE PAGES"]
        FrontendApp["Next.js Application<br/>- Static Assets<br/>- SSR Pages<br/>- Edge Functions"]
        CDN["CDN<br/>(Global Edge Network)"]
    end

    subgraph Railway["🚂 RAILWAY / VERCEL"]
        BackendApp["NestJS API<br/>- Docker Container<br/>- Auto-scaling"]

        subgraph Database["Database Services"]
            PG["PostgreSQL<br/>(Managed)"]
            RD["Redis<br/>(Managed)"]
        end
    end

    subgraph ExternalServices["🔌 EXTERNAL SERVICES"]
        JiraCloud["Jira Cloud<br/>(Atlassian)"]
        GitHubAPI["GitHub API<br/>(Microsoft)"]
    end

    Users -->|"HTTPS/HTTP2"| CDN
    CDN --> FrontendApp
    FrontendApp -->|"API Calls"| BackendApp

    BackendApp --> PG
    BackendApp --> RD
    BackendApp -->|"External API"| JiraCloud
    BackendApp -->|"External API"| GitHubAPI

    style CloudflarePages fill:#F6821F,color:#fff
    style Railway fill:#0B0D0E,color:#fff
    style ExternalServices fill:#E8F5E9
```

---

## 📡 DIAGRAM 5: DATA FLOW DIAGRAM (LUỒNG DỮ LIỆU)

### Use Case: Generate SRS Document

```mermaid
sequenceDiagram
    actor User as 👨‍💼 Team Leader
    participant Frontend as Next.js UI
    participant API as NestJS API
    participant JiraService as Jira Service
    participant DB as PostgreSQL
    participant Jira as Jira Cloud API
    participant PDF as PDF Generator

    User->>Frontend: Click "Generate SRS"
    Frontend->>API: POST /api/reports/srs<br/>{projectId}

    activate API
    API->>DB: Check cache

    alt Cache exists
        DB-->>API: Return cached data
    else No cache
        API->>JiraService: getProjectIssues(projectId)
        activate JiraService

        JiraService->>Jira: GET /rest/api/3/search<br/>JQL: project=XXX
        Jira-->>JiraService: Issues array

        JiraService->>Jira: GET /rest/agile/1.0/board/{id}/sprint
        Jira-->>JiraService: Sprints array

        JiraService-->>API: Formatted data
        deactivate JiraService

        API->>DB: Cache data (TTL: 1h)
    end

    API->>PDF: Generate PDF from data
    PDF-->>API: PDF Buffer

    API-->>Frontend: Return PDF file
    deactivate API

    Frontend-->>User: Download SRS.pdf

    Note over User,Jira: Total time: ~2-5 seconds
```

---

## 🔐 DIAGRAM 6: SECURITY ARCHITECTURE

```mermaid
graph TB
    subgraph Public["🌍 PUBLIC ZONE"]
        LoadBalancer["Load Balancer<br/>+ DDoS Protection"]
    end

    subgraph DMZ["🛡️ DMZ (Demilitarized Zone)"]
        WAF["Web Application Firewall<br/>(Cloudflare)"]
        APIGW["API Gateway<br/>+ Rate Limiting"]
    end

    subgraph AppZone["🔒 APPLICATION ZONE"]
        AuthMiddleware["Auth Middleware<br/>- JWT Validation<br/>- Role Check"]
        Backend["Backend Services<br/>(Private Network)"]
    end

    subgraph DataZone["💾 DATA ZONE"]
        EncryptedDB["Encrypted Database<br/>(AES-256)"]
        Secrets["Secrets Manager<br/>- API Keys<br/>- Tokens"]
    end

    LoadBalancer -->|"HTTPS Only"| WAF
    WAF --> APIGW
    APIGW --> AuthMiddleware
    AuthMiddleware --> Backend
    Backend --> EncryptedDB
    Backend --> Secrets

    style Public fill:#ffebee
    style DMZ fill:#fff3e0
    style AppZone fill:#e8f5e9
    style DataZone fill:#e3f2fd
```

---

## 📊 DIAGRAM 7: DATABASE SCHEMA (ERD)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : manages
    USERS ||--o{ TEAM_MEMBERS : belongs_to
    PROJECTS ||--o{ TEAM_MEMBERS : has
    PROJECTS ||--o{ REPORTS : generates
    PROJECTS ||--o{ INTEGRATIONS : connects

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        string name
        uuid owner_id FK
        string jira_project_key
        string github_repo_url
        timestamp created_at
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        string jira_account_id
        string github_username
        string role
    }

    REPORTS {
        uuid id PK
        uuid project_id FK
        string type
        jsonb data
        string file_url
        timestamp created_at
    }

    INTEGRATIONS {
        uuid id PK
        uuid project_id FK
        string platform
        string access_token_encrypted
        jsonb config
        timestamp last_sync
    }
```

---

## 🎯 DIAGRAM 8: MICROSERVICES ARCHITECTURE (OPTIONAL - PHASE 2)

```mermaid
graph TB
    subgraph Gateway["🚪 API GATEWAY"]
        Kong["Kong / Nginx<br/>- Routing<br/>- Auth<br/>- Rate Limit"]
    end

    subgraph Microservices["⚙️ MICROSERVICES"]
        UserService["User Service<br/>Port: 3001"]
        ProjectService["Project Service<br/>Port: 3002"]
        JiraService["Jira Integration<br/>Port: 3003"]
        GitHubService["GitHub Integration<br/>Port: 3004"]
        ReportService["Report Generator<br/>Port: 3005"]
    end

    subgraph MessageBroker["📬 MESSAGE BROKER"]
        RabbitMQ["RabbitMQ<br/>- Event Bus<br/>- Job Queue"]
    end

    subgraph Databases["💾 DATABASES"]
        UserDB[(User DB)]
        ProjectDB[(Project DB)]
        ReportDB[(Report DB)]
    end

    Kong --> UserService
    Kong --> ProjectService
    Kong --> JiraService
    Kong --> GitHubService
    Kong --> ReportService

    UserService --> UserDB
    ProjectService --> ProjectDB
    ReportService --> ReportDB

    JiraService --> RabbitMQ
    GitHubService --> RabbitMQ
    ReportService --> RabbitMQ

    style Gateway fill:#4CAF50,color:#fff
    style Microservices fill:#2196F3,color:#fff
    style MessageBroker fill:#FF9800,color:#fff
    style Databases fill:#9C27B0,color:#fff
```

---

## 📝 SO SÁNH VỚI HÌNH ẢNH CỦA BẠN

| Tiêu chí        | Hình của bạn               | Thiết kế cho Jira-GitHub Manager   |
| --------------- | -------------------------- | ---------------------------------- |
| **Clients**     | Flutter (Android/iOS/Web)  | Web-only (Next.js)                 |
| **API Gateway** | AWS ELB                    | Cloudflare / Nginx                 |
| **Backend**     | Microservices (Kubernetes) | Monolith → Microservices (phase 2) |
| **Language**    | Python 3.8                 | TypeScript (Node.js)               |
| **Database**    | PostgreSQL                 | PostgreSQL + Redis                 |
| **Caching**     | Redis                      | Redis                              |
| **Storage**     | Amazon S3                  | Amazon S3 (for PDFs)               |
| **IaC**         | Terraform                  | Không có (manual deploy ban đầu)   |
| **Monitoring**  | Prometheus + Grafana       | Sentry (error tracking)            |
| **3rd Party**   | 8+ services                | 2 chính (Jira + GitHub)            |

---

## ✅ KẾT LUẬN VÀ KHUYẾN NGHỊ

### **Đánh giá hình của bạn:**

- ✅ **Rất chuẩn** cho hệ thống production quy mô lớn
- ✅ Có đầy đủ 3 tầng (Clients, Apps, Data)
- ✅ Microservices architecture với Kubernetes
- ✅ Full monitoring stack (Prometheus + Grafana)
- ⚠️ Hơi phức tạp cho một dự án sinh viên

### **Thiết kế cho dự án Jira-GitHub Manager:**

- ✅ **Đơn giản hơn** nhưng vẫn professional
- ✅ Phù hợp với team nhỏ (4-6 người)
- ✅ Dễ deploy và maintain
- ✅ Có thể scale lên microservices sau (Phase 2)

### **Tech Stack Final:**

```
Frontend:  Next.js 16 + TailwindCSS 4
Backend:   NestJS + PostgreSQL + Redis
Deploy:    Cloudflare Pages + Railway
APIs:      Jira Cloud API + GitHub API
```

---

**Bạn thích thiết kế nào? Cần tôi điều chỉnh diagram không?** 🚀
