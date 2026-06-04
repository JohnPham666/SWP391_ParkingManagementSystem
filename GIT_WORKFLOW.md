# 🛠 Hướng Dẫn Sử Dụng Git & GitHub (Tránh Conflict)

Để đảm bảo team 4 người code chung trên một dự án mà không dẫm chân lên nhau (Conflict) và làm hỏng code của người khác, toàn bộ team **BẮT BUỘC** tuân thủ quy trình dưới đây.

---

## 1. Nguyên Tắc Cốt Lõi
- **KHÔNG BAO GIỜ** code trực tiếp trên nhánh `main`. Nhánh `main` chỉ chứa code đã chạy ổn định và dùng để test/deploy.
- Mỗi tính năng / task = **1 Nhánh (Branch) riêng biệt**.
- Khi xong việc, tạo **Pull Request (PR)** để ghép code vào `main`. Không tự ý gộp thẳng (`git push origin main`).
- Luôn luôn kéo code mới nhất từ `main` về trước khi bắt đầu code tính năng mới.

---

## 2. Quy Trình 4 Bước Code & Push Lên GitHub

### Bước 1: Kéo (Pull) code mới nhất và tạo nhánh
Trước khi bắt đầu code tính năng của mình (Ví dụ: chức năng login), hãy luôn đứng ở nhánh `main` và lấy code mới nhất:
```bash
# 1. Chuyển về nhánh main
git checkout main

# 2. Lấy code mới nhất từ remote (GitHub) về máy
git pull origin main

# 3. Tạo nhánh mới và chuyển sang nhánh đó để code
# Quy tắc đặt tên nhánh: feature/[tên-tính-năng] hoặc [tên-bạn]/[tên-tính-năng]
# Ví dụ: feature/auth-login hoặc john/create-user
git checkout -b feature/auth-login
```

### Bước 2: Viết Code và Lưu lại (Commit)
Bây giờ bạn bắt đầu code. Sau khi làm xong hoặc cuối ngày, hãy lưu (commit) code lại:
```bash
# 1. Xem các file đã thay đổi
git status

# 2. Thêm tất cả các file đã sửa vào trạng thái chờ commit
git add .

# 3. Lưu lại với lời nhắn rõ ràng (Nên ghi chú mình đã làm gì)
# Ví dụ:
git commit -m "feat: Thêm API đăng nhập và đăng ký"
```

### Bước 3: Đẩy code lên GitHub (Push)
```bash
# Đẩy nhánh vừa tạo lên GitHub
git push origin feature/auth-login
```

### Bước 4: Tạo Pull Request (PR) và Ghép Code (Merge)
1. Lên trang GitHub của dự án, bạn sẽ thấy thông báo nhánh của bạn vừa được push. Nhấn nút **"Compare & pull request"**.
2. Nhờ 1 bạn khác trong team (hoặc Leader) xem qua code của bạn (Code Review). 
3. Nếu không có lỗi, nhấn **"Merge pull request"** để gộp code vào `main`.
4. Sau khi merge xong, nhánh `main` trên GitHub đã có code của bạn. Bạn có thể xóa nhánh `feature/auth-login` trên GitHub.

---

## 3. Cách Xử Lý & Tránh Conflict (Xung Đột Code)

**Conflict xảy ra khi nào?**
Khi 2 người cùng sửa chung **1 dòng code trên cùng 1 file**, Git không biết nên giữ lại code của ai.

**Cách phòng tránh 99% Conflict:**
1. Tránh việc 2 người cùng sửa chung 1 file cùng lúc. Đã chia theo bảng phân công ở `TEAM_TASKS.md` thì cứ đúng file của mình mà làm.
2. Mỗi buổi sáng trước khi code, NHỚ chạy `git checkout main` và `git pull origin main` để update code của người khác về.
3. Chia nhỏ code, commit thường xuyên, đẩy lên sớm để mọi người thấy.

**Nếu lỡ bị Conflict khi tạo PR, phải làm sao?**
Giả sử bạn đang ở nhánh `feature/auth-login` và GitHub báo bị Conflict (không cho merge):
```bash
# 1. Chuyển về nhánh main và update code mới nhất
git checkout main
git pull origin main

# 2. Quay lại nhánh của bạn
git checkout feature/auth-login

# 3. Kéo code từ main vào nhánh của bạn để giải quyết conflict
git merge main
```
Lúc này, trong các file bị conflict sẽ xuất hiện các dòng ký hiệu `<<<<<<<`, `=======`, `>>>>>>>`. 
Bạn mở file đó lên bằng IDE (VSCode / IntelliJ), chọn "Accept Current Change" (giữ code của bạn), "Accept Incoming Change" (giữ code trên main), hoặc tự sửa tay kết hợp cả hai.
Sau khi sửa xong:
```bash
git add .
git commit -m "fix: Resolve merge conflicts with main"
git push origin feature/auth-login
```
Tuyệt vời! Bây giờ Pull Request trên GitHub đã chuyển sang màu xanh và có thể Merge!

---
## 💡 Bảng Cheat Sheet Tên Commit Nhanh
Nên đặt tiền tố (prefix) trước câu commit để team dễ hiểu:
- `feat: [Mô tả]` -> Khi làm tính năng mới. (VD: `feat: Thêm API đặt chỗ`)
- `fix: [Mô tả]` -> Khi sửa lỗi (bug). (VD: `fix: Sửa lỗi tính tiền sai`)
- `refactor: [Mô tả]` -> Cải thiện code nhưng không làm thay đổi tính năng.
- `docs: [Mô tả]` -> Sửa file tài liệu (như file này).
