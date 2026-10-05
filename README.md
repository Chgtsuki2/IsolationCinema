# Lumière Cinema — Cinema Booking Microservices

Dự án đặt vé xem phim bằng Java 17, Spring Boot 3, Spring Cloud, MySQL và React/TypeScript. Chạy local không dùng Docker. Hai bản yêu cầu gốc nằm trong requirements-part-1.txt và requirements-part-2.txt.

## Trạng thái kiểm chứng ngày 22/09/2026

- Đã triển khai 9 ứng dụng backend và giao diện khách hàng/quản trị; các service đã chạy cùng MySQL và đăng ký Eureka.
- Frontend `npm run build` thành công. Bundle hiện có cảnh báo kích thước khoảng 905 kB trước gzip.
- Bộ `scripts/e2e.mjs` đã PASS 12 nhóm kiểm thử qua Gateway với MySQL thật; xem verification/e2e-report.json.
- Kiểm thử Maven incremental đã thành công cho cả 9 module: Discovery (3), Gateway (2), Auth (1), Movie (1), Cinema (1), Showtime (1), Booking (9), Payment (5), Notification (1); tổng 24 test. Log lưu tại verification.
- Đã kiểm tra bằng trình duyệt: đăng nhập, lịch chiếu, chọn ghế, tạo booking, reload trang thanh toán, rời trang rồi tiếp tục cùng giao dịch, nhận vé, dashboard quản trị. Tích hợp payOS đã được kiểm thử bằng mock; cần ba khóa của Kênh thanh toán để chạy giao dịch thật.
- **Chưa xác nhận toàn bộ `mvn clean test` / `mvn clean package` thành công trên máy này.** Sandbox Windows phát sinh AccessDeniedException khi Java đóng JAR compiler hoặc Maven dọn target. Runtime và các bài test nói trên được kiểm tra từ lớp đã biên dịch; không coi đây là bằng chứng build sạch. scripts/build.ps1 vẫn giữ bước clean và dừng khi có lỗi.
- Chưa kiểm tra trực quan mọi màn hình ở tất cả breakpoint; chưa thực hiện giao dịch tiền thật vì khóa Kênh thanh toán payOS không được lưu trong mã nguồn.

## Kiến trúc

| Ứng dụng | Cổng | Trách nhiệm |
|---|---:|---|
| discovery-server | 8761 | Eureka registry |
| api-gateway | 8080 | Routing, JWT, kiểm tra tài khoản bị khóa, CORS |
| auth-service | 8081 | Đăng ký/đăng nhập, hồ sơ, BCrypt, user, upload |
| movie-service | 8082 | Phim, thể loại |
| cinema-service | 8083 | Rạp, phòng, ghế |
| showtime-service | 8084 | Suất chiếu, chống trùng lịch |
| booking-service | 8085 | Giữ ghế, giá lịch sử, hết hạn, hủy, xác nhận |
| payment-service | 8086 | payOS/VietQR thật, webhook, đối soát trạng thái, idempotency |
| notification-service | 8087 | Thông báo trong ứng dụng, đánh dấu đã đọc |
| cinema-client | 5173 | React, Router, Axios, Framer Motion, Recharts |

Frontend chỉ gọi http://localhost:8080. Mỗi nghiệp vụ sở hữu database riêng và gọi nghiệp vụ khác qua OpenFeign/Eureka; không JOIN database của service khác. Endpoint internal yêu cầu INTERNAL_KEY. Tất cả service bind loopback và đăng ký Eureka bằng 127.0.0.1.

## Cấu hình payOS trong IntelliJ

Tạo tài khoản và Kênh thanh toán tại https://my.payos.vn, liên kết tài khoản ngân hàng muốn nhận tiền, rồi sao chép ba giá trị của kênh: Client ID, API Key và Checksum Key. Trong IntelliJ mở **Run > Edit Configurations > Payment Service**, chọn **Modify options > Environment variables** và thêm:

```text
PAYOS_CLIENT_ID=giá_trị_Client_ID;PAYOS_API_KEY=giá_trị_API_Key;PAYOS_CHECKSUM_KEY=giá_trị_Checksum_Key;PAYOS_FRONTEND_URL=http://127.0.0.1:5173
```

