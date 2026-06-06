# Hướng dẫn Kiểm tra Bảo mật (Security Test Guide)

Tài liệu này dùng để kiểm thử các tính năng bảo mật (Authentication, Role-Based Access Control, IDOR Prevention) được xây dựng trong Phase 3 của hệ thống Parking Management.

## Chuẩn bị chung
1. Mở Swagger UI: `http://localhost:8080/swagger-ui/index.html`
2. Sử dụng API `POST /api/auth/login` để lấy Token (chuỗi JWT).
3. Copy chuỗi Token, kéo lên đầu trang Swagger, bấm nút **Authorize** (ổ khoá màu xanh lá), dán `Bearer <Token>` vào và bấm Authorize.

---

## 1. Test "Global Validation" (Bắt lỗi đầu vào chuẩn hoá)
**👉 Mục đích:** Đảm bảo hệ thống trả về mã lỗi 400 rõ ràng khi dữ liệu đầu vào bị thiếu/sai, thay vì văng Exception 500.

**👉 Các bước thực hiện:**
1. Authorize bằng bất kỳ tài khoản nào.
2. Kéo xuống mục **Vehicle Controller**, mở API `POST /api/vehicles` (Tạo xe mới).
3. Chỉnh sửa tham số đầu vào (JSON body), cố tình **xoá trường `licensePlate`** hoặc để `vehicleTypeId: null`.
4. Bấm **Execute**.
5. **Kết quả:** Phải nhận được HTTP Status `400 Bad Request`.
6. **Body trả về:** Dạng JSON sạch sẽ báo lỗi, ví dụ: 
   ```json
   {
     "licensePlate": "License plate is required"
   }
   ```

---

## 2. Test "Granular Authorization" (Phân quyền theo chức vụ)
**👉 Mục đích:** Đảm bảo hệ thống chặn người dùng cấp thấp (Driver) truy cập vào API của Admin hoặc Staff.

**👉 Các bước thực hiện:**
1. Dùng API Login để lấy Token của một tài khoản **Driver** (tài khoản tự đăng ký).
2. Authorize Swagger bằng Token của Driver đó.
3. Kéo xuống mục **User Controller** (Đây là khu vực dành riêng cho Admin). Mở API `GET /api/users`.
4. Bấm **Execute**.
5. **Kết quả:** Phải nhận được HTTP Status `403 Forbidden`. Lý do: Driver không có quyền `ROLE_Admin`.

*(Bạn có thể thử làm ngược lại: Lấy Token của Admin và gọi API này, kết quả sẽ thành công `200 OK`)*.

---

## 3. Test "IDOR Prevention" (Chống trộm dữ liệu chéo)
**👉 Mục đích:** Đảm bảo một Driver không thể xem/sửa/xoá dữ liệu (Xe, Hoá đơn, Đặt chỗ) thuộc về một Driver khác.

**👉 Các bước thực hiện:**
1. Chuẩn bị: Biết được 1 Vehicle ID (ví dụ: `15`) thuộc về **Driver B**.
2. Authorize Swagger bằng Token của **Driver A** (một người hoàn toàn không liên quan đến chiếc xe 15).
3. Kéo xuống mục **Vehicle Controller**, mở API `GET /api/vehicles/{id}` hoặc `PUT /api/vehicles/{id}`.
4. Nhập `15` vào tham số `id`.
5. Bấm **Execute**.
6. **Kết quả:** Phải nhận được HTTP Status `403 Forbidden` kèm thông báo: *"Access denied: You do not have permission to access or modify this data"*.
7. Lý do: Hàm bảo mật `SecurityUtils` đã kiểm tra và thấy Token thuộc về Driver A, nhưng xe ID 15 lại thuộc về Driver B.
