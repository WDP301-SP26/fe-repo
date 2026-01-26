# 🎯 TỔNG QUAN DỰ ÁN: JIRA-GITHUB MANAGER FOR SWP391

> **Công cụ hỗ trợ quản lý yêu cầu và tiến độ dự án phần mềm cho môn SWP391 thông qua Jira và GitHub**

---

## 📖 1. BỐI CẢNH VÀ VẤN ĐỀ

### 🎓 **Bối cảnh thực tế**

Tại FPT University, sinh viên ngành Kỹ thuật Phần mềm phải học môn **SWP391 - Software Development Project**. Đây là môn học thực hành quan trọng, nơi sinh viên:

- Làm việc theo nhóm (4-6 người)
- Phát triển một dự án phần mềm hoàn chỉnh
- Phải quản lý yêu cầu như một dự án thực tế
- Báo cáo tiến độ cho giảng viên định kỳ

### 🔧 **Công cụ hiện tại**

Sinh viên được yêu cầu sử dụng:

- **Jira** → Quản lý yêu cầu (requirements) và công việc (tasks)
- **GitHub** → Quản lý mã nguồn (source code) và lịch sử phát triển

### ⚠️ **Vấn đề gặp phải**

Sinh viên gặp khó khăn khi phải:

#### **Vấn đề 1: Tạo tài liệu SRS (Software Requirements Specification)**

- Giảng viên yêu cầu nộp tài liệu SRS chính thức
- Sinh viên đã quản lý yêu cầu trên Jira, nhưng phải **COPY THỦ CÔNG** sang Word
- Mất nhiều thời gian, dễ sai sót, không đồng bộ

**Ví dụ thực tế:**

```
Nhóm có 50 requirements trên Jira
→ Phải copy từng cái sang Word
→ Mất 3-4 giờ
→ Sau 1 tuần, requirements thay đổi
→ Phải copy lại từ đầu 😫
```

#### **Vấn đề 2: Báo cáo phân công công việc**

- Giảng viên muốn biết "ai làm gì" trong tuần vừa qua
- Sinh viên phải vào Jira, xem từng sprint, từng issue
- Tổng hợp thủ công vào Excel/Word
- Không có cách nào tự động

**Ví dụ thực tế:**

```
Giảng viên hỏi: "Tuần này, Minh làm được những task nào?"
→ Vào Jira
→ Filter issues by assignee = "Minh"
→ Filter by sprint = "Sprint 3"
→ Copy vào Word một cái một
→ Làm lại cho 5 thành viên còn lại 😓
```

#### **Vấn đề 3: Báo cáo đóng góp trên GitHub**

- Giảng viên muốn biết "ai code nhiều nhất"
- Phải vào GitHub, đếm commit từng người
- Không biết ai code thật, ai chỉ commit ít
- Dễ bị "gian lận" (1 người code hết, chia commit cho nhau)

**Ví dụ thực tế:**

```
End of semester:
Giảng viên: "Em nào đóng góp ít nhất?"
→ Phải manual check GitHub Insights
→ Đếm commits từng người (100+ commits)
→ Kiểm tra lines of code added/deleted
→ Mất cả buổi chiều 😭
```

---

## 💡 2. GIẢI PHÁP ĐỀ XUẤT

### 🎯 **Ý tưởng chính**

Xây dựng một **Web Application** tự động kết nối với Jira và GitHub, giúp sinh viên:

1. **Tự động tạo tài liệu SRS** từ dữ liệu Jira
2. **Tự động tạo báo cáo phân công** từ Jira Sprints
3. **Tự động tạo báo cáo đóng góp** từ GitHub Commits

### 🏗️ **Kiến trúc hệ thống**

```
┌─────────────────────────────────────────────────────┐
│                   NGƯỜI DÙNG                         │
│  (Sinh viên SWP391 + Giảng viên)                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                      │
│  - Dashboard tổng quan                               │
│  - Quản lý projects                                  │
│  - Xem và export reports                            │
└────────────────┬────────────────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (NestJS)                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  Jira Service  │  GitHub Service             │    │
│  │  - Get Issues  │  - Get Commits              │    │
│  │  - Get Sprints │  - Get Contributors         │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Report Generator Service                    │    │
│  │  - SRS Generator                             │    │
│  │  - Task Report Generator                     │    │
│  │  - Commit Report Generator                   │    │
│  └─────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│            DATABASE (PostgreSQL)                     │
│  - Projects                                          │
│  - Team Members                                      │
│  - Cached Reports                                    │
└─────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────┬──────────────────────────┐
│    JIRA API              │     GITHUB API            │
│  (Atlassian Cloud)       │   (api.github.com)        │
└──────────────────────────┴──────────────────────────┘
```

