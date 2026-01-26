# Nx Release & Changelog Workflow

Hướng dẫn thiết lập và sử dụng **Nx Release** để tự động hóa quy trình đánh phiên bản (Versioning) và tạo nhật ký thay đổi (Changelog) dựa trên **Conventional Commits**.

---

## 1. 🧠 Concepts (Khái niệm)

### Conventional Commits

Nx Release hoạt động tốt nhất khi bạn tuân thủ quy tắc đặt tên commit:

| Commit Type              | Ý nghĩa       | Tác động Version              | Ví dụ                           |
| ------------------------ | ------------- | ----------------------------- | ------------------------------- |
| `fix(...)`               | Sửa lỗi       | **Patch** (`1.0.0` → `1.0.1`) | `fix: login button not working` |
| `feat(...)`              | Tính năng mới | **Minor** (`1.0.0` → `1.1.0`) | `feat: add dark mode`           |
| `BREAKING CHANGE`        | Thay đổi lớn  | **Major** (`1.0.0` → `2.0.0`) | `feat!: rewrite api layer`      |
| `chore`, `docs`, `style` | Khác          | Không đổi version             | `chore: update dependencies`    |

### Nx Release Flow

Khi chạy `nx release`, quy trình sau sẽ diễn ra:

1.  **Analyze**: Phân tích commit từ lần release cuối cùng.
2.  **Version**: Cập nhật `package.json` (tăng version).
3.  **Changelog**: Tạo/Cập nhật `CHANGELOG.md` cho từng project và workspace.
4.  **Git**: Tạo commit release và đánh tag (VD: `v1.0.1`).
5.  **Publish**: (Optional) Publish lên npm (Chúng ta sẽ tắt bước này vì là private repo).

---

## 2. 🛠 Setup (Cài đặt)

Chạy lệnh khởi tạo tương tác:

```bash
npx nx release init
```

### Hướng dẫn trả lời câu hỏi:

**Q1: What prevents you from releasing... (relationship)?**

> Chọn: **Fixed** (Locked mode)
> _Lý do: Để tất cả projects trong monorepo cùng chung 1 version (dễ quản lý)._

**Q2: Do you want to publish... (npm)?**

> Chọn: **No**
> _Lý do: Repo private, không publish lên npm public._

**Q3: Which commit message format...**

> Chọn: **Conventional Commits** (angular/conventional-commits)

**Q4: Do you want to generate a CHANGELOG.md?**

> Chọn: **Yes**

---

## 3. ⚙️ Configuration (Cấu hình `nx.json`)

Sau khi init, `nx.json` sẽ được cập nhật. Đảm bảo cấu hình giống như sau để tắt publish và bật changelog:

```jsonc
// nx.json
{
  "release": {
    "version": {
      "conventionalCommits": true,
      "generatorOptions": {
        "packageRoot": "dist/{projectRoot}", // Hoặc config mặc định
        "currentVersionResolver": "git-tag",
        "specifierSource": "conventional-commits",
      },
    },
    "changelog": {
      "workspaceChangelog": {
        "createRelease": "github", // Tạo GitHub Release
      },
      "projectChangelogs": true, // Tạo CHANGELOG.md trong từng apps/libs
    },
    "git": {
      "commit": true,
      "tag": true,
    },
    // Quan trọng: Tắt bước publish
    "release-publish": false,
  },
}
```

---

## 4. 🚀 Usage (Sử dụng)

### Cách 1: Chạy Release thủ công (Recommended for first time)

Khi bạn muốn ra mắt phiên bản mới:

```bash
# Chạy dry-run (chạy thử, không thay đổi file)
npx nx release --dry-run

# Chạy thật (sẽ sửa file, git commit & tag)
npx nx release

# Push changes và tags lên GitHub
git push --follow-tags
```

### Cách 2: Setup trong CI (Advanced)

Tự động release khi merge vào `main`.

Thêm vào `.github/workflows/ci.yml`:

```yaml
# Chỉ chạy khi push vào main
- name: Release
  if: github.ref == 'refs/heads/main'
  run: npx nx release --skip-publish
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    # Cần set git user/email trong CI
```

---

## 5. 🔍 Demo

Giả sử hiện tại version là `0.0.0`.

1.  **Dev A:** `feat: add user profile page`
2.  **Dev B:** `fix: incorrect tax calculation`
3.  **Release Manager:** Chạy `npx nx release`

**Kết quả:**

- Version bump: `0.1.0` (vì có `feat`)
- `CHANGELOG.md` được ghi thêm:
  - **Features:** add user profile page
  - **Bug Fixes:** incorrect tax calculation
- Git tag `v0.1.0` được tạo.
