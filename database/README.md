# Dữ liệu demo

Dùng tài khoản quản trị MySQL chạy lần lượt create-databases.sql, schema.sql, demo-data.sql. Dừng service trước khi reset demo-data.sql; script này xóa dữ liệu trong đúng bảy database cinema_* và seed lại bằng khóa sinh tự động, không gán ID tĩnh. Không chạy trên dữ liệu cần giữ.

Mỗi service dùng tài khoản riêng chỉ có quyền database của nó. Mật khẩu local mẫu là CinemaLocal_2026!; thay trước khi dùng ngoài máy local.

Dữ liệu: 10 phim hư cấu dùng riêng cho đồ án, 5 thể loại, 3 rạp, 6 phòng, 384 ghế, 42 suất chiếu trong 7 ngày tới, 3 tài khoản, 4 trạng thái booking, 3 trạng thái payment và thông báo xác nhận. Suất chiếu/đơn giá là dữ liệu MySQL thật. Ảnh ban đầu trống để quản trị upload ảnh có quyền sử dụng; giao diện hiển thị “Ảnh đang cập nhật”.

Đăng nhập admin@gmail.com / 123456, user@gmail.com / 123456 hoặc guest@gmail.com / 123456. Mật khẩu được lưu BCrypt. Booking PENDING mẫu giữ ghế 10 phút từ thời điểm seed.
