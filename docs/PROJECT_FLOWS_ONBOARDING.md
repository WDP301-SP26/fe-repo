# Project Flows Onboarding (Jira-GitHub Manager)

Tài liệu này dành cho người mới vào dự án để nắm nhanh:

- Dự án này hiện có các luồng nghiệp vụ nào
- Luồng nào đã chạy ổn, luồng nào mới một phần
- Thứ tự triển khai ít rủi ro cho Codex Chat thực hiện

---

## 1) Phạm vi thật của dự án (không phải dental)

Ví dụ "đánh giá răng / tư vấn nha sĩ / VR" là mô hình tham chiếu.  
Project hiện tại là **Jira-GitHub Manager cho SWP391**.

### Modules hiện tại (business modules)

- Student
- Lecturer
- Group
- Project (gắn với Group)
- Auth & Account Linking (GitHub/Jira)
- Reports (SRS, Assignments, Commits)
- Admin (mới có dấu hiệu route/role, chưa hoàn chỉnh end-to-end)

---

## 2) Luồng nghiệp vụ đã hoàn thành

## Luồng 1: Đăng nhập và phân vai người dùng

**Mục tiêu:** User đăng nhập, vào đúng khu vực theo role.  
**Trạng thái:** Hoàn thành cơ bản.

### Happy path

1. User đăng nhập qua form.
2. Frontend gọi backend login, nhận token + user.
3. Tạo session và lưu state local.
4. Điều hướng đến trang theo role (lecturer/student).

### Giá trị

- Có nền tảng role-based để chạy các flow phía sau.

---

## Luồng 2: Student quản lý nhóm dự án

**Mục tiêu:** Student xem nhóm, vào workspace nhóm, thao tác repo/Jira.  
**Trạng thái:** Hoàn thành tốt (core flow).

### Happy path

1. Student xem danh sách nhóm của mình.
2. Mở chi tiết nhóm.
3. Liên kết repo GitHub cho group (link repo có sẵn hoặc tạo mới + link).
4. Liên kết Jira project key cho group.
5. Theo dõi trạng thái liên kết Jira/GitHub ngay trên workspace.

### Giá trị

- Group đã có điểm neo dữ liệu để đồng bộ và tạo báo cáo.

---

## Luồng 3: Student quản lý project cá nhân/nhóm từ GitHub

**Mục tiêu:** Chọn repo, kết nối với Jira để đồng bộ yêu cầu-coding.  
**Trạng thái:** Hoàn thành cơ bản.

### Happy path

1. Lấy danh sách repo GitHub của user.
2. Tìm kiếm/lọc repo.
3. Kiểm tra linked accounts (Jira đã connect chưa).
4. Thực hiện liên kết Jira trước khi link project.

### Giá trị

- Tạo đường dẫn dữ liệu từ GitHub/Jira vào hệ thống.

---

## Luồng 4: Lecturer giám sát groups theo class

**Mục tiêu:** Lecturer có dashboard và drill-down theo class/group.  
**Trạng thái:** Hoàn thành tốt.

### Happy path

1. Lecturer xem danh sách class.
2. Tải groups theo từng class.
3. Vào chi tiết group để xem tình trạng tích hợp, repos, commits gần đây.
4. Theo dõi các chỉ số nhóm phục vụ đánh giá.

### Giá trị

- Có màn hình điều phối chính cho giảng viên.

---

## Luồng 5: Tạo báo cáo học phần từ Jira/GitHub

**Mục tiêu:** Sinh báo cáo hỗ trợ đánh giá học phần.  
**Trạng thái:** Hoàn thành khá đầy đủ.

### Các loại report đã có endpoint/UI

1. SRS report
2. Assignments summary (Jira)
3. Commits stats (GitHub)

### Giá trị

- Đúng trọng tâm bài toán SWP391: giảm tổng hợp thủ công.

---

## 3) Luồng mới hoàn thành một phần hoặc chưa ổn định

## Luồng A: Admin end-to-end

**Trạng thái:** Một phần.

### Hiện trạng

- Có role `admin` trong logic và route target.
- Nhưng tuyến `/dashboard/admin` chưa hoàn thiện đồng bộ với toàn hệ thống.

### Hệ quả

- Có thể phát sinh điều hướng vào khu vực chưa sẵn sàng.

---

## Luồng B: Routing/Auth consistency

**Trạng thái:** Một phần.

### Hiện trạng

- Có sai khác giữa một số route auth (`/register` vs `/signup`).
- Một vài callback/redirect chưa đồng nhất chuẩn điều hướng theo role.

### Hệ quả

- Người dùng có thể gặp nhảy trang không mong muốn ở edge cases.

---

## Luồng C: Pagination production-grade

**Trạng thái:** Một phần.

### Hiện trạng

- Nhiều màn hình vẫn theo mô hình fetch toàn bộ + phân trang client/local state.
- Chưa chuẩn hóa server pagination + URL query state cho các list lớn.

