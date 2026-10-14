# Bước 1: tài khoản sinh viên

Phạm vi hiện tại chỉ gồm PostgreSQL và đăng ký/đăng nhập/đăng xuất.
Chưa triển khai bài đăng, chat, upload ảnh hoặc benchmark.

## Chạy trên máy này

```powershell
npm run db:local:start
npm run db:migrate
npm run start:dev
```

API: http://127.0.0.1:3001. Nếu backend đang chạy nền, dừng tiến trình đó trước khi
chạy start:dev để tránh trùng cổng. PostgreSQL portable nằm trong `.local/`, không
phải Windows service; cần khởi động lại sau khi bật máy.

- [Cấu trúc database](DATABASE.md)
- [Ví dụ đăng ký, đăng nhập, đăng xuất](API.md)

Kiểm tra: `npm run test:integration` chạy trên database test riêng; `npm test`,
`npm run test:e2e`, `npm run lint` kiểm tra phần còn lại.

Frontend chưa thay đổi. Trang /tasks cũ dùng nickname nên chưa tương thích với
API email/token này; tích hợp giao diện sẽ là một bước riêng.
