# Phân Công Công Việc & Tiến Độ - Parking Management System (Version 6)

Dựa trên Database Schema mới nhất, dưới đây là bảng phân công chi tiết cho 4 thành viên. Bảng phân công này được chia thành các **Giai đoạn (Phases)** nhằm đảm bảo chất lượng, dễ dàng tích hợp và hoàn thành kịp tiến độ (TIẾN ĐỘ GẤP).

---

## 🚀 MỤC TIÊU TỐI THƯỢNG (MILESTONE QUAN TRỌNG NHẤT)
**Toàn bộ API Backend (BE) phải chạy mượt mà, test thành công trên Swagger trước ngày 10/06/2026.**

---

## 🎯 Giai đoạn 1 (Phase 1): Xây dựng nền tảng (Foundation)
**Deadline: 06/06/2026**
**Mục tiêu:** Hoàn thiện 100% Database, Entities, Repositories và các luồng CRUD cơ bản (Test ngay trên Swagger).
*Tất cả thành viên đồng loạt triển khai phần Master Data của mình.*

- **Thành viên 1 (Auth & User):**
  - `[ ]` Setup cấu trúc JWT, Spring Security (WebConfig, SecurityConfig).
  - `[ ]` API Authentication (`/login`, `/register`).
  - `[ ]` CRUD cho `Roles` và `Users`.
  
- **Thành viên 2 (Building & Floor):**
  - `[ ]` CRUD cho `Buildings` và `Floors`.
  - `[ ]` CRUD cho `Zones` và `ParkingSlots` (Chưa cần real-time status).

- **Thành viên 3 (Vehicle & Reservation):**
  - `[ ]` CRUD cho `VehicleTypes` và `Vehicles` (xử lý `EngineNumber`, `ChassisNumber` unique).
  - `[ ]` Luồng cơ bản cho `Reservations` (Chưa cần check slot trống thực tế).

- **Thành viên 4 (Pricing):**
  - `[ ]` CRUD cho `PricingPolicies` (Cấu hình giá giờ cao điểm, ngoài giờ).

---

## 🎯 Giai đoạn 2 (Phase 2): Nghiệp vụ cốt lõi (Core Business)
**Deadline: 08/06/2026**
**Mục tiêu:** Xử lý luồng Check-in, Check-out, Đặt chỗ thực tế và Tính toán chi phí. Toàn bộ API phải gọi thành công trên Swagger.

- **Thành viên 1 (Vehicle & Account):**
  - `[ ]` Hoàn thiện API Upload ảnh xe (`VehicleImage`).
  - `[ ]` API cho User quản lý xe cá nhân.

- **Thành viên 2 (Slot Management):**
  - `[ ]` Viết API tìm kiếm Slot đang trống (`AVAILABLE`) cho Thành viên 3 gọi.
  - `[ ]` Cập nhật trạng thái Slot real-time ('OCCUPIED', 'RESERVED').

- **Thành viên 3 (Session & Booking):**
  - `[ ]` Xử lý luồng Đặt chỗ thực tế (Tìm Slot của Thành viên 2 -> Hold Slot).
  - `[ ]` **Check-in:** Khởi tạo `ParkingSession` -> Đổi trạng thái Slot.
  - `[ ]` **Check-out:** Chốt thời gian `ExitTime` -> Gọi Thành viên 4 để tính tiền -> Đổi trạng thái Slot.

- **Thành viên 4 (Pricing Engine & Subscriptions):**
  - `[ ]` Thuật toán tính `FinalFee` từ `EntryTime` đến `ExitTime` dựa trên khung giờ (`RushHourStart`).
  - `[ ]` Xử lý `MonthlySubscriptions` (Tạo vé tháng).

---

## 🎯 Giai đoạn 3 (Phase 3): Tích hợp, Thanh toán & Báo cáo
**Deadline: 10/06/2026 (CHỐT HẠ API BE)**
**Mục tiêu:** Hoàn thiện thanh toán, xử lý ngoại lệ (Sự cố), Báo cáo. Chốt chặn cuối cùng cho Backend trên Swagger.

- **Thành viên 1 (Security & Validation):**
  - `[ ]` Hoàn thiện Authorization (Phân quyền chi tiết API nào cho Staff, API nào cho Customer).
  - `[ ]` Đảm bảo Validation toàn hệ thống (Bắt lỗi chuẩn).

- **Thành viên 2 (Monitoring):**
  - `[ ]` API Dashboard xem sơ đồ bãi xe thời gian thực (Bao nhiêu chỗ trống theo Zone/Tầng).

- **Thành viên 3 (Payments):**
  - `[ ]` Xử lý Record `Payments` (Cập nhật `PaymentStatus`).
  - `[ ]` Tích hợp cổng thanh toán VNPay/MoMo (Tùy chọn nâng cao).

- **Thành viên 4 (Incident & Reports):**
  - `[ ]` Quản lý `IncidentReports` (Sự cố `LOST_TICKET`, `FACILITY_DAMAGE`).
  - `[ ]` Báo cáo doanh thu (`RevenueReport`), tỉ lệ lấp đầy (`OccupancyReport`).
  - `[ ]` API sinh dữ liệu dự đoán `ParkingPredictions`.

---

## 💡 Phương pháp đảm bảo đúng hẹn 10/06
1. **Chỉ test qua Swagger:** Dồn toàn lực cho Backend chạy đúng logic, dùng Swagger UI (`/swagger-ui.html`) làm nơi demo và verify duy nhất, không chờ Front-end.
2. **Review Code (Hàng ngày):** Cuối ngày (Daily standup) 15 phút ráp API chạy thử liền trên Swagger.
3. **Ưu tiên luồng chính (Happy Path):** Các luồng Validate hoặc logic hóc búa để TODO (để lại làm sau), tập trung cho luồng chính xuyên suốt (Xe vào bãi -> Đậu xe -> Tính tiền -> Đi ra) chạy mượt trước.
