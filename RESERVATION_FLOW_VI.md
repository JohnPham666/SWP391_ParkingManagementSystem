# Luồng Thực Thi Chức Năng Đặt Chỗ (Reservation)

Dưới đây là toàn bộ luồng thực thi (runtime execution flow) cho tính năng Đặt chỗ, theo dõi một yêu cầu từ giao diện người dùng (frontend) đi đến cơ sở dữ liệu (database) và quay trở lại. Mỗi bước đều được đính kèm đoạn code tham khảo để dễ theo dõi.

---

### Frontend
↓
**1. Lớp/Hàm được gọi:** `ReservationPage.jsx` → `handleModalOk()` → `driverService.createReservation(payload)` → `driverApi.createReservation(data)`
```javascript
// File: ReservationPage.jsx
const handleModalOk = async () => {
    try {
        setErrorAlert(null);
        // ...
```

**2. Lý do gọi & Cách thức đặt chỗ:** Có 2 cách để mở modal và kích hoạt luồng đặt chỗ này:
   - **Cách 1: Tự tạo form (Đặt chỗ tự động tìm chỗ):** Người dùng nhấn nút "New Reservation" trên trang quản lý đặt chỗ, tự chọn xe và khoảng thời gian. Hệ thống sẽ tự tìm một vị trí trống phù hợp nhất (lúc này `slotId` gửi lên là `null`).
   - **Cách 2: Nhấn nút đặt trên thẻ slot (Chọn chỗ thủ công):** Người dùng vào trang sơ đồ bãi đỗ (Parking Area), nhấn vào nút "Book" trực tiếp trên một thẻ (card) của một vị trí đỗ (slot) cụ thể đang trống. Modal hiện lên đã được điền sẵn vị trí đó (lúc này có gửi kèm `slotId`).
   
   Bất kể dùng cách nào, luồng này sẽ thực sự bắt đầu khi người dùng nhấn nút "Confirm Booking" trên modal.
```javascript
// File: ReservationPage.jsx
<Modal
    title={<Title level={4} style={{ margin: 0 }}>Book Parking Slot</Title>}
    open={isModalVisible}
    onOk={handleModalOk} // <-- Nút Confirm kích hoạt hàm này
    // ...
>
```

**3. Dữ liệu đầu vào (Input):** Các giá trị thô từ form người dùng nhập (ví dụ: `vehicleId`, `slotId`, `startTime`, `endTime`).
```javascript
// Gom dữ liệu từ Form
const values = await form.validateFields(); 
```

**4. Kiểm tra dữ liệu (Validation):**
   - Kiểm tra `startTime` (thời gian bắt đầu) phải diễn ra trước `endTime` (thời gian kết thúc).
   - Kiểm tra xem trạng thái của phương tiện có phải là `APPROVED` (Đã duyệt) hay không (người dùng không thể đặt chỗ với giấy tờ xe đang chờ duyệt hoặc bị từ chối).
```javascript
// Kiểm tra Start Time và End Time
if (values.startTime.valueOf() >= values.endTime.valueOf()) {
    setErrorAlert('End Time must be after Start Time');
    return;
}

// Kiểm tra giấy tờ xe đã được duyệt chưa
const vehicle = safeVehicles.find(v => (v.vehicleId || v.id) === values.vehicleId);
if (vehicle && vehicle.status !== 'APPROVED') {
    setErrorAlert('Vehicle is not approved yet. Cannot book a slot.');
    return;
}
```

**5. Logic nghiệp vụ (Business logic):**
   - Lấy `userId` từ LocalStorage.
   - Chuyển đổi đối tượng thời gian của thư viện Ant Design sang định dạng chuỗi ISO chuẩn của Java (`YYYY-MM-DDTHH:mm:ss`).
   - Dọn dẹp và đóng gói object `payload`.
```javascript
const vTypeId = vehicle ? (vehicle.vehicleType?.vehicleTypeId || vehicle.vehicleTypeId || vehicle.vehicleType?.id) : null;

// Lấy userId hiện tại đang đăng nhập từ LocalStorage
const authStr = localStorage.getItem('parking_auth');
let userId = null;
if (authStr) {
    try {
        const parsedUser = JSON.parse(authStr);
        userId = parsedUser.userId || parsedUser.id;
    } catch (e) { }
}

// Gom payload chuẩn bị gửi API
const payload = {
    ...values,
    slotId: values.slotId || null,
    vehicleTypeId: vTypeId,
    userId: userId,
    // Chuyển đổi định dạng giờ sang chuỗi chuẩn ISO cho Java Spring Boot
    reservationStart: values.startTime.format('YYYY-MM-DDTHH:mm:ss'),
    reservationEnd: values.endTime.format('YYYY-MM-DDTHH:mm:ss'),
};

// Dọn dẹp 2 trường gốc để API không bị lỗi mapping
delete payload.startTime;
delete payload.endTime;
```

