# Giải thích mã nguồn (Code Explanation)

Dưới đây là phần giải thích chi tiết được chèn trực tiếp dưới dạng các dòng chú thích (comment `//`) vào ngay bên trong các đoạn code bạn đã gửi để bạn tiện theo dõi song song:

## 1. Phần Import và Khởi tạo UI
```javascript
// Import các thư viện lõi của React để quản lý state và vòng đời (lifecycle) của component
import React, { useEffect, useReducer, useState } from 'react';

// Import hàng loạt các UI component và Icon từ thư viện Ant Design để xây dựng giao diện đẹp mắt
import { Card, Table, Modal, Form, DatePicker, Select, Button, Tag, Space, Popconfirm, Alert, message, Row, Col, Typography, Skeleton, Empty, theme, Descriptions } from 'antd';
import { CalendarOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, AlertOutlined, InfoCircleOutlined } from '@ant-design/icons';

// Import các hook từ React Router để điều hướng, chuyển trang và lấy thông tin URL
import { useLocation, useNavigate } from 'react-router-dom';

// Import thư viện dayjs hỗ trợ xử lý và định dạng thời gian
import dayjs from 'dayjs';

// Import các API service để gọi dữ liệu mạng và các store quản lý state toàn cục (global state)
import { driverService } from '../services/driverService';
import { reservationStore } from '../store/reservationStore';
import { vehicleStore } from '../store/vehicleStore';
import { parkingStore } from '../store/parkingStore';
import { subscriptionApi } from '../../../services/api';

// Trích xuất sẵn các component tiêu đề (Title) và chữ thường (Text) từ module Typography của Antd để gọi cho gọn
const { Title, Text } = Typography;
```

## 2. Các hàm tiện ích (Utility functions) xử lý Đặt chỗ
```javascript
// Hàm lấy ID của đơn đặt chỗ an toàn: Ưu tiên lấy 'reservationId', nếu không có thì lấy 'id' để tránh lỗi
const getReservationId = (reservation) => reservation?.reservationId || reservation?.id;

// Hàm kiểm tra xem đơn đặt chỗ đã hết hạn 15 phút hay chưa
const isReservationExpired = (reservation) => {
    // 1. Nếu trạng thái không phải là 'PENDING' (đang chờ), thì không áp dụng luật hết hạn (trả về false)
    if (String(reservation?.status || '').toUpperCase() !== 'PENDING') return false;
    
    // 2. Nếu không có dữ liệu thời gian tạo đơn, không xác định được nên không cho hết hạn
    if (!reservation?.createdAt) return false;
    
    // Lấy thời gian tạo (quy ra millisecond)
    const createdTime = new Date(reservation.createdAt).getTime();
    
    // Cộng thêm 15 phút (15 phút * 60 giây * 1000 ms) để tính ra thời điểm hết hạn
    const expireTime = createdTime + 15 * 60 * 1000;
    
    // Nếu thời gian ở thế giới thực lớn hơn thời điểm hết hạn => Đơn đã quá hạn (trả về true)
    return new Date().getTime() > expireTime;
};

// Hàm lấy trạng thái thanh toán một cách an toàn (chống lỗi null/undefined)
const getPaymentStatus = (reservation) => {
    // Tìm trạng thái ưu tiên ở 3 biến khác nhau, nếu không có mặc định gán là 'UNPAID', sau đó in hoa toàn bộ
    return String(reservation?.paymentStatus || reservation?.payment?.status || reservation?.payment?.paymentStatus || 'UNPAID').toUpperCase();
};

// Hàm kiểm tra quyền thanh toán (người dùng có được phép bấm nút thanh toán đơn này không)
const canPayReservation = (reservation) => {
    // Điều kiện 1: Đơn đặt chỗ phải CHƯA hết hạn (nếu hết hạn thì lập tức trả về false)
    if (isReservationExpired(reservation)) return false;
    
    const reservationStatus = String(reservation?.status || '').toUpperCase();
    const paymentStatus = getPaymentStatus(reservation);
    
    // Điều kiện 2 & 3: Đơn phải đang ở trạng thái PENDING hoặc PENDING_PAYMENT, 
    // và chưa thanh toán xong (UNPAID, PENDING, hoặc FAILED)
    return ['PENDING', 'PENDING_PAYMENT'].includes(reservationStatus) && ['UNPAID', 'PENDING', 'FAILED'].includes(paymentStatus);
};

// Hàm tiện ích trích xuất nhanh dữ liệu từ response của API (nếu dùng axios thì ruột thường nằm trong response.data)
const getResponseData = (response) => response?.data || response;
```

