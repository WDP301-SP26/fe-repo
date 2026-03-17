# Project Flows (Demo Version)

Tài liệu này dùng để demo hội đồng theo 7 luồng chính của dự án.

## Update từ Codex changelog

- Đã có bản fix `Routing/Auth Consistency Hardening` trên nhánh `feat/new-flow-comingup` (commit `218eca8`).
- Trạng thái trong tài liệu này phản ánh theo hướng: nếu PR merge vào `main` thì Luồng 1 được coi là hoàn thiện ở mức demo.

## 1. Scope

Project hiện tại: **Jira-GitHub Manager cho SWP391**.

Modules:

- Student
- Team Leader
- Lecturer
- Admin
- Group/Project
- Auth & Account Linking
- Reports

---

## 2. Bảy luồng chính

## Luồng 1: Đăng nhập và phân vai

**Mục tiêu:** Người dùng đăng nhập và đi đúng khu vực theo role.

### Happy case

1. User nhập email/password.
2. Hệ thống xác thực thành công.
3. Hệ thống tạo session + token.
4. User được điều hướng đến đúng trang theo role.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE 100% cho demo** (đã có route helper test cho matrix role chính).

---

## Luồng 2: Student tham gia và quản lý nhóm

**Mục tiêu:** Student theo dõi nhóm, vào workspace nhóm, theo dõi thông tin nhóm.

### Happy case

1. Student mở danh sách nhóm của mình.
2. Chọn một nhóm để vào workspace.
3. Xem thông tin nhóm, thành viên, trạng thái tích hợp.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE 100% cho demo** (đã có search/filter/pagination cho danh sách nhóm).

---

## Luồng 3: Liên kết GitHub cho nhóm/project

**Mục tiêu:** Gắn repo GitHub vào group để theo dõi đóng góp.

### Happy case

1. User đã connect GitHub account.
2. User chọn repo có sẵn hoặc tạo repo mới.
3. Hệ thống link repo vào group thành công.
4. Nhóm thấy trạng thái linked và dữ liệu commit có thể truy xuất.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Chưa 100%** (một số trường hợp lỗi token/quyền cần xử lý sâu hơn).

---

## Luồng 4: Liên kết Jira và đồng bộ task

**Mục tiêu:** Gắn Jira project vào group để lấy task/status.

### Happy case

1. User connect Jira account.
2. Chọn Jira project key và link vào group.
3. Hệ thống xác nhận linked.
4. Dữ liệu task của Jira được dùng cho analytics/report.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Chưa 100%** (cần tiếp tục harden validate và handling dữ liệu thiếu).

---

## Luồng 5: Lecturer theo dõi lớp và nhóm

**Mục tiêu:** Lecturer giám sát nhiều class/group từ một dashboard.

### Happy case

1. Lecturer mở dashboard.
2. Xem danh sách lớp và nhóm theo lớp.
3. Drill-down vào chi tiết group.
4. Theo dõi integrations, tiến độ và commit gần đây.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE 100% cho demo** (đã có search/filter/pagination theo class + integration).

---

## Luồng 6: Tạo báo cáo học phần

**Mục tiêu:** Sinh báo cáo SRS, Assignments, Commits cho chấm điểm.

### Happy case

1. User chọn nhóm và loại báo cáo.
2. Hệ thống gọi backend report API.
3. Trả về dữ liệu tổng hợp từ Jira/GitHub.
4. User xem kết quả và dùng cho đánh giá.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE 100% cho demo** (đã có metadata report, timestamp, data source, warning dữ liệu thiếu, pagination assignments).

---

## Luồng 7: Admin quản trị hệ thống

**Mục tiêu:** Quản trị tài khoản/quyền và vận hành nền tảng.

### Happy case

1. Admin đăng nhập vào khu vực quản trị.
2. Quản lý user/role và cấu hình hệ thống.
3. Theo dõi trạng thái vận hành tổng thể.

### Trạng thái triển khai

- **Đã triển khai:** **Một phần**.
- **Đã hoàn thiện hết chưa:** **Chưa** (đã có admin-safe fallback page, nhưng admin console end-to-end chưa đầy đủ).

---

## 3. Kết luận nhanh để demo hội đồng

- 7 luồng chính đều đã được xác định rõ.
- **Nếu PR `feat/new-flow-comingup` được merge:** 6 luồng core đạt mức demo ổn định hơn (đặc biệt Luồng 1).
- **Luồng Admin** vẫn là phần chưa hoàn thiện end-to-end.
- Các phần cần hoàn thiện tiếp: hardening tích hợp Jira/GitHub, pagination, chất lượng report, admin scope.

---

## 4. Nơi theo dõi task tiếp theo

Để tránh trùng lịch sử giữa nhiều file, toàn bộ task triển khai tiếp theo cho Codex được quản lý tập trung tại:

- `docs/codex/codex-task-changelog.md`

Lịch sử kết quả đã làm và commit thực thi tiếp tục theo dõi tại:

- `docs/codex/codex_report_changelog.md`