Giữ các biến `JWT_SECRET`, `INTERNAL_KEY`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` đang có trong cấu hình Payment Service. Không đưa ba khóa payOS vào frontend hoặc commit lên Git. Khởi động lại **Payment Service** và **API Gateway** sau khi thêm biến.

Khi chạy local, trang thanh toán hỏi trạng thái payOS qua Payment Service mỗi 3 giây và tự chuyển tới trang vé khi trạng thái là `PAID`. Khi triển khai công khai, cấu hình webhook trên payOS thành `https://ten-mien-cua-ban/api/payments/payos/webhook`; endpoint này không dùng JWT nhưng mọi dữ liệu đều được xác minh bằng chữ ký HMAC-SHA256 từ Checksum Key.

## Cài đặt và chạy

Yêu cầu JDK 17, Maven 3.9+, Node.js 22+, MySQL 8. Đặt JAVA_HOME vào JDK 17 và kiểm tra `java -version`, `mvn -version` trước khi build.

1. Trong MySQL CLI bằng tài khoản quản trị, chạy lần lượt `database/create-databases.sql`, `database/schema.sql`, `database/demo-data.sql`. Ví dụ mở `mysql -u root -p`, rồi dùng `source C:/duong-dan-du-an/database/create-databases.sql` cho từng file.
2. SQL tạo đúng bảy database cinema_* cùng user riêng. Mật khẩu local mẫu: CinemaLocal_2026!. Điều chỉnh SQL và cấu hình cùng nhau nếu đổi mật khẩu. `demo-data.sql` xóa dữ liệu demo cũ trong bảy database này: chỉ reset khi không cần giữ dữ liệu và đã dừng service.
3. Từ thư mục gốc dự án chạy:

```powershell
./scripts/setup-local.ps1 -DatabasePort 3306
./scripts/build.ps1
./scripts/start.ps1
```

Script setup tạo JWT_SECRET, INTERNAL_KEY ngẫu nhiên vào .env.local, giữ nguyên file nếu đã tồn tại. Không đưa file này lên Git. Dùng DatabasePort khác nếu MySQL của bạn không ở 3306. Phiên kiểm thử của tác giả dùng MySQL riêng trên 3307, không thay đổi MySQL3306 đang có trên máy.

`start.ps1` khởi động các executable JAR, ghi log vào .run. Đợi các ứng dụng đăng ký Eureka và Gateway nạp registry (có thể khoảng 90 giây ở lần đầu); mở http://localhost:8761 để xem trạng thái. Các request trong lúc registry chưa sẵn sàng có thể trả 503.

Mở terminal khác:

```powershell
cd cinema-client
npm ci
npm run dev
```

Truy cập http://127.0.0.1:5173. Nếu môi trường Windows giới hạn quyền khiến Vite dev prebundle lỗi, có thể dùng bản build:

```powershell
npm run build
npx vite preview --configLoader runner --host 127.0.0.1 --port 5173
```

Dừng backend bằng `./scripts/stop.ps1`. Script chỉ dừng PID có cùng thời điểm khởi động được lưu bởi start.ps1. Dừng frontend bằng Ctrl+C trong terminal chạy nó.

## Tài khoản và dữ liệu

- Quản trị: admin@gmail.com / 123456
- Khách hàng: user@gmail.com / 123456
- Khách phụ: guest@gmail.com / 123456

Seed gồm 10 phim hư cấu, 5 thể loại, 3 rạp, 6 phòng, 384 ghế, 42 suất chiếu trong 7 ngày tính từ lúc seed, các booking/payment mẫu và thông báo. Poster ban đầu trống: giao diện ghi rõ “Ảnh đang cập nhật”; quản trị có thể upload ảnh từ máy hoặc nhập URL. Không dùng dữ liệu mock trong frontend.

## Chức năng đã triển khai

Khách hàng: tìm/lọc phim, chi tiết/trailer, chọn tỉnh/rạp/ngày/suất chiếu, sơ đồ ghế có trạng thái, bảng giá từng ghế, giữ chỗ 10 phút, tiếp tục thanh toán, VietQR payOS, tự xác nhận và chuyển trang sau khi nhận tiền, vé QR, lịch sử theo trạng thái, hủy vé chờ thanh toán, hồ sơ/avatar, đổi mật khẩu và thông báo.

