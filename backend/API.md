# API tài khoản — bước 1

Base URL: `http://127.0.0.1:3001`. Gửi JSON với `Content-Type: application/json`.

## Sign up: POST /auth/register

```json
{
  "email": "student@example.com",
  "password": "ExamplePassword123!",
  "full_name": "Nguyen Van A",
  "student_number": "20260001"
}
```

Trả 201 với id, email, full_name, student_number. Mật khẩu dài 12–128 ký tự.
Trùng email hoặc mã sinh viên trả 409; dữ liệu không hợp lệ trả 400.
Signup chưa tự đăng nhập; gọi login sau đó.

## Log in: POST /auth/login

```json
{
  "email": "student@example.com",
  "password": "ExamplePassword123!"
}
```

Trả 200 với `access_token`, `token_type: Bearer`, `expires_in: 86400`.
Sai thông tin trả 401.

## Kiểm tra đăng nhập: GET /auth/me

Header: `Authorization: Bearer <access_token>`.
Trả thông tin tài khoản và sinh viên hiện tại, không trả password_hash.
Token thiếu/hết hạn/đã logout trả 401.

## Log out: POST /auth/logout

Gửi cùng header Authorization, không cần body.
Trả `{"success":true}` và hủy phiên tương ứng. Những phiên khác vẫn còn hiệu lực.

## Giới hạn thử đăng nhập

`POST /auth/login` nhận tối đa **10 request/IP trong cửa sổ 60 giây**, tính từ
request đầu tiên. Tính cả request thành công, sai mật khẩu và dữ liệu không hợp lệ.
Request thứ 11 trả **429** kèm header `Retry-After` (số giây cần chờ), trước khi
truy vấn tài khoản hoặc băm mật khẩu. Request bị chặn không kéo dài thời gian chờ.
Các API khác không bị giới hạn bởi cơ chế này.

Bộ đếm nằm trong RAM của một tiến trình và được xóa khi restart; IP dùng chung
sẽ dùng chung hạn mức. Giới hạn 10.000 IP đang hoạt động để tránh tăng bộ nhớ vô hạn;
khi đầy, IP mới nhận 429, thử lại sau 60 giây. Dùng địa chỉ kết nối trực tiếp,
không tin `X-Forwarded-For`. Nếu triển khai qua proxy hoặc nhiều server, cần thiết kế
lại nhận diện IP và bộ đếm dùng chung. Đây chưa phải bảo vệ đầy đủ trước brute force phân tán.

Đây là bước học và phát triển local. Chưa có xác minh email, quên mật khẩu
hoặc giao diện kết nối. Chưa có API bài đăng/chat.
