# Hướng Dẫn Kỹ Thuật: Chức Năng Đề Xuất Chỗ Đỗ Xe (Recommendation)

Tài liệu này giải thích chi tiết về luồng hoạt động và thuật toán của tính năng **"Đề xuất chỗ đỗ xe thông minh" (Recommendation)** trên trang Sơ đồ bãi đỗ (`ParkingPage.jsx`).

---

## 1. Giới thiệu chức năng
Trên giao diện bản đồ bãi đỗ, trong số hàng chục hoặc hàng trăm ô đỗ xe đang trống, hệ thống sẽ tự động tìm ra vị trí trống được coi là **"đẹp nhất/gần nhất"** để gắn nhãn (badge) `RECOMMENDED` và làm nổi bật (glowing border) thẻ Slot đó lên.
Mục đích là giúp người dùng (Driver) có thể bấm đặt chỗ (Book) ngay lập tức mà không cần tốn thời gian lướt tìm vị trí.

---

## 2. Vị trí mã nguồn
Toàn bộ logic tính toán được xử lý ở phía Frontend (React), nằm bên trong hàm `useMemo()` của biến `filteredSlots` tại file `ParkingPage.jsx` (Dòng 185 - 209).

---

## 3. Thuật toán hoạt động (3 Bước)

Hệ thống chạy qua hàm `sortAndRecommendSlots(slotsToProcess)` với các bước sau:

### Bước 1: Reset cờ (Flag)
Đầu tiên, hệ thống duyệt qua toàn bộ danh sách các slot đang hiển thị trên màn hình và đặt cờ `isRecommended = false` cho tất cả. Đảm bảo mỗi lần render lại chỉ có tối đa 1 slot được đề xuất.

### Bước 2: Lọc các ô đủ điều kiện (Filter)
Hệ thống sử dụng hàm `canReserveSlot(slot)` để giữ lại những ô đỗ "tiềm năng" nhất:
```javascript
const canReserveSlot = (slot) => {
    const vType = String(slot.vehicleTypeName || '').toLowerCase();
    // Điều kiện: Phải ĐANG TRỐNG và KHÔNG PHẢI LÀ XE MÁY
    return slot && slot.status === 'AVAILABLE' && !vType.includes('motor') && !vType.includes('xe máy');
};
```
*Ghi chú nghiệp vụ:* Hệ thống sẽ tự động bỏ qua toàn bộ các slot dành cho xe máy (vì xe máy dắt vào đỗ tự do, không hỗ trợ đặt chỗ trước). Đồng thời, bỏ qua các ô đang bận (`OCCUPIED`, `RESERVED`, `MAINTENANCE`).

### Bước 3: Thuật toán sắp xếp tìm ô "Đẹp Nhất" (Sorting)
Với danh sách các ô đỗ hợp lệ thu được ở Bước 2, hệ thống dùng hàm `.sort()` của JavaScript để xếp hạng vị trí dựa theo 3 tiêu chí ưu tiên từ cao xuống thấp:

1. **Ưu tiên 1 - Tên Tầng (`floorName`):**
   ```javascript
   const floorA = a.floorName || '';
   const floorB = b.floorName || '';
   if (floorA !== floorB) return floorA.localeCompare(floorB);
   ```
   So sánh chuỗi theo bảng chữ cái. Ví dụ: Tầng `B1` sẽ xếp trước `B2`, tầng `L1` xếp trước `L2`. Chỗ nào ở tầng thấp hơn (gần lối vào hơn) sẽ được ưu tiên đưa lên đầu.

2. **Ưu tiên 2 - Tên Khu vực (`zoneName`):**
   Nếu 2 ô đỗ ở **cùng 1 tầng**, hệ thống xét tiếp đến khu vực.
   ```javascript
   const zoneA = a.zoneName || '';
   const zoneB = b.zoneName || '';
   if (zoneA !== zoneB) return zoneA.localeCompare(zoneB);
   ```
   Ví dụ: Khu `Zone A` sẽ được xếp hạng cao hơn `Zone B`.

3. **Ưu tiên 3 - Mã Slot (`slotCode`):**
   Nếu 2 ô đỗ ở **cùng tầng và cùng khu vực**, hệ thống xét đến mã số ô.
   ```javascript
   const codeA = a.slotCode || '';
   const codeB = b.slotCode || '';
   // Sắp xếp alpha-numeric: A1, A2, A10...
   return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
   ```
   Dùng thuật toán `numeric: true` để đảm bảo chuỗi ký tự chứa số được sắp xếp theo giá trị toán học thực sự (ví dụ: `A2` sẽ đứng trước `A10`. Nếu không có `numeric: true`, chuỗi `A10` có thể bị xếp nhầm đứng trước `A2`).

### Bước 4: Gắn cờ cho ô chiến thắng
Sau khi sắp xếp xong, phần tử đứng ở **vị trí số 0** (`sorted[0]`) chính là vị trí đẹp nhất.
Hệ thống dùng ID của nó dò lại mảng ban đầu và gắn cờ `isRecommended = true`.

```javascript
const bestSlotId = sorted[0].slotId;
const bestSlot = slotsToProcess.find(s => s.slotId === bestSlotId);
if (bestSlot) bestSlot.isRecommended = true; // Gắn cờ
```

---

## 4. Tác động lên Giao Diện (UI Rendering)

Khi mảng slot có 1 phần tử mang thẻ `isRecommended = true` được render ra ngoài giao diện, React sẽ áp dụng Dynamic Styling cho riêng thẻ đó (dòng 359 - `ParkingPage.jsx`):

1. **Vẽ viền nổi bật (Highlight Border):**
```javascript
... (slot.isRecommended ? { 
    border: `2px solid ${token.colorPrimary}`, // Viền dày và có màu chính của Theme (Xanh dương)
    boxShadow: `0 4px 16px ${token.colorPrimary}40` // Hiệu ứng tỏa sáng
} : { ... })
```

2. **Gắn Badge Góc Phải:**
```javascript
{slot.isRecommended && (
    <div style={{ position: 'absolute', top: 0, right: 0, background: token.colorPrimary, color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 16px', borderBottomLeftRadius: 16, zIndex: 2 }}>
        RECOMMENDED
    </div>
)}
```
Sự thay đổi này khiến ô đỗ xe trở nên rất bắt mắt, thu hút ánh nhìn của tài xế ngay lập tức, qua đó tăng mạnh tốc độ thao tác đặt chỗ (UX).