## 3. Component `CountdownTimer` (Đồng hồ đếm ngược 15 phút)
```javascript
// Component hiển thị đồng hồ đếm ngược, nhận vào mốc bắt đầu đếm (createdAt) và hàm thông báo khi hết giờ (onExpire)
const CountdownTimer = ({ createdAt, onExpire }) => {
    // State lưu chuỗi thời gian hiển thị trên màn hình (định dạng 'phút:giây')
    const [timeLeft, setTimeLeft] = useState('');
    
    // Logic chạy ngầm quản lý thời gian
    useEffect(() => {
        let hasExpired = false; // Cờ hiệu đánh dấu đã hết hạn
        
        // Hàm tính toán logic thời gian chênh lệch
        const calculateTimeLeft = () => {
            if (!createdAt) return null; // Nếu chưa có thời gian tạo thì bỏ qua
            
            // Tính thời điểm hết hạn (thời gian tạo + 15 phút)
            const createdTime = new Date(createdAt).getTime();
            const expireTime = createdTime + 15 * 60 * 1000;
            const now = new Date().getTime(); // Thời gian hiện tại
            
            const diff = expireTime - now; // Khoảng chênh lệch (còn lại bao lâu)
            
            // Nếu chênh lệch <= 0 tức là đã qua 15 phút
            if (diff <= 0) {
                return '00:00';
            }
            
            // Đổi số ms ra phút (m) và giây (s)
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            
            // Gắn số 0 đằng trước nếu chỉ có 1 chữ số (vd: 5 thành 05) để format luôn chuẩn XX:XX
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };
        
        // Vừa vào trang là tính toán ngay giá trị ban đầu để màn hình không bị chớp
        const initialTl = calculateTimeLeft();
        setTimeLeft(initialTl); // Gán lên giao diện
        
        // Nếu lần đầu tính đã là 00:00 (hết hạn từ trước), gọi báo onExpire ngay.
        // Dùng setTimeout để tránh lỗi đụng độ render vòng lặp của React
        if (initialTl === '00:00') {
             hasExpired = true;
             if (onExpire) setTimeout(onExpire, 0);
        }

        // Tạo bộ đếm lặp (timer): Cứ 1 giây (1000ms) tính lại 1 lần
        const timer = setInterval(() => {
            if (hasExpired) {
                 clearInterval(timer); // Nếu đã qua ngày thì dừng vòng lặp ngay
                 return;
            }
            
            const tl = calculateTimeLeft();
            setTimeLeft(tl); // Tính xong thì nhồi lại vào state để UI thay đổi
            
            // Nếu đếm lùi về tới 00:00 thì tự động dừng lặp và gọi báo đã hết hạn
            if (tl === '00:00') {
                clearInterval(timer); // Dừng lặp
                hasExpired = true;    // Gắn cờ
                if (onExpire) onExpire(); // Bắn sự kiện ra component cha
            }
        }, 1000);
        
        // Cleanup function (quan trọng): Tự động xóa bộ timer khi tắt component này đi
        // giúp bộ nhớ RAM không bị rò rỉ (memory leak) vì timer chạy ngầm
        return () => clearInterval(timer);
    }, [createdAt, onExpire]); // useEffect sẽ chạy lại từ đầu nếu 2 biến này bị đổi
    
    // Render UI: Ẩn hẳn component (trả về null) nếu chưa có dữ liệu thời gian hoặc đã hết hạn
    if (!timeLeft || timeLeft === '00:00') return null;
    
    // Nếu vẫn đang đếm: Hiển thị chữ màu đỏ báo động (type="danger") và in đậm
    return <Text type="danger" style={{ fontSize: 13, fontWeight: 'bold' }}>{timeLeft}</Text>;
};
```
---
## 4. Hook và Hàm Polling (Kiểm tra trạng thái thanh toán liên tục)
```javascript
    // Hook (useEffect) chạy ngầm để thiết lập một bộ đếm (polling).
    // Mục đích: Liên tục gọi API kiểm tra xem người dùng đã thanh toán VNPay xong chưa, lặp lại mỗi 3 giây.
    // Điều kiện chạy: Chỉ chạy khi cửa sổ chờ thanh toán đang bật (paymentModalVisible = true) 
    // và có mã đơn đang thanh toán (payingReservationId).
    useEffect(() => {
        let interval; // Biến lưu trữ tham chiếu đến bộ đếm thời gian
        
        // Nếu người dùng đang mở bảng chờ thanh toán
        if (paymentModalVisible && payingReservationId) {
            // Thiết lập bộ lặp setInterval
            interval = setInterval(() => {
                pollPaymentStatus(); // Gọi hàm lấy dữ liệu mới nhất bên dưới
            }, 3000); // 3000ms = 3 giây
        }
        
        // Hàm Cleanup (Dọn dẹp): Tự động chạy khi Component bị hủy, hoặc khi state điều kiện thay đổi (VD: tắt modal)
        return () => {
            // Dừng vòng lặp để tránh việc tiếp tục gọi API làm nặng server khi người dùng đã đóng modal
            if (interval) clearInterval(interval);
        };
    }, [paymentModalVisible, payingReservationId]); // Lắng nghe sự thay đổi của 2 biến này để bật/tắt polling

    // Hàm gọi API thực hiện thao tác cập nhật danh sách đặt chỗ ngầm (Background Task)
    const pollPaymentStatus = async () => {
        try {
            // Yêu cầu server trả về danh sách đặt chỗ mới nhất của người dùng
            const reservationsRes = await driverService.loadReservations();
            
            // Trích xuất dữ liệu, phòng hờ trường hợp dữ liệu bọc trong trường '.data' của Axios
            const rRes = reservationsRes?.data || reservationsRes;
            
            // Nếu dữ liệu trả về hợp lệ (là một mảng)
            if (Array.isArray(rRes)) {
                // Cập nhật lại kho lưu trữ (store) cục bộ bằng dữ liệu mới nhất (có thể chứa trạng thái PAID mới)
                reservationStore.reservations = rRes;
                
                // Gọi hàm forceRender (một thủ thuật update state giả) để ép giao diện React vẽ lại
                // nhằm phản ánh trạng thái "Đã thanh toán" (PAID) lên UI ngay lập tức
                forceRender();
            }
        } catch (error) {
            // Ignore polling errors: Nếu bị lỗi gọi API (vd: rớt mạng chớp nhoáng), ta âm thầm bỏ qua
            // Không quăng lỗi (throw error) hay hiện thông báo đỏ (alert) làm gián đoạn trải nghiệm vì nó sẽ tự thử lại sau 3s
        }
    };
```
---
## 5. Hook Xử lý Kết quả Thanh toán (Thành công / Thất bại)
Đoạn code này phối hợp chặt chẽ với hàm Polling ở phần 4. Sau khi hàm Polling gọi API và cập nhật lại mảng `reservationStore.reservations` ngầm bên dưới, đoạn code này sẽ "đánh hơi" thấy sự thay đổi đó và chạy để kiểm tra xem đơn hàng đã được thanh toán thành công hay chưa.