**6. Truy vấn CSDL (Database queries):** Không có (Xử lý ở phía Client).

**7. Dữ liệu trả về:** Một object payload JSON đã được format chuẩn bị gửi cho backend.

**8. Hàm tiếp theo được gọi:** Sử dụng Axios (`api.post('/reservations', data)`) để gửi một HTTP POST request đến Controller của backend.
```javascript
// File: ReservationPage.jsx
await driverService.createReservation(payload);

// ---
// File: driverApi.js
export const driverApi = {
    createReservation: async (data) => {
        const response = await api.post('/reservations', data);
        return response.data;
    },
};
```

**9. Xử lý ngoại lệ (Exception handling):** Nếu gọi API thất bại, khối catch sẽ đọc tin nhắn lỗi từ response của backend (ví dụ: "Slot already booked") và hiển thị nó trong một component `Alert` màu đỏ trên modal thông qua `setErrorAlert(errorMsg)`.
```javascript
} catch (error) {
    if (error.errorFields) return; // Nếu lỗi từ Form Validate thì kệ nó

    // Bắt lỗi từ Backend
    let errorMsg = 'Failed to create reservation';
    if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
        // ... format error message ...
    } else if (error.message) {
        errorMsg = error.message;
    }

    setErrorAlert(errorMsg); // Hiện cảnh báo đỏ
}
```

**10. Dữ liệu cuối cùng trả về frontend:** Sẽ được xử lý ở cuối luồng.

---

### Controller
↓
**1. Lớp/Hàm được gọi:** `com.parking.management.module.reservation.ReservationController.create()`
```java
// File: ReservationController.java
@PostMapping
public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
    // ...
}
```

**2. Lý do gọi:** DispatcherServlet của Spring Boot điều hướng HTTP request `POST /api/reservations` đến đúng endpoint này.
```java
@RestController
@RequestMapping("/api/reservations") // <-- Khớp với endpoint Axios gọi
public class ReservationController {
```

**3. Dữ liệu đầu vào (Input):** Đối tượng `@RequestBody ReservationRequest request` (chuỗi JSON từ frontend đã được deserialize thành Java object).

**4. Kiểm tra dữ liệu (Validation):**
   - Ép buộc kiểm tra bean validation thông qua `@Valid` (kiểm tra các trường bắt buộc không được null).
   - Kiểm tra Quyền truy cập (Role-Based Access Control) thông qua `@PreAuthorize`.
```java
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager', 'ParkingStaff', 'Driver')") // Phân quyền
// ...
public ApiResponse<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) { // @Valid check điều kiện
```

**5. Logic nghiệp vụ (Business logic):** Đóng vai trò hoàn toàn là điểm vào (entry point) / API gateway. Nó nhận request và ngay lập tức chuyển tiếp (delegate) xuống tầng dưới.

**6. Truy vấn CSDL (Database queries):** Không có trực tiếp tại tầng này.

**7. Dữ liệu trả về:** Truyền DTO (Data Transfer Object) xuống tầng Service.

**8. Hàm tiếp theo được gọi:** Gọi `com.parking.management.module.reservation.ReservationService.create(request)`.
```java
return ApiResponse.success("Created successfully", reservationService.create(request));
```

**9. Xử lý ngoại lệ (Exception handling):** Nếu `@Valid` hoặc `@PreAuthorize` thất bại, Global Exception Handler của Spring sẽ can thiệp và tự động trả về lỗi 400 Bad Request hoặc 403 Forbidden.

**10. Dữ liệu cuối cùng trả về frontend:** Sẽ được xử lý ở cuối luồng.

---

### Service
↓
**1. Lớp/Hàm được gọi:** `com.parking.management.module.reservation.ReservationService.create()`
```java
// File: ReservationService.java
public ReservationResponse create(ReservationRequest request) {
```

