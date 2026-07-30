# Luồng Thực Thi Chức Năng Tự Động Chỉ Định Chỗ (Auto Assign Slot)

Tài liệu này giải thích chi tiết luồng hoạt động của tính năng **Auto Assign Slot** (Tự động tìm và chỉ định vị trí đỗ) trong quá trình đặt chỗ (Reservation).

---

## 1. Khi Nào Kích Hoạt Auto Assign Slot?

Tính năng này được kích hoạt khi người dùng tạo một yêu cầu đặt chỗ nhưng **không truyền lên cụ thể ID của vị trí đỗ** (`slotId = null`).
Thường xảy ra khi người dùng dùng chức năng "Đặt nhanh" (Quick Booking) trên ứng dụng: người dùng chỉ chọn loại xe và khoảng thời gian, còn hệ thống tự quyết định và sắp xếp vị trí tốt nhất.

---

## 2. Luồng Xử Lý Dữ Liệu (Data Flow) & Mã Nguồn

### Bước 1: API Endpoint (Controller)
Frontend gửi một request `POST /api/reservations` với payload có chứa thông tin xe, `vehicleTypeId` nhưng `slotId` thì bị khuyết (hoặc gửi lên giá trị `null`). 
`ReservationController` tiếp nhận yêu cầu và đẩy dữ liệu `ReservationRequest` xuống tầng `ReservationService`.

### Bước 2: Business Logic (Service)
Trong `ReservationService.java`, tại hàm `create()`, hệ thống tiến hành kiểm tra sự tồn tại của `slotId`:

```java
// File: ReservationService.java
ParkingSlot slot;
if (request.getSlotId() == null) {
    // Đặt nhanh: Tìm chỗ trống đầu tiên
    slot = parkingSlotRepository
            .findFirstAvailableSlot(request.getVehicleTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));
} else {
    // Chọn thủ công ...
}
```

Do `slotId == null`, Service chuyển hướng xử lý sang gọi trực tiếp hàm tìm kiếm tự động `findFirstAvailableSlot(vehicleTypeId)` từ tầng Repository.

### Bước 3: Truy Vấn & Khóa Dữ Liệu Đồng Thời (Repository)
Đây là phần cốt lõi của tính năng Auto Assign Slot. Tại hàm này trong `ParkingSlotRepository.java`:

```java
// File: ParkingSlotRepository.java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT s FROM ParkingSlot s WHERE s.vehicleType.vehicleTypeId = :vehicleTypeId " +
       "AND s.status = com.parking.management.module.slot.SlotStatus.AVAILABLE " +
       "AND s.isActive = true " +
       "AND s.currentOccupancy < s.capacity " +
       "ORDER BY s.zone.floor.floorNumber DESC, LENGTH(s.slotCode) ASC, s.slotCode ASC LIMIT 1")
Optional<ParkingSlot> findFirstAvailableSlot(@Param("vehicleTypeId") Integer vehicleTypeId);
```

#### Giải thích chi tiết câu lệnh truy vấn (SQL Logic):
1. **Lọc dữ liệu hợp lệ (WHERE clauses):**
   - `s.vehicleType.vehicleTypeId = :vehicleTypeId`: Chỉ tìm slot đúng với loại xe khách yêu cầu (Ví dụ: xe 4 chỗ thì chỉ tìm slot hỗ trợ xe 4 chỗ).
   - `s.status = ...AVAILABLE`: Trạng thái của slot bắt buộc phải đang trống.
   - `s.isActive = true`: Slot không bị bảo trì hoặc đang bị vô hiệu hóa.
   - `s.currentOccupancy < s.capacity`: Số lượng xe đang đỗ tại slot phải nhỏ hơn sức chứa tối đa của slot (Áp dụng cho các bãi xe dùng chung hoặc nhiều tầng).

2. **Sắp xếp độ ưu tiên - Thuật toán chọn Slot (ORDER BY):**
   - `s.zone.floor.floorNumber DESC`: Ưu tiên xếp khách vào các tầng có số tầng cao trước.
   - `LENGTH(s.slotCode) ASC, s.slotCode ASC`: Sắp xếp mã slot theo độ dài rồi đến bảng chữ cái (Alpha-numeric sort). Đảm bảo hệ thống sẽ lấy slot tuần tự (ví dụ: A1 -> A2 -> A9 -> A10, tránh việc lấy A10 trước A2).
   - `LIMIT 1`: Trong danh sách các slot thoả mãn, chỉ lấy ra đúng **1 slot tốt nhất** đứng đầu danh sách.