---

## 🎨 3. TÍNH NĂNG CHI TIẾT

### ✨ **Feature 1: Tự động tạo tài liệu SRS**

**User Story:**

> Là Team Leader, tôi muốn tự động export tất cả requirements từ Jira ra file SRS chuẩn, để nộp cho giảng viên mà không mất thời gian copy thủ công.

**Workflow:**

1. Sinh viên đăng nhập vào web app
2. Chọn Jira Project (ví dụ: "SWP391-Group5")
3. Click "Generate SRS Document"
4. Hệ thống:
   - Gọi Jira API lấy tất cả issues
   - Phân loại theo: Epic, Story, Task, Bug
   - Tạo document theo template chuẩn IEEE SRS
   - Export ra PDF/Word
5. Download file về máy ✅

**Output mẫu:**

```
SOFTWARE REQUIREMENTS SPECIFICATION
Project: E-Commerce Platform
Version: 1.0

1. INTRODUCTION
1.1 Purpose
1.2 Scope

2. FUNCTIONAL REQUIREMENTS
2.1 User Authentication (Epic)
   2.1.1 [USER-001] User Login
         Priority: High
         Status: Done
         Assignee: Nguyễn Văn A
         Description: ...

   2.1.2 [USER-002] User Registration
         Priority: High
         Status: In Progress
         Assignee: Trần Thị B
         Description: ...

3. NON-FUNCTIONAL REQUIREMENTS
...
```

---

### ✨ **Feature 2: Báo cáo phân công công việc**

**User Story:**

> Là Giảng viên, tôi muốn xem nhanh "tuần này mỗi sinh viên làm được những task gì", để đánh giá mức độ đóng góp.

**Workflow:**

1. Giảng viên/Team Leader chọn Sprint
2. Chọn khoảng thời gian (ví dụ: Sprint 3 - 15/01 đến 22/01)
3. Click "Generate Task Report"
4. Hệ thống hiển thị bảng:

| Thành viên   | Assigned | In Progress | Done | Blocked |
| ------------ | -------- | ----------- | ---- | ------- |
| Nguyễn Văn A | 5        | 2           | 8    | 0       |
| Trần Thị B   | 3        | 1           | 6    | 1       |
| Lê Văn C     | 4        | 3           | 5    | 0       |

5. Chi tiết từng task khi click vào số
6. Export ra Excel/PDF

**Insights tự động:**

- Ai đang làm nhiều task nhất?
- Ai có task blocked cần support?
- Task nào quá hạn (overdue)?

---

### ✨ **Feature 3: Báo cáo commit và đóng góp code**

**User Story:**

> Là Giảng viên, tôi muốn biết "ai code nhiều, ai code ít", để chấm điểm công bằng.

**Workflow:**

1. Chọn GitHub Repository
2. Chọn khoảng thời gian (ví dụ: 01/01 → 31/01)
3. Click "Generate Commit Report"
4. Hệ thống hiển thị:

**Overview:**
| Developer | Commits | Lines Added | Lines Deleted | Net Change |
|-----------|---------|-------------|---------------|------------|
| Nguyễn Văn A | 45 | +2,350 | -820 | +1,530 |
| Trần Thị B | 38 | +1,890 | -450 | +1,440 |
| Lê Văn C | 12 | +340 | -120 | +220 |

**Commit Frequency Chart:**

```
Commits per week:
Week 1: ████████████ (45)
Week 2: ████████ (32)
Week 3: ██████████ (38)
Week 4: ████████████████ (52)
```

**Red Flags tự động phát hiện:**

- ⚠️ Lê Văn C chỉ có 12 commits (thấp hơn 50% trung bình)
- ⚠️ Có 3 commits lớn hơn 500 dòng (có thể copy code)

---

## 👥 4. NGƯỜI DÙNG (ACTORS)

### 🎓 **1. Team Leader (Sinh viên trưởng nhóm)**

**Quyền:**

- Kết nối Jira Project và GitHub Repo
- Quản lý danh sách thành viên
- Tạo tất cả các loại báo cáo
- Export documents

**Use Case chính:**

- Chuẩn bị tài liệu SRS để nộp giảng viên
- Weekly report tiến độ nhóm

### 👨‍💻 **2. Team Member (Thành viên nhóm)**

**Quyền:**

- Xem dashboard của nhóm mình
- Xem báo cáo task cá nhân
- Xem commit history của mình

**Use Case chính:**

- Tự kiểm tra tiến độ cá nhân
- So sánh với các thành viên khác