**2. Lý do gọi:** Để thực thi các quy tắc nghiệp vụ cốt lõi và kiểm tra hợp lệ trước khi cho phép tạo một đặt chỗ.

**3. Dữ liệu đầu vào (Input):** DTO `ReservationRequest request`.

**4. Kiểm tra dữ liệu (Validation):**
   - `validateTime(request)`: Đảm bảo thời gian kết thúc sau thời gian bắt đầu.
   - `securityUtils.checkDataOwnership(request.getUserId())`: Ngăn chặn người dùng làm giả request cho một người dùng khác.
   - Kiểm tra xem trạng thái của `Vehicle` lấy từ DB có phải là `APPROVED` không.
   - Kiểm tra xem `VehicleType.getIsReservable()` có bằng `true` không (Theo quy tắc nghiệp vụ: **chỉ cho phép xe từ ô tô trở lên được đặt chỗ trước**, xe máy/xe đạp không được hỗ trợ).
   - Nếu có yêu cầu một slot (vị trí đỗ) cụ thể, kiểm tra `Slot.getStatus()` phải là `AVAILABLE` và `Slot.getVehicleType().getIsReservable()` phải là `true`.
   - Kiểm tra Double Booking (đặt trùng).
```java
validateTime(request);
securityUtils.checkDataOwnership(request.getUserId());

// ... query xe ...
if (!"APPROVED".equals(vehicle.getStatus())) {
    throw new IllegalArgumentException("Phương tiện chưa được duyệt (APPROVED), không thể đặt chỗ.");
}

// ... query loại xe ...
if (!vehicleType.getIsReservable()) {
    throw new IllegalArgumentException("Loại xe này không hỗ trợ đặt chỗ trước.");
}

// ... query slot ...
if (slot.getStatus() != SlotStatus.AVAILABLE) {
    throw new IllegalArgumentException("Ô đỗ này hiện không trống, vui lòng chọn ô khác.");
}
if (!slot.getVehicleType().getIsReservable()) {
    throw new IllegalArgumentException("Slot dành cho loại xe này không hỗ trợ đặt trước.");
}

// Kiểm tra Double Booking (Overlap)
List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
        slot.getSlotId(), request.getReservationStart(), request.getReservationEnd()
);
if (!overlaps.isEmpty()) {
    throw new IllegalArgumentException("Rất tiếc, ô đỗ này đã có người đặt trong khoảng thời gian bạn chọn.");
}
```

**5. Logic nghiệp vụ (Business logic):**
   - Xác định slot: Nếu `slotId` bị null (Chế độ đặt tự động), hệ thống sẽ tìm kiếm slot trống đầu tiên. Ngược lại, nó sử dụng slot được yêu cầu.
   - Khởi tạo một entity `Reservation` mới và thiết lập các liên kết.
   - Thiết lập trạng thái ban đầu là `PENDING`.
```java
ParkingSlot slot;
if (request.getSlotId() == null) {
    // Đặt nhanh: Tìm chỗ trống đầu tiên
    slot = parkingSlotRepository.findFirstAvailableSlot(request.getVehicleTypeId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chỗ trống phù hợp cho loại xe này."));
} else {
    // Chọn thủ công
    slot = parkingSlotRepository.findById(request.getSlotId())
            .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + request.getSlotId()));
}

Reservation reservation = new Reservation();
reservation.setUser(user);
reservation.setVehicle(vehicle);
reservation.setVehicleType(vehicleType);
reservation.setSlot(slot);
reservation.setReservationStart(request.getReservationStart());
reservation.setReservationEnd(request.getReservationEnd());
reservation.setGuestName(request.getGuestName());
reservation.setStatus("PENDING");
reservation.setCreatedAt(LocalDateTime.now());
// CHÚ Ý: Không cập nhật trạng thái của Slot thành RESERVED ở đây.
```

**6. Truy vấn CSDL (Database queries):** Gọi tầng Repository để thực hiện các truy vấn lấy User, Vehicle, VehicleType, Slot và Check Overlap.

**7. Dữ liệu trả về:** Một entity `Reservation` chưa được lưu, chuẩn bị để ghi vào DB.

**8. Hàm tiếp theo được gọi:** Gọi `reservationRepository.save(reservation)`.
```java
return mapToResponse(reservationRepository.save(reservation));
```

