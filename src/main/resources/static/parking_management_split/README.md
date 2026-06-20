# Parking Management System - Split files

Cấu trúc đã tách:

```
parking_management_split/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── tailwind-config.js
    ├── app.js
    └── embed-helper.js
```

Cách chạy nhanh:
- Mở `index.html` bằng trình duyệt.
- Nếu project của bạn dùng Spring Boot, đặt `index.html` trong `src/main/resources/static/` và giữ nguyên thư mục `css`, `js` nằm cùng cấp với `index.html`.

Ghi chú:
- `style.css`: chứa CSS riêng.
- `tailwind-config.js`: chứa cấu hình Tailwind.
- `app.js`: chứa toàn bộ logic check-in, check-out, slot, card, gate, thống kê, tìm kiếm.
- `embed-helper.js`: đoạn script phụ ở cuối file gốc.