```javascript
    // Khởi tạo một Hook useEffect. Nó sẽ tự động chạy lại MỖI KHI 1 trong 4 biến ở mảng cuối cùng (dòng 162) bị thay đổi giá trị.
    useEffect(() => {
        
        // DÒNG 146: Kiểm tra 2 điều kiện bắt buộc: Cửa sổ thanh toán có đang bật không? VÀ Có đang lưu ID của đơn hàng nào không?
        // Chỉ khi cả 2 điều kiện là true (tức là người dùng đang thực sự chờ thanh toán) thì mới cho phép chạy logic bên trong.
        if (paymentModalVisible && payingReservationId) {
            
            // DÒNG 147: Tạo một biến 'safeReservations'. Dùng Array.isArray kiểm tra xem danh sách lấy từ store có chuẩn là mảng không. 
            // Nếu chuẩn thì dùng nó, nếu bị lỗi (null/undefined) thì gán bằng mảng rỗng [] để các hàm phía sau chạy không bị sập (crash) web.
            const safeReservations = Array.isArray(reservationStore.reservations) ? reservationStore.reservations : [];
            
            // DÒNG 148: Dùng hàm .find() để duyệt qua danh sách đặt chỗ.
            // Mục đích: Tìm lôi ra cái đơn hàng cụ thể có ID (reservationId hoặc id) trùng khớp với mã ID (payingReservationId) mà người dùng đang chờ thanh toán.
            const currentRes = safeReservations.find(r => (r.reservationId || r.id) === payingReservationId);
            
            // DÒNG 149: Nếu tìm thấy đơn hàng đó (tức là biến currentRes có chứa dữ liệu chứ không bị rỗng)
            if (currentRes) {
                
                // DÒNG 150: Trích xuất trạng thái thanh toán của đơn hàng đó. Nếu lỡ nó bị null thì thay bằng chuỗi rỗng '', 
                // sau đó ép tất cả thành CHỮ IN HOA (toUpperCase) để dễ làm toán so sánh ở dòng dưới.
                const pStatus = String(currentRes.paymentStatus || '').toUpperCase();
                
                // DÒNG 151: Rẽ nhánh 1 - Kiểm tra xem trạng thái thanh toán có phải là 'PAID' (Đã thanh toán) hoặc 'COMPLETED' (Đã hoàn thành) không.
                if (pStatus === 'PAID' || pStatus === 'COMPLETED') {
                    
                    // DÒNG 152: Cập nhật biến trạng thái paymentSuccess thành true, báo hiệu đã trả tiền xong (thường dùng để đổi UI của cửa sổ thanh toán sang màu xanh lá/hiện dấu tích xanh).
                    setPaymentSuccess(true);
                    
                    // DÒNG 153: Hiện một thông báo nhỏ (popup toast) màu xanh ở góc màn hình báo thanh toán thành công. Thông báo tự biến mất sau 4 giây (duration: 4).
                    message.success({ content: 'Payment completed successfully! Your reservation is confirmed.', key: 'payment_success', duration: 4 });
                    
                    // DÒNG 154: Kiểm tra xem người dùng có đang tiện tay mở xem Bảng chi tiết của chính đơn hàng này không.
                    if (viewingReservation && (viewingReservation.reservationId || viewingReservation.id) === payingReservationId) {
                        
                        // DÒNG 155: Nếu có, nạp dữ liệu mới nhất (currentRes) vào bảng chi tiết đó, để nó lập tức nhảy từ chữ "Chưa thanh toán" sang "Đã thanh toán" mà không cần F5 trình duyệt.
                        setViewingReservation(currentRes);
                    }
                    
                // DÒNG 157: Rẽ nhánh 2 - Ngược lại, nếu trạng thái trả về là 'FAILED' (Thanh toán thất bại do hết giờ, hủy giao dịch, thẻ lỗi...)
                } else if (pStatus === 'FAILED') {
                    
                    // DÒNG 158: Tắt đóng luôn cửa sổ chờ thanh toán đi, không chờ nữa.
                    setPaymentModalVisible(false);
                    
                    // DÒNG 159: Xóa bỏ mã ID đơn hàng đang thanh toán khỏi bộ nhớ tạm để reset lại luồng.
                    setPayingReservationId(null);
                    
                    // DÒNG 160: Bắn ra một thông báo popup màu đỏ (error) báo cho người dùng biết là việc thanh toán đã thất bại hoặc bị hủy.
                    message.error({ content: 'Payment failed or was cancelled.', key: 'payment_failed' });
                }
            }
        }
        
    // DÒNG 163: Đây là Mảng Phụ Thuộc (Dependency Array). 
    // Quan trọng nhất là biến đầu tiên `reservationStore.reservations`. Nhờ có hàm Polling (phần 4) cứ 3 giây update biến này 1 lần, nên cứ 3s Hook này lại bị "đánh thức" để chạy lại toàn bộ logic từ dòng 146 đến 160 để kiểm tra kết quả!
    }, [reservationStore.reservations, paymentModalVisible, payingReservationId, viewingReservation]);
```
---
## 6. Hàm `fetchData` (Tải toàn bộ dữ liệu từ Server)
Hàm này chịu trách nhiệm lấy toàn bộ dữ liệu cần thiết (danh sách đặt chỗ, danh sách xe, danh sách chỗ đậu, các gói đăng ký) từ backend để hiển thị lên màn hình. Nó sử dụng `Promise.all` để gọi nhiều API cùng lúc nhằm tiết kiệm thời gian chờ đợi.

