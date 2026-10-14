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

Đây là bước học và phát triển local. Chưa có xác minh email, quên mật khẩu,
rate limit đăng nhập hoặc giao diện kết nối. Chưa có API bài đăng/chat.