### Hệ quả

- Khi dữ liệu tăng sẽ ảnh hưởng hiệu năng và khả năng chia sẻ link trạng thái.

---

## Luồng D: SEO production-grade

**Trạng thái:** Một phần.

### Hiện trạng

- Metadata tổng đã có.
- Nhưng chưa đầy đủ page-level SEO cho các route động + chưa chốt bộ robots/sitemap hoàn chỉnh cho release.

### Hệ quả

- Mức độ tối ưu index/search chưa tốt cho môi trường production.

---

## 4) Tóm tắt mức độ hoàn thành (onboarding nhanh)

- **Đã ổn:** Auth cơ bản, Student workspace, Lecturer monitoring, Reports core.
- **Đang cần chuẩn hóa:** Routing consistency, Admin flow, Pagination chuẩn server, SEO production.
- **Định hướng gần:** Chuẩn hóa quality gates để Codex Chat triển khai theo phase an toàn.

---

## 5) Kế hoạch triển khai ít rủi ro nhất cho Codex Chat

Nguyên tắc: làm từ **blast radius nhỏ -> lớn**, ưu tiên fix tính đúng trước tính đẹp.

## Phase 1 (Rủi ro thấp): Routing/Auth Consistency Hardening

**Mục tiêu:** Chốt route matrix và bỏ redirect sai.

### Task

1. Chuẩn hóa một nguồn chân lý cho route auth (`signin/signup`).
2. Đồng bộ callback redirect theo role thực tế.
3. Soát toàn bộ hardcoded redirect đến route chưa tồn tại.
4. Viết checklist route-role regression.

### Exit criteria

- Không còn redirect vào route không tồn tại.
- Flow login/callback qua 3 role chạy ổn định.

---

## Phase 2 (Rủi ro thấp-trung bình): Admin Scope Clarification

**Mục tiêu:** Hoặc bật tối thiểu admin page, hoặc tạm khóa an toàn các redirect admin.

### Task

1. Quyết định chính thức: có ship admin ở release hiện tại không.
2. Nếu chưa ship: chặn redirect admin về fallback an toàn.
3. Nếu ship: tạo skeleton `/dashboard/admin` + guard rõ ràng.

### Exit criteria

- Không còn dead-end cho role admin.

---

## Phase 3 (Rủi ro trung bình): Server Pagination chuẩn hóa

**Mục tiêu:** Áp dụng cho các list chính (classes/groups/projects).

### Task

1. Chuẩn contract `page`, `size`, `sort`, `q` cho API.
2. Đồng bộ hooks/data layer sang query-based fetching.
3. Đồng bộ UI pagination với URL search params.
4. Thêm loading/empty/error states nhất quán.

### Exit criteria

- List lớn không còn fetch all mặc định.
- Có deep-link cho trạng thái phân trang/lọc.

---

## Phase 4 (Rủi ro trung bình): SEO Production Pack

**Mục tiêu:** Tăng tính discoverability và chuẩn technical SEO.

### Task

1. Chuẩn hóa `siteConfig` theo brand/domain thật.
2. Thêm metadata theo page động quan trọng.
3. Bổ sung robots/sitemap theo môi trường.
4. Rà noindex cho route nội bộ/private.

### Exit criteria

- Metadata/canonical nhất quán production.
- Robots/sitemap hoạt động đúng với route public.

---

## Phase 5 (Rủi ro cao hơn): Report Quality & Trust

**Mục tiêu:** Nâng độ tin cậy dữ liệu đánh giá.

### Task

1. Chuẩn hóa mapping Jira task <-> GitHub contribution.
2. Thêm cảnh báo dữ liệu thiếu/không đồng bộ.
3. Thêm audit trail cho lần generate report.

### Exit criteria

- Báo cáo có quality signals rõ ràng, dễ audit.

---

## 6) Cách làm việc đề xuất với Codex Chat (Project Lead mode)

1. Mỗi phase tạo 1 branch + 1 milestone nhỏ.
2. Mỗi PR chỉ 1 mục tiêu, không trộn concerns.
3. Bắt buộc có checklist trước merge:
   - Route regression checklist
   - Auth role matrix checklist
   - API contract checklist (nếu đụng pagination)
   - SEO checklist (nếu đụng metadata/robots/sitemap)
4. Sau mỗi phase: chốt `what changed / impact / rollback plan`.

---

## 7) TL;DR cho người mới

Nếu bạn mới vào team, hãy hiểu theo thứ tự:

1. Đây là nền tảng đồng bộ Jira + GitHub cho SWP391.
2. Core flow đã chạy: Student-Group-Project linking + Lecturer monitoring + Reports.
3. Việc cần làm ngay để sản phẩm ổn định hơn: routing/auth consistency, admin scope, pagination, SEO.
4. Làm theo phase ở mục 5 để giảm rủi ro khi giao cho Codex Chat triển khai.