### 👨‍🏫 **3. Lecturer (Giảng viên)**

**Quyền:**

- Xem tất cả projects của tất cả nhóm
- Xem tất cả báo cáo
- So sánh giữa các nhóm

**Use Case chính:**

- Đánh giá tiến độ từng nhóm
- Chấm điểm dựa trên đóng góp thực tế

### 🔧 **4. Admin (Quản trị viên)**

**Quyền:**

- Quản lý users (giảng viên, sinh viên)
- Cấu hình hệ thống
- Xem logs và analytics

---

## 🛠️ 5. CÔNG NGHỆ SỬ DỤNG

### **Frontend:**

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 4.1
- **UI Components:** shadcn/ui
- **Charts:** Recharts hoặc Chart.js
- **State Management:** Zustand hoặc React Context

### **Backend:**

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma hoặc TypeORM
- **Authentication:** JWT + OAuth 2.0
- **API Documentation:** Swagger

### **External APIs:**

- **Jira Cloud REST API v3**
- **GitHub REST API v3**

### **DevOps:**

- **Deployment:**
  - Frontend: Cloudflare Pages
  - Backend: Railway / Render / Vercel Functions
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (error tracking)

---

## 🎯 6. LỢI ÍCH MANG LẠI

### ✅ **Cho Sinh viên:**

- ⏰ Tiết kiệm 80% thời gian làm báo cáo
- 📊 Dữ liệu chính xác, không sai sót
- 🤝 Minh bạch trong phân công công việc
- 🎓 Học cách làm việc với real-world tools

### ✅ **Cho Giảng viên:**

- 📈 Đánh giá nhanh, chính xác
- 🔍 Phát hiện sinh viên "ăn theo"
- 💯 Chấm điểm công bằng dựa trên data
- ⚡ Giảm công việc admin

### ✅ **Cho Trường:**

- 🏆 Nâng cao chất lượng đào tạo
- 💼 Chuẩn bị sinh viên cho công việc thực tế
- 📚 Quy trình quản lý dự án chuyên nghiệp

---

## 📅 7. TIMELINE DỰ KIẾN

```
┌─────────────────────────────────────────────────┐
│ PHASE 1: Setup & Core Features (4 weeks)        │
├─────────────────────────────────────────────────┤
│ Week 1-2: Setup project, Database, Auth         │
│ Week 3-4: Jira & GitHub API integration         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 2: Report Generation (4 weeks)            │
├─────────────────────────────────────────────────┤
│ Week 5-6: SRS Generator                         │
│ Week 7-8: Task Report + Commit Report           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 3: UI/UX & Testing (3 weeks)              │
├─────────────────────────────────────────────────┤
│ Week 9-10: Dashboard & Frontend polish          │
│ Week 11: Testing & Bug fixes                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PHASE 4: Deployment & Documentation (1 week)    │
├─────────────────────────────────────────────────┤
│ Week 12: Deploy + User guide                    │
└─────────────────────────────────────────────────┘
```

---

## 🚀 8. HƯỚNG PHÁT TRIỂN SAU NÀY

### **Version 2.0:**

- 🔔 Notifications khi có task mới assign
- 📧 Email weekly summary tự động
- 🤖 AI suggestions: "Task này nên assign cho ai?"
- 📱 Mobile app (React Native)

### **Version 3.0:**

- 🔗 Tích hợp thêm Trello, Asana
- 🔗 Tích hợp GitLab, Bitbucket
- 📊 Advanced analytics & predictions
- 🏆 Gamification: Badges, Leaderboards

---

## ❓ 9. CÂU HỎI THƯỜNG GẶP

**Q: Hệ thống có lưu trữ mã nguồn từ GitHub không?**  
A: Không. Chỉ lấy metadata (commits, authors, stats), không lưu source code.

**Q: Dữ liệu có an toàn không?**  
A: Có. Sử dụng OAuth, không lưu password, mã hóa sensitive data.

**Q: Có tính tiền không?**  
A: Không. Đây là công cụ free cho sinh viên SWP391.

**Q: Có thể dùng cho dự án công ty được không?**  
A: Được, nhưng cần customize thêm features.

---

## 📞 10. LIÊN HỆ & HỖ TRỢ

- **GitHub:** [Link to repo]
- **Email:** support@jira-github-manager.com
- **Documentation:** [Link to docs]

---

**Tóm lại:** Đây là công cụ giúp sinh viên SWP391 tự động hóa việc tạo báo cáo từ Jira và GitHub, tiết kiệm thời gian và nâng cao chất lượng quản lý dự án! 🎉
