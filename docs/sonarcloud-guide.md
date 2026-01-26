# ☁️ SONARCLOUD - AUTOMATED CODE QUALITY

> **SonarCloud** là công cụ phân tích chất lượng code tự động (Static Code Analysis), giúp phát hiện bugs, lỗ hổng bảo mật (security vulnerabilities) và code smells trong dự án của bạn.

---

## 🏆 TẠI SAO NÊN DÙNG SONARCLOUD CHO SWP391?

1.  **Chuyên nghiệp:** Hiển thị badge "Quality Gate Passed" trên README nhìn rất "xịn".
2.  **Miễn phí:** Hoàn toàn Free cho public repositories (hoặc GitHub Student Pack).
3.  **Tự động:** Review code tự động mỗi khi tạo Pull Request.
4.  **Báo cáo đẹp:** Có biểu đồ, con số cụ thể để đưa vào báo cáo đồ án (SRS/Final Report).

---

## 🛠️ HƯỚNG DẪN SETUP (TÍCH HỢP VỚI GITHUB & NX)

### Bước 1: Đăng ký & Tạo Project

1.  Truy cập [SonarCloud.io](https://sonarcloud.io/).
2.  Login bằng **GitHub**.
3.  Nhấn **Import an organization from GitHub**.
4.  Chọn organization/tài khoản của bạn và chọn repo `jira-github-manager`.
5.  SonarCloud sẽ cấp cho bạn một **Project Key** và **Organization Key**.

### Bước 2: Lấy SONAR_TOKEN

1.  Trên SonarCloud: Vào **My Account** -> **Security** -> **Generate Token**.
2.  Đặt tên: `GitHub Actions`.
3.  Copy token này (Ví dụ: `squ_a1b2c3d4...`).

### Bước 3: Lưu Token vào Doppler

(Vì chúng ta đã thống nhất dùng Doppler để quản lý secrets)

```bash
# Run command local
doppler secrets set SONAR_TOKEN="squ_a1b2c3d4..."
```

_Sau đó Doppler sẽ tự động inject token này vào GitHub Actions (như sơ đồ CI/CD đã vẽ)._

### Bước 4: Tạo file cấu hình `sonar-project.properties`

Tạo file này ở thư mục gốc của dự án (`/`).

```properties
# sonar-project.properties

# Thông tin định danh (Lấy từ SonarCloud lúc tạo project)
sonar.projectKey=swp391-group5_jira-github-manager
sonar.organization=swp391-group5

# Tên hiển thị trên Dashboard
sonar.projectName=Jira GitHub Manager

# Version (có thể override bằng CI)
sonar.projectVersion=1.0

# Source code settings
sonar.sources=apps,libs
sonar.exclusions=**/*.spec.ts,**/*.spec.tsx,**/node_modules/**,**/dist/**,**/.next/**,**/coverage/**

# Test code settings
sonar.tests=apps,libs
sonar.test.inclusions=**/*.spec.ts,**/*.spec.tsx

# Coverage report (từ Jest)
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Encoding
sonar.sourceEncoding=UTF-8
```

### Bước 5: Cập nhật GitHub Actions Workflow

Trong file `.github/workflows/ci-cd.yml`, thêm bước chạy SonarCloud Scan sau khi test xong.

```yaml
- name: 🔐 Install Doppler CLI
  uses: dopplerhq/cli-action@v3

- name: 🔍 SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # GitHub tự có sẵn
    SONAR_TOKEN: ${{ env.SONAR_TOKEN }} # Lấy từ Doppler inject ra
```

---

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi setup xong, mỗi khi bạn push code hoặc tạo Pull Request:

1.  GitHub Actions sẽ chạy test và scan code.
2.  SonarCloud Bot sẽ comment trực tiếp vào PR:
    - ✅ **Quality Gate Passed:** Code ngon, cho merge.
    - ❌ **Quality Gate Failed:** Có bug critical hoặc coverage thấp -> Cần fix.

### Các chỉ số cần quan tâm (cho báo cáo):

- **Reliability:** Số lượng Bugs (A=0 bugs).
- **Security:** Số lượng Vulnerabilities (A=0).
- **Maintainability:** Số lượng Code Smells (Nợ kỹ thuật).
- **Coverage:** Độ phủ của Unit Test (Nên > 80%).

---

## 💡 TIPS CHO NX MONOREPO

Với setup đơn giản trên, SonarCloud sẽ coi cả Monorepo là **một project duy nhất**. Đây là cách dễ nhất cho đồ án sinh viên.

Nếu muốn tách riêng report cho Frontend (`apps/web`) và Backend (`apps/api`), bạn cần cấu hình `sonar.modules` phức tạp hơn. Tuy nhiên, **khuyến nghị ban đầu cứ để chung** cho dễ quản lý điểm số tổng thể.
