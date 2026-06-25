# Kế Hoạch Kiểm Thử Toàn Diện (End-to-End E2E Test Plan)

**Mục tiêu:** Kiểm tra sự liền mạch của các luồng nghiệp vụ (Business Flows) giữa các vai trò (Roles) trong hệ thống: `Admin`, `Manager`, `Staff` và `Driver`.
**Phân công:** Hai Tester sẽ đóng các vai trò khác nhau để giả lập tương tác thực tế (VD: Người A làm Driver, Người B làm Staff).

---

## 🚘 Luồng 1 & 3: Khách Vãng Lai (Walk-in Check-in & Check-out)
**Các Role tham gia:** `Staff` (Nhân viên soát vé)
1. **Walk-in Check-in:**
   - `Staff` đăng nhập, đứng tại giao diện cổng vào.
   - Nhập biển số xe (VD: `59A-11111`) chưa từng đặt trước. Gọi `POST /api/sessions/walk-in`.
   - **Kỳ vọng:** Bãi còn chỗ trống, tạo thành công phiên đỗ xe (Status `PARKING`), trả về `sessionId`. Slot tự động tăng `currentOccupancy` và đổi sang `OCCUPIED`.
2. **Walk-in Check-out:**
   - 3 tiếng sau, khách ra cổng. `Staff` nhập biển số để lấy thông tin phiên.
   - Gọi `POST /api/sessions/{sessionId}/check-out`.
   - **Kỳ vọng:** Hệ thống tính toán `finalFee` = phí cơ bản + phí theo giờ (tính bằng PricingService). Session chuyển thành `COMPLETED`, giải phóng Slot (`AVAILABLE`).

## 📱 Luồng 2 & 4: Khách Đặt Chỗ Trước (Make Reservation & Check-out)
**Các Role tham gia:** `Driver` (Tài xế), `Staff` (Nhân viên)
1. **Make Reservation:**
   - `Driver` mở app, chọn xe (phải là Ô tô), chọn giờ từ `10:00 - 14:00`, gọi `POST /api/reservations`.
   - `Driver` thanh toán qua VNPay, Reservation chuyển từ `PENDING` sang `CONFIRMED`.
2. **Check-in Reservation:**
   - Khách lái xe tới bãi. `Staff` soát vé, gọi `POST /api/sessions/check-in` kèm theo `reservationId`.
   - **Kỳ vọng:** Slot cập nhật `OCCUPIED`.
3. **Check-out Reservation:**
   - Khách ra cổng lúc `13:30` (sớm hơn dự kiến). `Staff` gọi `POST /api/sessions/{id}/check-out`.
   - **Kỳ vọng:** Không phát sinh phí lố giờ, `finalFee = 0` (hoặc số âm nếu có chính sách hoàn tiền nhưng hiện tại quy định là >= 0). Reservation chuyển sang `COMPLETED`.
   - *(Edge Case: Khách ra lúc `15:00`, trễ 1 tiếng -> `finalFee` chỉ tính tiền thêm cho 1 tiếng này).*

## 💳 Luồng 5 & 6: Khách Vé Tháng (Subscription Lifecycle)
**Các Role tham gia:** `Manager`, `Driver`, `Staff`

### Test Case 5.1: Đăng ký vé tháng thành công
- **Tiền điều kiện:** Có sẵn `userId` của Driver và `vehicleId` của xe `60B-22222` trong hệ thống.
- **Các bước:**
  1. Người dùng gọi `POST /api/subscriptions` với payload: `{"userId": 1, "vehicleId": 2, "startDate": "2026-06-23", "monthlyFee": 500000}`.
- **Expected Output:**
  - Bước 1: Trả về HTTP 200 (hoặc 201), trạng thái Subscription tự động được set là `ACTIVE`. Ngày `endDate` được tự động cộng thêm 1 tháng so với `startDate`.

### Test Case 6.1: Check-in bằng xe có vé tháng hợp lệ
- **Tiền điều kiện:** Bãi còn chỗ trống. Xe `60B-22222` có vé tháng `ACTIVE`.
- **Các bước:**
  1. Staff đứng tại cổng, gọi `POST /api/sessions/walk-in` với `{"licensePlate": "60B-22222"}`.
- **Expected Output:**
  - HTTP 201 Created (hoặc 200). Bãi cập nhật `currentOccupancy` + 1. `sessionId` được trả về với nhận diện vé tháng.

