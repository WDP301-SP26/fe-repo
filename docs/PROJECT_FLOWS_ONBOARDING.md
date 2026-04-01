# Project Flows (Demo Version)

Tài liệu này dùng để demo hội đồng theo 7 luồng chính của dự án.

## Update từ Codex changelog

- Đã có bản fix `Routing/Auth Consistency Hardening` trên nhánh `feat/new-flow-comingup` (commit `218eca8`).
- Đã bổ sung `Admin navigation thật` (sidebar + layout + breadcrumb) cho `/dashboard/admin`.
- Đã tách riêng `Topic Lab` cho Team Leader tại `/student/groups/:id/topic-lab` để trải nghiệm AI ideation.
- Đã chốt theo Priority Override (2026-03-19): **Luồng 3 + Luồng 4 = 100%** cho scope demo hiện tại.
- Đã có cập nhật triển khai `T-008` (2026-03-20): semester-first import đã code-complete ở FE + BE và đã push branch/commit.
- Trạng thái trong tài liệu này được đồng bộ theo task source of truth tại `docs/codex/codex-task-changelog.md`.

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
- Semester Week Governance (10-week timeline + checkpoints)

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
4. Team Leader có thể mở Topic Lab để AI suggest/refine đề tài, rồi apply đề tài vào nhóm.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE 100% cho demo** (đã có search/filter/pagination cho danh sách nhóm + Topic Lab tách riêng).

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
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE + BE 100% cho demo** (đã harden validate quyền repo, chuẩn hóa mã lỗi integration, và có retry/reconnect flow).

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
- **Đã hoàn thiện hết chưa:** **Hoàn thiện FE + BE 100% cho demo** (đã harden validate Jira project key, chuẩn hóa mã lỗi integration, warning/fallback dữ liệu thiếu cho report).

---

## Luồng 5: Lecturer theo dõi lớp và nhóm

**Mục tiêu:** Lecturer giám sát nhiều class/group từ một dashboard.

### Happy case

1. Lecturer mở dashboard.
2. Xem danh sách lớp và nhóm theo lớp.
3. Drill-down vào chi tiết group.
4. Theo dõi integrations, tiến độ và commit gần đây.
5. Theo dõi checkpoint theo tuần học kỳ:
   - Tuần 1: còn sinh viên nào chưa có nhóm không.
   - Tuần 2: còn nhóm nào chưa chốt đề tài không.

### Trạng thái triển khai

- **Đã triển khai:** Có.
- **Đã hoàn thiện hết chưa:** **Partially done** - đã có nền tảng dashboard; checkpoint tuần và summary compliance đang được ưu tiên triển khai tiếp theo.

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
2. Admin tạo học kỳ mới.
3. Admin upload 1 file Excel/XLSX chứa cả giảng viên + sinh viên.
4. Hệ thống validate theo dòng, hiển thị lỗi dữ liệu thiếu/sai định dạng.
5. Hệ thống import thành công: tạo/cập nhật lớp theo học kỳ, gán giảng viên và thêm sinh viên vào lớp.
6. Admin theo dõi trạng thái vận hành tổng thể.
7. (Ẩn, phục vụ demo) Admin có thể set tuần hiện tại để mô phỏng checkpoint tuần 1/tuần 2.
8. Admin quản lý User Management bằng search/filter/pagination client-side để trình bày demo nhanh.

### Trạng thái triển khai

- **Đã triển khai:** Có (FE + BE code-complete theo cập nhật `codex_report_changelog`).
- **Đã hoàn thiện hết chưa:** **Gần 100%** cho semester-first import; còn chờ 1 lần live sample import và tính năng ẩn set tuần phục vụ demo.
- **Ghi chú demo UI:** Integrations không nằm trong flow demo admin. Login copy không nêu explicit Admin. Admin demo tập trung vào `Users` + `Classes`.
- **Known limitation:** Pagination trang User Management hiện là client-side vì API users hiện chưa có server-side pagination contract.

---

## 3. Kết luận nhanh để demo hội đồng

- 7 luồng chính đều đã được xác định rõ.
- Luồng 3 (GitHub) và Luồng 4 (Jira) đã được chốt **100%** theo quyết định hiện tại của Project Lead.
- Luồng Admin theo scope semester-first import đã code-complete; còn thiếu live evidence để đóng strict Done 100%.
- Các phần ưu tiên tiếp theo: chạy live sample import để chốt Luồng 7, pagination server-side contract, chất lượng report.
- Các phần ưu tiên tiếp theo: triển khai tuần học kỳ (10 tuần), rule checkpoint tuần 1/2, hidden demo set-week, rồi chạy live evidence.

---

## 4. Nơi theo dõi task tiếp theo

Để tránh trùng lịch sử giữa nhiều file, toàn bộ task triển khai tiếp theo cho Codex được quản lý tập trung tại:

- `docs/codex/codex-task-changelog.md`

Lịch sử kết quả đã làm và commit thực thi tiếp tục theo dõi tại:

- `docs/codex/codex_report_changelog.md`
