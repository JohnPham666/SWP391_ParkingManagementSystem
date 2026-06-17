export const customerName = "Nguyễn Văn A";

export const routes = {
  home: { pageId: "home-page", title: null },
  booking: { pageId: "booking-page", title: "Đặt chỗ gửi xe" },
  services: { pageId: "services-page", title: "Các dịch vụ của chúng tôi" },
  "add-vehicle": { pageId: "add-vehicle-page", title: "Đăng ký thông tin xe" },
  profile: { pageId: "profile-page", title: "Hồ sơ cá nhân" },
  vehicles: { pageId: "vehicles-page", title: "Thông tin xe của tôi" },
  settings: { pageId: "settings-page", title: "Cài đặt" },
  wallet: { pageId: "wallet-page", title: "Ví tiền của tôi" },
  parking: { pageId: "parking-page", title: "Các bãi gửi xe" },
};

export const parkingLots = [
  { name: "Bãi Gửi Xe Trung Tâm", address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM", capacity: 500, hours: "24/7 - Mở cửa thường xuyên" },
  { name: "Bãi Gửi Xe Tây Thạnh", address: "456 Đường Kinh Dương Vương, Quận 6, TP.HCM", capacity: 350, hours: "6:00 - 22:00" },
  { name: "Bãi Gửi Xe Quận 7", address: "789 Đường Cao Lỗ, Quận 7, TP.HCM", capacity: 400, hours: "5:30 - 23:00" },
  { name: "Bãi Gửi Xe Bình Tân", address: "321 Đường Lê Văn Quới, Quận Bình Tân, TP.HCM", capacity: 300, hours: "24/7 - Mở cửa thường xuyên" },
];

export const vehicles = [
  { plate: "51F - 123.45", type: "Xe ô tô 4 chỗ", brand: "Toyota", model: "Vios 2023", color: "Trắng", status: "Đã xác nhận", tone: "from-blue-400 to-blue-500" },
  { plate: "51G - 234.56", type: "Xe ô tô 5 chỗ", brand: "Honda", model: "City 2022", color: "Đỏ", status: "Đã xác nhận", tone: "from-red-400 to-red-500" },
  { plate: "51H - 345.67", type: "Xe bán tải", brand: "Ford", model: "Ranger 2021", color: "Xám", status: "Chờ xác nhận", tone: "from-gray-400 to-gray-500" },
];

export const services = [
  {
    icon: "calendar-days",
    title: "Gửi xe hàng ngày",
    description: "Dịch vụ gửi xe linh hoạt theo ngày với giá cước cạnh tranh",
    features: ["Mở cửa 24/7", "Tính tiền theo giờ hoặc ngày", "Bảo hiểm tự động"],
    priceLabel: "Giá khởi điểm:",
    price: "50.000đ",
    note: "/ngày (tùy kích thước xe)",
    color: "blue",
  },
  {
    icon: "ticket",
    title: "Đăng ký vé tháng",
    description: "Gửi xe không giới hạn trong 1 tháng với mức giá cố định",
    features: ["Gửi xe không giới hạn", "Giá ưu đãi so với hàng ngày", "Ưu tiên bãi đậu tốt"],
    priceLabel: "Giá tháng:",
    price: "1.200.000đ",
    note: "/tháng - tiết kiệm đến 40%",
    color: "green",
  },
  {
    icon: "calendar-check",
    title: "Đặt chỗ trước",
    description: "Đặt trước chỗ gửi xe và chỉ thanh toán khi sử dụng",
    features: ["Đặt chỗ với chi phí cực thấp", "Chọn vị trí yêu thích", "Hủy miễn phí 2 tiếng trước"],
    priceLabel: "Giá đặt chỗ:",
    price: "10.000đ",
    note: "/lần (không bao gồm phí gửi)",
    color: "purple",
  },
];

export const parkingSlots = {
  center: [
    { spot: "A1", level: "1", price: 50000 },
    { spot: "A2", level: "1", price: 50000 },
    { spot: "A5", level: "2", price: 50000 },
    { spot: "B1", level: "2", price: 50000 },
  ],
  west: [
    { spot: "C1", level: "1", price: 40000 },
    { spot: "C4", level: "1", price: 40000 },
    { spot: "D2", level: "2", price: 40000 },
  ],
  district7: [
    { spot: "E1", level: "1", price: 45000 },
    { spot: "E6", level: "1", price: 45000 },
    { spot: "F2", level: "2", price: 45000 },
    { spot: "G1", level: "3", price: 45000 },
  ],
  binhtan: [
    { spot: "H1", level: "1", price: 35000 },
    { spot: "H3", level: "1", price: 35000 },
    { spot: "H5", level: "1", price: 35000 },
  ],
};

export const profileSections = [
  {
    icon: "user",
    title: "Thông tin cơ bản",
    items: [
      ["Họ và tên", "Nguyễn Văn A"],
      ["Mã khách hàng", "KH-2024-00123"],
      ["Ngày sinh", "15/03/1990"],
      ["Giới tính", "Nam"],
    ],
  },
  {
    icon: "phone",
    title: "Thông tin liên hệ",
    items: [
      ["Số điện thoại", "0912 345 678"],
      ["Email", "nguyenvana@email.com"],
      ["Địa chỉ", "123 Đường Nguyễn Huệ, Quận 1, TP.HCM"],
      ["Người liên hệ khẩn cấp", "Trần Thị B - 0912 987 654"],
    ],
  },
  {
    icon: "lock",
    title: "Thông tin tài khoản",
    items: [
      ["Tên đăng nhập", "nguyenvana"],
      ["Mật khẩu", "••••••••••••"],
      ["Ngày tạo tài khoản", "20/01/2023"],
      ["Trạng thái tài khoản", "Đang hoạt động - VIP"],
    ],
  },
];

export const notifications = [
  ["Nhận email thông báo", "Nhận cập nhật qua email", true],
  ["Nhận SMS thông báo", "Nhận cập nhật qua tin nhắn SMS", false],
  ["Thông báo vé sắp hết hạn", "Thông báo khi vé gửi xe sắp hết hạn", true],
  ["Thông báo thanh toán", "Thông báo khi thanh toán thành công", true],
  ["Thông báo đặt chỗ", "Thông báo xác nhận và nhắc nhở đặt chỗ", true],
];