### Test Case 6.2: Check-out xe vé tháng
- **Tiền điều kiện:** Xe `60B-22222` đang trong bãi đỗ (có session `PARKING`).
- **Các bước:**
  1. Staff gọi `POST /api/sessions/{id}/check-out`.
- **Expected Output:**
  - HTTP 200 OK. `finalFee` trả về là `0`. Trạng thái phiên đỗ xe đổi thành `COMPLETED`, giải phóng 1 slot.

### Test Case 6.3: Check-in khi vé tháng đã hết hạn
- **Tiền điều kiện:** Xe `60B-22222` có vé tháng nhưng `endDate` nằm trong quá khứ.
- **Các bước:**
  1. Staff gọi `POST /api/sessions/walk-in` với `{"licensePlate": "60B-22222"}`.
- **Expected Output:**
  - Vẫn cho phép check-in nhưng tạo phiên đỗ xe như khách vãng lai thông thường (không áp dụng quyền lợi vé tháng).

## ⚠️ Luồng 7: Quy Trình Xử Lý Sự Cố (Incident Report)
**Các Role tham gia:** `Staff` hoặc `Driver` (Tạo report), `Manager` (Xử lý)

### Test Case 7.1: Driver báo cáo sự cố thành công
- **Tiền điều kiện:** Driver đã đăng nhập.
- **Các bước:**
  1. Driver gọi `POST /api/incidents` với `{"description": "Xước xe", "photoUrl": "http://img.com/a.jpg", "licensePlate": "59A-11111"}`.
- **Expected Output:**
  - HTTP 201 Created. Trả về thông tin sự cố với status = `REPORTED`.

### Test Case 7.2: Manager thay đổi trạng thái sự cố
- **Tiền điều kiện:** Có incident ID đang ở trạng thái `REPORTED`. Manager đăng nhập.
- **Các bước:**
  1. Manager gọi `GET /api/incidents` để lấy danh sách sự cố.
  2. Manager gọi `PUT /api/incidents/{id}/status` với `{"status": "INVESTIGATING"}`.
  3. Manager gọi `PUT /api/incidents/{id}/status` với `{"status": "RESOLVED", "resolutionNotes": "Đã bồi thường"}`.
- **Expected Output:**
  - Bước 1: HTTP 200, trả về danh sách chứa incident ID trên.
  - Bước 2: HTTP 200, status chuyển thành `INVESTIGATING`.
  - Bước 3: HTTP 200, status chuyển thành `RESOLVED` kèm ghi chú giải quyết.

## 📊 Luồng 8: Báo Cáo & Thống Kê Doanh Thu (Reporting)
**Các Role tham gia:** `Manager` hoặc `Admin`

### Test Case 8.1: Thống kê doanh thu theo khoảng thời gian
- **Tiền điều kiện:** Có dữ liệu Payment `COMPLETED` trong khoảng `01/06/2026` đến `30/06/2026`. Admin đăng nhập.
- **Các bước:**
  1. Admin gọi `GET /api/dashboard/revenue?fromDate=2026-06-01&toDate=2026-06-30`.
- **Expected Output:**
  - HTTP 200 OK. Trả về tổng doanh thu chính xác, khớp với tổng các giao dịch thanh toán thành công trong DB.

### Test Case 8.2: Thống kê không có dữ liệu
- **Tiền điều kiện:** Không có giao dịch nào trong khoảng `01/01/2000` đến `31/01/2000`. Admin đăng nhập.
- **Các bước:**
  1. Admin gọi `GET /api/dashboard/revenue?fromDate=2000-01-01&toDate=2000-01-31`.
- **Expected Output:**
  - HTTP 200 OK. Doanh thu trả về là `0` hoặc mảng dữ liệu rỗng (không báo lỗi server).

---

## 🔒 Kiểm Thử Bảo Mật (Authorization Boundary Check)
Mọi Tester cần luôn mang theo "Mindset" của Hacker để thử xâm nhập quyền hạn chéo:
* `Driver` thử gọi API Duyệt vé tháng (Dành cho Manager).
* `Staff` thử gọi API Xem doanh thu tổng (Dành cho Admin).
* `Manager` thử tạo Reservation bằng ID của `Driver` khác.
* **Kỳ vọng chung:** Hệ thống phản hồi `HTTP 403 Forbidden` đối với bất kỳ hành vi lấn quyền nào.