3. **Cơ chế chống Race Condition (Khóa đồng thời - Concurrency Control):**
   - Chú ý annotation `@Lock(LockModeType.PESSIMISTIC_WRITE)`. 
   - Dưới Database (như PostgreSQL, MySQL), nó sẽ tự động dịch thành câu lệnh `SELECT ... FOR UPDATE`.
   - **Tác dụng cốt lõi:** Giả sử có 2 khách hàng A và B cùng lúc (trong cùng 1 phần ngàn giây) nhấn nút "Đặt nhanh". Nếu không có cơ chế khóa, câu lệnh SELECT của cả 2 request sẽ cùng tìm thấy slot "A1" đang trống, và cùng trả "A1" về cho cả 2 người -> Gây lỗi 1 chỗ cho 2 người đặt (Double Booking).
   - Với `PESSIMISTIC_WRITE`, khi truy vấn của khách A chạy đến trước, DB sẽ **khóa (lock)** dòng dữ liệu của slot "A1" lại. Lúc này truy vấn của khách B chạy đến sẽ phải tạm thời đứng chờ. Khi khách A hoàn thành xong quy trình lưu vé (commit transaction), khách B mới được tiếp tục đọc. Do đó, hệ thống đảm bảo tuyệt đối sự toàn vẹn dữ liệu.

### Bước 4: Khởi Tạo Phiếu Đặt Chỗ (Tạo Reservation)
- **Trường hợp Hết Chỗ:** Nếu query trả về rỗng (`Optional.empty()`), hàm `orElseThrow` sẽ bắn ra `ResourceNotFoundException`. Exception Handler của hệ thống sẽ bắt lỗi này và trả về frontend mã 404/400 kèm thông báo lỗi.
- **Trường hợp Có Chỗ:** Slot lý tưởng nhất được lấy ra. Hệ thống tiếp tục tạo bản ghi `Reservation` gán với Slot này:
```java
Reservation reservation = new Reservation();
// ...
reservation.setSlot(slot);
reservation.setStatus("PENDING");
```

**Lưu ý cực kỳ quan trọng về trạng thái:** Ngay tại bước này, trạng thái của Slot vẫn **chưa** bị cập nhật thành `RESERVED` ở Database. Chỗ này sẽ chỉ chính thức đổi màu/bị khóa trạng thái khi Reservation chuyển thành `CONFIRMED` (thường là sau bước thanh toán tiền cọc thành công).
Tuy nhiên, slot này vẫn tạm thời an toàn vì bảng `reservations` đã ghi nhận sự tồn tại của vé này, và hàm kiểm tra Double Booking (`findOverlappingReservations`) ở những luồng đặt chỗ thủ công khác sẽ tự quét bảng vé để phát hiện sự trùng lặp (overlap) thời gian.

---

## 3. Tổng Kết API Flow (Tóm Lược)

1. **Frontend Request** -> `POST /api/reservations` `(slotId: null)`
2. **Controller** -> Nhận request, Validation cơ bản, chuyển DTO xuống Service.
3. **Service** -> Phát hiện `slotId == null`, rẽ nhánh gọi `findFirstAvailableSlot()`.
4. **Repository (DB)** -> Tìm slot trống hợp lệ tốt nhất qua SQL. Dùng khóa Row-level (`Pessimistic Write`) để tránh tranh chấp từ các request khác.
5. **Service** -> Lấy được Slot thành công, sinh ra bản ghi `Reservation` với trạng thái ban đầu là `PENDING`. Lưu vào Database.
6. **Controller** -> Trả về JSON Response của vé đặt chỗ (Lúc này payload đã được Backend tự điền đủ thông tin chi tiết về Slot vừa được chỉ định).
7. **Frontend Response** -> Hiển thị kết quả cho người dùng, người dùng sẽ thấy thông báo: "Bạn đã được xếp vào vị trí A1".
