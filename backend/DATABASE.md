# Database — bước 1

Database đang dùng: `campusfind_auth` (PostgreSQL local).
Database kiểm thử: `campusfind_auth_test`.

| Bảng | Cột | Mục đích |
| --- | --- | --- |
| users | id, email, password_hash, created_at | Tài khoản đăng nhập |
| students | user_id, full_name, student_number | Thông tin sinh viên; user_id liên kết users.id |
| auth_sessions | token_hash, user_id, expires_at, created_at | Phiên đăng nhập; logout xóa phiên |

- Mỗi sinh viên có một tài khoản. Signup tạo cả hai bản ghi trong cùng transaction.
- Email không trùng (không phân biệt hoa/thường); mã sinh viên không trùng.
- Mật khẩu được băm bằng scrypt; không lưu mật khẩu gốc.
- Mã sinh viên là dữ liệu người dùng khai báo, chưa có quy trình xác minh.
- Session hết hạn sau 24 giờ. Chỉ lưu bản băm token trong database.
- `campusfind_internal.schema_migrations` là bảng kỹ thuật theo dõi migration.

Migration duy nhất của bước này: `migrations/001_auth.sql`.
Chạy `npm run db:migrate`; chạy lại không tạo bảng trùng.

Thông tin kết nối trong `.env`, test trong `.env.test.local`; không commit các file này.
Chạy `npm run db:local:start` để bật PostgreSQL; `npm run db:local:stop` để dừng,
không xóa dữ liệu. Với máy khác có PostgreSQL, tạo database rồi cấu hình DATABASE_URL.

Phần mở rộng cũ đã gỡ khỏi source hiện tại. Database `campusfind` và `campusfind_test`
được giữ nguyên để dự phòng, không còn được ứng dụng sử dụng. Có bản dump và migration
cũ trong `.local/previous-scope/`. Không chỉnh sửa migration đã áp dụng ở database cũ;
bước nhỏ này dùng database mới và lịch sử migration riêng.