```javascript
    // Khai báo một hàm bất đồng bộ (async function) để có thể dùng lệnh 'await' đợi dữ liệu từ server trả về.
    const fetchData = async () => {
        
        // Bật cờ trạng thái 'loading' lên true. (Thường dùng để hiện biểu tượng xoay vòng vòng Loading spinner trên màn hình)
        reservationStore.loading = true;
        
        // Gọi hàm giả (forceRender) để ép React vẽ lại màn hình ngay lập tức (hiện cái spinner ra cho user thấy).
        forceRender();
        
        try {
            // Dùng Promise.all để bắn CÙNG LÚC 4 yêu cầu (request) lên server thay vì phải đợi lấy xong từng cái một (như vậy sẽ rất chậm).
            // Kết quả trả về sẽ được gom lại thành 1 mảng tương ứng với 4 cục dữ liệu.
            const [reservationsRes, vehiclesRes, slotsRes, subsRes] = await Promise.all([
                driverService.loadReservations(), // API 1: Lấy lịch sử đặt chỗ của tài xế
                driverService.loadMyVehicles(),   // API 2: Lấy danh sách xe mà tài xế đã thêm
                driverService.loadSlots(),        // API 3: Lấy danh sách chỗ đậu xe (slot)
                
                // API 4: Lấy danh sách vé tháng. Nếu API này lỡ bị lỗi (.catch) thì giả vờ trả về mảng rỗng { data: [] }
                // Mục đích: Nếu API vé tháng lỗi thì 3 API kia vẫn load bình thường, không làm sập toàn bộ trang web.
                subscriptionApi.getSubscriptions().catch(() => ({ data: [] })) 
            ]);

            // ==========================================
            // XỬ LÝ DỮ LIỆU 1: DANH SÁCH ĐẶT CHỖ
            // ==========================================
            // Trích xuất phần lõi dữ liệu
            const rRes = reservationsRes?.data || reservationsRes;
            
            // Đảm bảo dữ liệu chắc chắn là một mảng (Array). Nếu server trả về null thì ép nó thành mảng rỗng []
            const resArray = Array.isArray(rRes) ? rRes : [];
            
            // Sắp xếp mảng đặt chỗ theo thứ tự giảm dần của ID (Đơn đặt chỗ mới nhất sẽ nổi lên đầu)
            resArray.sort((a, b) => {
                const idA = a.reservationId || a.id || 0; // Lấy ID của đơn a
                const idB = b.reservationId || b.id || 0; // Lấy ID của đơn b
                return idB - idA; // Lấy b trừ a, nếu b > a thì số dương -> b xếp trước a.
            });
            
            // Lưu danh sách đã sắp xếp vào kho chứa (store)
            reservationStore.reservations = resArray;

            // ==========================================
            // XỬ LÝ DỮ LIỆU 2: DANH SÁCH XE CÁ NHÂN
            // ==========================================
            const vRes = vehiclesRes?.data || vehiclesRes;
            // Lưu vào store của xe một cách an toàn
            vehicleStore.vehicles = Array.isArray(vRes) ? vRes : [];

            // ==========================================
            // XỬ LÝ DỮ LIỆU 3: DANH SÁCH CHỖ ĐẬU XE (SLOT)
            // ==========================================
            const sRes = slotsRes?.data || slotsRes;
            // Lưu vào store của bãi đậu xe
            parkingStore.slots = Array.isArray(sRes) ? sRes : [];

            // ==========================================
            // XỬ LÝ DỮ LIỆU 4: DANH SÁCH VÉ THÁNG (SUBSCRIPTIONS)
            // ==========================================
            // Lấy dữ liệu an toàn dựa theo cấu trúc response đặc thù của API này (lớp vỏ bọc 2 lần data.data)
            let subData = subsRes?.data?.success ? subsRes.data.data : (subsRes?.data || []);
            // Lưu mảng danh sách thẻ tháng vào state của component React (bằng hàm setState)
            setSubscriptions(Array.isArray(subData) ? subData : []);
            
        } catch (error) {
            // NẾU CÓ BẤT KỲ LỖI NÀO (Ví dụ mất mạng, backend sập)
            
            // Hiện thông báo báo lỗi màu đỏ
            message.error('Failed to load data');
            
            // Xóa sạch dữ liệu cũ trong kho chứa (store) đi, phòng trường hợp dữ liệu cũ bị sai lệch
            reservationStore.reservations = [];
            vehicleStore.vehicles = [];
            parkingStore.slots = [];
            
        } finally {
            // Khối 'finally' là khối ĐẶC BIỆT: NÓ LUÔN LUÔN CHẠY, bất kể cục 'try' thành công hay 'catch' bị lỗi
            
            // Tắt cờ 'loading' (ẩn biểu tượng xoay vòng vòng đi)
            reservationStore.loading = false;
            
            // Ép React vẽ lại giao diện lần cuối cùng để hiển thị toàn bộ đống dữ liệu mới ra màn hình
            forceRender();
        }
    };

    // ---------------------------------------------------------
    // CÁC BIẾN AN TOÀN TRƯỚC KHI VẼ RA GIAO DIỆN (UI)
    // ---------------------------------------------------------
    // Ở bên ngoài hàm fetchData, mỗi khi React chuẩn bị render phần giao diện HTML, nó sẽ chạy qua 3 dòng này để lấy dữ liệu từ Store ra.
    // Việc kiểm tra Array.isArray ở đây là bước "Bảo hiểm kép". 
    // Nếu lỡ ai đó code sai, gán nhầm reservationStore.reservations = null, thì ở đây nó sẽ tự động biến thành mảng rỗng [].
    // Nhờ vậy, khi phần giao diện HTML ở dưới gọi các hàm duyệt mảng như .map(), .length, trình duyệt sẽ không bị sập (crash web).
    const safeReservations = Array.isArray(reservationStore.reservations) ? reservationStore.reservations : [];
    const safeVehicles = Array.isArray(vehicleStore.vehicles) ? vehicleStore.vehicles : [];
    const safeSlots = Array.isArray(parkingStore.slots) ? parkingStore.slots : [];
```
---
## 7. Xử lý Logic Điền tự động và Mở form đặt chỗ
Hai đoạn code này có nhiệm vụ xử lý trải nghiệm người dùng (UX) khi họ muốn đặt một chỗ đậu xe mới, đảm bảo form nhập liệu luôn được "dọn dẹp" sạch sẽ và điền sẵn những thông tin hợp lý nhất (như thời gian bắt đầu luôn là 5 phút tính từ thời điểm bấm).