**9. Xử lý ngoại lệ (Exception handling):** Ném ra lỗi `IllegalArgumentException` thủ công (trong trường hợp trùng slot, xe chưa duyệt, v.v...) và `ResourceNotFoundException`.

**10. Dữ liệu cuối cùng trả về frontend:** Sẽ được xử lý ở cuối luồng.

---

### Repository & Database
↓
**1. Lớp/Hàm được gọi:**
   - `ReservationRepository.findOverlappingReservations()`
   - `ReservationRepository.save(reservation)`

**2. Lý do gọi:** Để thực thi các câu lệnh SQL tác động lên cơ sở dữ liệu quan hệ, nhằm lấy ra các phụ thuộc cần thiết và lưu bản ghi đặt chỗ mới.

**3. Dữ liệu đầu vào (Input):** Các ID (để tra cứu), Khoảng thời gian (để kiểm tra trùng lặp), và entity `Reservation` đã được điền đủ thông tin (để lưu).

**4. Kiểm tra dữ liệu (Validation):** Không có. Repository chỉ thực thi.

**5. Logic nghiệp vụ (Business logic):** Dịch các lời gọi hàm của Spring Data JPA / Hibernate thành các câu lệnh SQL thực tế. 

**6. Truy vấn CSDL (Database queries):**
   - Lệnh `SELECT` trên bảng `reservations` để kiểm tra trùng lặp thời gian.
```java
// File: ReservationRepository.java
@Query("SELECT r FROM Reservation r WHERE r.slot.slotId = :slotId AND r.status IN ('PENDING', 'CONFIRMED') AND r.reservationStart < :endTime AND r.reservationEnd > :startTime")
List<Reservation> findOverlappingReservations(
        @Param("slotId") Integer slotId,
        @Param("startTime") java.time.LocalDateTime startTime,
        @Param("endTime") java.time.LocalDateTime endTime
);
```

**7. Dữ liệu trả về:** Các JPA Entities ánh xạ với các dòng trong cơ sở dữ liệu.

**8. Hàm tiếp theo được gọi:** Trả quyền kiểm soát lại cho Service.

**9. Xử lý ngoại lệ (Exception handling):** Ném ra DataAccessExceptions nếu lỗi Database.

**10. Dữ liệu cuối cùng trả về frontend:** Sẽ được xử lý ở cuối luồng.

---

### Return to Service (Trở về Service)
↓
**1. Lớp/Hàm được gọi:** `com.parking.management.module.reservation.ReservationService.mapToResponse()`
```java
private ReservationResponse mapToResponse(Reservation reservation) {
```

**2. Lý do gọi:** Service cần ánh xạ (map) entity `Reservation` thô từ DB thành một Data Transfer Object (DTO) an toàn là `ReservationResponse`.

**3. Dữ liệu đầu vào (Input):** Entity `Reservation` vừa được lưu thành công.

**4. Kiểm tra dữ liệu (Validation):** Không có.

**5. Logic nghiệp vụ (Business logic):**
   - Map các thuộc tính từ entity sang DTO.
   - Gọi `pricingService.calculateFee()` để đính kèm "Phí dự kiến" (Estimated Fee).
   - Kiểm tra `paymentRepository` để đính kèm thông tin trạng thái thanh toán.
```java
ReservationResponse response = ReservationResponse.fromEntity(reservation);
try {
    FeeCalculationResponse feeRes = pricingService.calculateFee(
            Long.valueOf(reservation.getVehicleType().getVehicleTypeId()),
            reservation.getReservationStart(),
            reservation.getReservationEnd(),
            null,
            reservation.getVehicle() != null ? reservation.getVehicle().getVehicleId() : null
    );
    response.setEstimatedFee(feeRes.getFinalFee());
} catch (Exception e) {
    response.setEstimatedFee(null); // Nếu lỗi tính giá thì nuốt lỗi
}

paymentRepository.findFirstByReservation_ReservationIdOrderByPaymentIdDesc(reservation.getReservationId())
        .ifPresent(p -> {
            response.setPaymentStatus(p.getPaymentStatus());
            response.setPaymentId(p.getPaymentId());
            response.setAmount(p.getAmount());
        });

return response;
```

**6. Truy vấn CSDL (Database queries):** Lệnh `SELECT` từ bảng `payments` với điều kiện `reservation_id = ?`.

**7. Dữ liệu trả về:** Đối tượng `ReservationResponse` đã được điền đủ dữ liệu.