Quản trị: dashboard 13 chỉ số và 6 biểu đồ; CRUD phim/thể loại/rạp/phòng/suất chiếu; sinh ghế theo hàng/cột, chỉnh loại/trạng thái ghế; danh sách/chi tiết booking/payment; xác nhận hoặc làm thất bại payment; khóa/mở user và xem lịch sử; thông báo, lọc/tìm kiếm/phân trang.

Upload: JPG/PNG/WebP tối đa 5 MB, kiểm tra loại file/nội dung, tên UUID; lưu vào UPLOAD_DIR ngoài target. Khi chạy bằng script, mặc định là thư mục uploads tại gốc dự án. Không xóa thư mục này nếu cần giữ ảnh sau restart.

## Quy tắc nhất quán

- Backend lấy user từ JWT; không nhận userId hoặc giá vé từ form khách hàng. Giá thường = giá suất chiếu, VIP +30.000đ, Couple gấp đôi. BookingSeat lưu giá và thông tin lịch sử.
- Unique(showtime_id, seat_id) trong SeatReservation bảo đảm chỉ một giao dịch giữ/bán được ghế. Booking giữ ghế 10 phút theo timestamp server; scheduler hết hạn giải phóng reservation nhưng giữ lịch sử.
- Showtime dùng khóa theo phòng để chống trùng lịch. Khi bắt đầu tạo booking, lịch được khóa sửa để tránh đổi thông tin giữa chừng; kể cả booking hết hạn thì lịch đã mở đặt vé vẫn không được sửa/xóa.
- Mỗi booking có tối đa một payment. Tạo lại payment trả về cùng giao dịch. Confirm lặp lại hoặc đồng thời không tạo thêm payment/notification.
- Payment xác nhận Booking trước rồi cập nhật payment trong transaction riêng; bộ đối soát mỗi 5 giây khôi phục trường hợp service dừng giữa hai bước. Đây là nhất quán cuối cùng, không phải transaction phân tán XA.
- Booking confirmed có cờ chờ gửi notification; retry định kỳ và unique booking_id phía Notification chống trùng. Thông báo có thể xuất hiện chậm vài giây.
- Giờ chiếu dùng LocalDate/LocalTime/LocalDateTime theo giờ địa phương rạp; showtime bật direct Java Time JDBC để tránh chuyển lệch TIME qua múi giờ UTC. Deadline thanh toán dùng Instant.
- Mỗi payment dùng `bookingId` làm `orderCode` payOS duy nhất. Khách không thể tự xác nhận thanh toán; Payment Service chỉ xác nhận vé sau khi nhận trạng thái `PAID` từ API payOS hoặc webhook có chữ ký hợp lệ. Quản trị viên vẫn có nút xác nhận thủ công để xử lý ngoại lệ.

## Kiểm thử

```powershell
# Chạy sau khi backend và dữ liệu demo đã sẵn sàng
node scripts/e2e.mjs
```

E2E tạo dữ liệu thử trong database local: tài khoản mới, booking, payment, notification và một avatar PNG. Các bản ghi nghiệp vụ xác nhận được giữ để kiểm tra lịch sử. CRUD catalog tạm được xóa ở cuối kiểm thử. Chỉ chạy trên dữ liệu demo.

Nhóm kiểm thử bao gồm xác thực/quyền, chống giả user, giá ghế, trùng ghế, sở hữu booking, resume cùng ID/QR/deadline, xác nhận quản trị đồng thời, thông báo duy nhất, hủy/giải phóng ghế, CRUD liên quan, round-trip giờ chiếu MySQL và upload. E2E thanh toán cần cấu hình khóa payOS hợp lệ; bài test Payment Service dùng mock để không tạo giao dịch bên ngoài.

Import hai file trong postman vào Postman nếu muốn kiểm tra thủ công. Collection lưu ID/token từ response, không cần tự đoán ID trong database. Unit/integration test từng module chạy `mvn test`; các dependency nghiệp vụ bên ngoài được mock trong bài test service, còn E2E sử dụng service thật.

Trước khi coi bản phát hành hoàn tất, cần chạy thành công scripts/build.ps1 trong terminal Java17 có quyền filesystem đầy đủ và kiểm tra thêm tất cả màn hình ở 375/768/1024/1440px. Xem verification/STATUS.md để phân biệt kết quả đã chạy với phần chưa kiểm chứng.