```javascript
    // ==========================================
    // ĐOẠN 1: TỰ ĐỘNG ĐIỀN SLOT TỪ TRANG KHÁC TỚI
    // ==========================================
    // Hook (useEffect) này đóng vai trò như một "người gác cổng", luôn lắng nghe xem người dùng
    // có đang được chuyển hướng tới từ một trang khác (ví dụ trang Bản đồ) và có mang theo một Slot đi kèm không.
    useEffect(() => {
        
        // DÒNG 2: Kiểm tra 2 điều kiện: Đã tải xong danh sách chỗ đậu từ server về chưa (safeSlots.length > 0) 
        // VÀ trang trước đó có gửi kèm dữ liệu (location.state?.prefilledSlot) không?
        if (safeSlots.length > 0 && location.state?.prefilledSlot) {
            
            // DÒNG 3: Lôi thông tin cái Slot mà người dùng đã bấm chọn ở trang trước ra gán vào biến 'slot'
            const slot = location.state.prefilledSlot;
            
            // DÒNG 4: Xóa sạch các báo lỗi màu đỏ (nếu có) trên giao diện trước khi mở form
            setErrorAlert(null);
            
            // DÒNG 5: Reset toàn bộ dữ liệu đang nhập dở trong Form (để tránh bị dính dữ liệu cũ của lần đặt trước)
            form.resetFields();
            
            // DÒNG 6: Dùng thư viện dayjs tính toán thời gian bắt đầu mặc định: Bằng thời gian thực tế hiện tại cộng thêm 5 phút (trừ hao thời gian khách chạy xe tới)
            const now = dayjs().add(5, 'minute');
            
            // DÒNG 8: Tự động đổ dữ liệu vào Form
            form.setFieldsValue({
                startTime: now, // Thời gian bắt đầu: sau 5 phút
                endTime: now.add(1, 'day'), // Thời gian kết thúc mặc định: cộng thêm 1 ngày (24 tiếng)
                slotId: slot.slotId || slot.id // Quan trọng: Điền sẵn luôn cái ID của chỗ đậu xe vừa chọn ở trang trước
            });
            
            // DÒNG 13: Hiển thị bảng popup (Modal) Form Đặt chỗ lên màn hình
            setIsModalVisible(true);
            
            // DÒNG 16: DỌN DẸP DỮ LIỆU RÁC (Xử lý UX rất hay)
            // Xóa cái biến trạng thái 'prefilledSlot' ra khỏi URL/History của trình duyệt. 
            // Việc này giúp nếu người dùng bấm F5 (tải lại trang), form sẽ không bị tự động bật lên 1 lần nữa một cách vô duyên (vì dữ liệu location.state đã bị xóa sạch thành {}).
            navigate(location.pathname, { replace: true, state: {} });
        }
    // DÒNG 18: Mảng phụ thuộc: Hook này sẽ chạy lại nếu số lượng Slot tải về thay đổi, hoặc đường dẫn (location.state) thay đổi
    }, [safeSlots.length, location.state, navigate]);

    // ==========================================
    // ĐOẠN 2: HÀM MỞ FORM TẠO MỚI (BẤM NÚT THỦ CÔNG)
    // ==========================================
    // Hàm này được kích hoạt khi người dùng chủ động bấm vào nút "+ Thêm đặt chỗ" (Create Reservation) trên giao diện
    const handleCreate = () => {
        
        // DÒNG 22: Dọn dẹp nhà cửa - Xóa hết mọi thông báo lỗi cũ
        setErrorAlert(null);
        
        // DÒNG 23: Xóa sạch rác - Làm trống các trường nhập liệu cũ trong Form
        form.resetFields();
        
        // DÒNG 24: Khởi tạo mốc thời gian bắt đầu = hiện tại + 5 phút
        const now = dayjs().add(5, 'minute');
        
        // DÒNG 25: Gán giá trị mặc định vào Form cho tiện
        form.setFieldsValue({
            startTime: now,             // Bắt đầu: Sau 5 phút
            endTime: now.add(1, 'day')  // Kết thúc: Tạm tính sau 1 ngày
        });
        
        // DÒNG 29: Xóa (reset) lựa chọn "Loại xe" mà khách có thể đã chọn từ lần đặt trước đó
        setSelectedVehicleType(null);
        
        // DÒNG 30: Cuối cùng, bật popup Form hiển thị lên màn hình cho khách bắt đầu nhập
        setIsModalVisible(true);
    };
```
---
*(Lưu ý: Nếu cần, bạn cứ tiếp tục gửi các đoạn code khác. Tôi sẽ giải thích tường tận từng dòng lệnh (line-by-line) như thế này cho bạn!)*