**8. Hàm tiếp theo được gọi:** Trả kết quả ngược lên trên stack cho Controller.

**9. Xử lý ngoại lệ (Exception handling):** Dùng `try-catch` bao quanh logic tính phí.

**10. Dữ liệu cuối cùng trả về frontend:** Sẽ được xử lý ở cuối luồng.

---

### Return to Controller & Response to Frontend
↓
**1. Lớp/Hàm được gọi:** `ReservationController.create()` & `ReservationPage.jsx` → `handleModalOk()`

**2. Lý do gọi:** Để định dạng cấu trúc HTTP response cuối cùng và trả về giao diện.

**3. Dữ liệu đầu vào (Input):** `ReservationResponse` DTO từ Service truyền lên.

**4. Kiểm tra dữ liệu (Validation):** Không có.

**5. Logic nghiệp vụ (Business logic):** 
   - **Backend:** Bọc DTO vào trong một cấu trúc chuẩn `ApiResponse.success()`.
```java
// Controller
return ApiResponse.success("Created successfully", reservationService.create(request));
// { "success": true, "message": "Created successfully", "data": { ... } }
```
   - **Frontend:** Kích hoạt thông báo thành công và đóng Modal.
```javascript
// File: ReservationPage.jsx
await driverService.createReservation(payload);
message.success('Reservation created successfully');
setIsModalVisible(false); // Thành công thì đóng popup
fetchData(); // Tải lại bảng Đặt chỗ để hiện vé mới lên đầu tiên
```

**6. Truy vấn CSDL (Database queries):** Không có.

**7. Dữ liệu trả về:** JSON response tới frontend, sau đó frontend cập nhật UI State.

**8. Hàm tiếp theo được gọi:** Frontend gọi `fetchData()` để lấy lại toàn bộ danh sách đặt chỗ của người dùng.
```javascript
// Gọi lại API để load lại danh sách đặt chỗ (có bao gồm vé mới)
const fetchData = async () => { ... } 
```

**9. Xử lý ngoại lệ (Exception handling):** Không áp dụng (đây là nhánh thành công).

**10. Dữ liệu cuối cùng trả về frontend:** Người dùng thấy modal đặt chỗ biến mất và vé đặt chỗ mới của họ xuất hiện trên bảng với nhãn "PENDING" (Đang chờ).

---

### 📋 Tóm tắt theo trình tự thời gian (Chronological Summary)

1. **Tương tác người dùng:** Người dùng có thể khởi tạo đặt chỗ bằng 2 cách: tự tạo form (tìm chỗ tự động) hoặc nhấn nút "Book" trên thẻ slot (chọn chỗ thủ công). Sau khi điền đủ thông tin, người dùng nhấn "Confirm Booking".
2. **Xử lý frontend:** React component kiểm tra tính hợp lệ của thời gian, đóng gói payload, và gửi một Axios POST request đến `/api/reservations`.
3. **Điều hướng Controller:** `ReservationController.create()` tiếp nhận HTTP request, xác thực quyền hạn người dùng, kiểm tra body JSON, và chuyển giao xuống tầng Service.
4. **Service kiểm tra:** `ReservationService.create()` kiểm tra gắt gao các quy tắc nghiệp vụ: xác minh chính chủ, kiểm tra xe đã duyệt chưa, loại slot có cho phép đặt trước không, và truy vấn DB để đảm bảo không bị đặt trùng giờ (overlap).
5. **Tạo Entity:** Nếu tất cả bài kiểm tra đều vượt qua, Service khởi tạo một entity `Reservation` mới với trạng thái `PENDING`.
6. **Lưu trữ Database:** `ReservationRepository.save()` dịch entity này thành lệnh SQL `INSERT` và ghi vào database, nhận lại một ID tự động tăng mới sinh ra.
7. **Ánh xạ Response:** Service chuyển đổi entity vừa lưu thành một DTO `ReservationResponse`, đồng thời tự động tính toán phí đỗ xe dự kiến thông qua `PricingService`.
8. **Định dạng Controller:** Controller bọc DTO vào một chuẩn `ApiResponse` và Spring serialize nó ra định dạng JSON.
9. **Cập nhật UI:** Frontend nhận HTTP response `200 OK`, hiển thị thông báo thành công, đóng modal, và tự động gọi lại API lấy danh sách để người dùng nhìn thấy ngay vé đặt chỗ mới của mình.
