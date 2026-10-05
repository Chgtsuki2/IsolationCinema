# Kết quả kiểm chứng

Ngày: 22/09/2026. Java 17.0.20, MySQL 8 local, Gateway 8080.

| Kiểm tra | Kết quả |
|---|---|
| Discovery Maven test | PASS 3 |
| Gateway Maven test | PASS 2 |
| Auth Maven test | PASS 1 |
| Movie Maven test | PASS 1 |
| Cinema Maven test | PASS 1 |
| Showtime Maven test | PASS 1 |
| Booking Maven test | PASS 9 |
| Payment Maven test | PASS 5 |
| Notification Maven test | PASS 1 |
| Tổng Maven incremental | PASS 24, không bỏ qua test |
| API E2E Gateway + MySQL | PASS 12 nhóm |
| MySQL giờ chiếu round-trip | PASS 18:00 -> đọc lại 18:00, kết thúc 20:00 |
| Frontend TypeScript + Vite production build | PASS |
| Browser đặt ghế -> payment -> reload -> Vé của tôi -> resume -> confirm -> vé QR | PASS |
| Browser admin dashboard, thống kê từ API | PASS |
| Avatar sau restart Auth | PASS cùng URL, HTTP200, PNG68bytes |
| Clean test/package tất cả module | CHƯA ĐẠT xác nhận; filesystem AccessDeniedException |
| Toàn bộ giao diện mọi breakpoint | CHƯA kiểm tra đầy đủ |

Các lần compiler báo không đóng được JAR vẫn tạo class trên đĩa. Sau đó Maven incremental thực thi test và đạt; do đó báo cáo không gọi đây là build sạch. Script build chính thức vẫn chạy clean test và clean package, không bỏ qua bài test. Những log phase-1-* là log lỗi lịch sử, không phải trạng thái chức năng hiện tại.

Luồng browser đã xác nhận cùng transaction code và countdown không reset sau reload/rời trang. API E2E so sánh trực tiếp payment ID, QR payload, deadline và xác nhận đồng thời năm request. Avatar được kiểm tra sau khi dừng/khởi động lại auth-service bằng Java17, không chỉ reload trang.

Dữ liệu đã phát sinh thêm booking/payment/test account từ kiểm thử. Muốn quay về đúng bộ seed, dừng service và chạy lại demo-data.sql theo cảnh báo trong README. Ảnh poster seed để trống, sử dụng fallback có nhãn; không coi đây là lỗi tải ảnh.

Sửa múi giờ Showtime sử dụng hỗ trợ JDBC 4.2 theo tài liệu chính thức Hibernate 6.6:
https://docs.jboss.org/hibernate/orm/6.6/javadocs/org/hibernate/cfg/MappingSettings.html#JAVA_TIME_USE_DIRECT_JDBC
