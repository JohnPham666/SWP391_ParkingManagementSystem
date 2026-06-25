# Hướng dẫn chuyển đổi giao diện JS thuần sang React (Dành cho Team)

Tài liệu này giúp các thành viên trong nhóm biết cách làm việc và sử dụng AI (Prompt) để tự động hóa việc chuyển đổi các trang giao diện (UI) được phân công từ JS thuần sang React.

## 1. Cấu trúc hiện tại cần nắm
- **Code cũ (Thuần JS)**: Nằm ở `src/main/resources/static/manager/js/pages/` hoặc `staff/js/pages/`.
- **Code mới (React)**: Nằm ở `frontend-react/src/pages/admin/`.
- **API Flow**: Thư mục `frontend-react/src/services/api.js` đã được cài đặt sẵn Axios. Các API call phải được khai báo tại đây.
- **UI Library**: Toàn bộ dự án React sử dụng **Ant Design (antd)** làm chuẩn (Table, Form, Modal, Button...).

## 2. Quy trình làm việc của mỗi thành viên
1. **Kiểm tra phân công**: Nhận tên trang (Ví dụ: `users.js`, `slots.js`).
2. **Cập nhật API (nếu cần)**: Thêm các endpoint tương ứng vào `frontend-react/src/services/api.js`.
3. **Sử dụng Prompt (bên dưới) gửi cho AI** để AI tự động gen ra code React cho file `.jsx`.
4. **Gắn Component vào Layout**: Import file `.jsx` vừa tạo vào `frontend-react/src/App.jsx` và thêm Route tương ứng.
5. **Test**: Chạy `npm run dev` để kiểm tra chức năng.

---

## 3. Mẫu Prompt chuẩn để giao việc cho AI

Các thành viên hãy copy mẫu Prompt dưới đây, điền thông tin vào chỗ trống `[...]` và gửi cho AI (như ChatGPT, Gemini, hoặc trực tiếp trong hệ thống này):

### Mẫu Prompt cơ bản:
> "Chào AI, tôi được phân công chuyển đổi chức năng **[Tên chức năng, ví dụ: Quản lý chỗ đỗ xe / Slots]** của dự án từ JS thuần sang React.
> 
> **Đầu vào tham khảo:**
> - File logic cũ: `src/main/resources/static/manager/js/pages/[Tên file cũ.js]`
> 
> **Yêu cầu đối với code React mới:**
> 1. Viết Component mới nằm ở `frontend-react/src/pages/admin/[Tên file mới.jsx]`.
> 2. Sử dụng thư viện **Ant Design** (Table, Modal, Form, Button, Tag, Space).
> 3. Các API call phải được định nghĩa thông qua file `api.js` đã có sẵn.
> 4. Copy 100% các tính năng nghiệp vụ từ file cũ (Ví dụ: Thêm, Sửa, Xóa, Lọc dữ liệu, Phân trang). Không được bỏ sót bất kỳ tính năng nào.
> 5. Quản lý state bằng `useState`, `useEffect` và form của Ant Design.
> 
> Hãy đọc hiểu file JS cũ và viết cho tôi toàn bộ code hoàn chỉnh của file `.jsx` này."

### Mẫu Prompt nâng cao (Dành cho trang có phân quyền Admin/Staff):
> "Trang **[Tên chức năng]** này được dùng chung cho cả Admin và Staff. 
> Hãy viết code React sử dụng Ant Design. Lưu ý:
> - Đọc role từ `JSON.parse(localStorage.getItem('parking_auth'))`.
> - Nếu là **ParkingStaff**: Ẩn các cột doanh thu, ẩn nút Xóa/Sửa quan trọng.
> - Nếu là **Admin**: Hiển thị đầy đủ chức năng.
> Hãy tham chiếu logic cũ ở cả 2 file `manager/js/pages/...` và `staff/js/pages/...` để tổng hợp tính năng vào một file `.jsx` duy nhất."

---

## 4. Những lỗi (Gotchas) thường gặp cần dặn dò team
- **Sai format payload API**: Spring Boot Backend của chúng ta rất khắt khe. Ví dụ `vehicleTypeId` là số nguyên (Integer), nếu React gửi dạng chuỗi (String) backend sẽ báo lỗi. Hãy nhắc AI map đúng kiểu dữ liệu.
- **Upload Ảnh (Multipart/form-data)**: Phải sử dụng Upload component của Ant Design với thuộc tính `beforeUpload={() => false}` và lấy file qua `originFileObj` để đẩy xuống API.
- **Quên thông báo lỗi**: Yêu cầu AI bọc các khối `try...catch` khi gọi API và sử dụng `message.success()` hoặc `message.error()` của Ant Design để báo cho người dùng.
