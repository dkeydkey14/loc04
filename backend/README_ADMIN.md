# Hệ thống Admin Quản lý Cộng Điểm

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình Database

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật thông tin database trong `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=loc05_admin
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Tạo Database

Chạy file SQL để tạo database và tables:
```bash
mysql -u root -p < database/schema.sql
```

Hoặc import trực tiếp vào MySQL:
```sql
source database/schema.sql
```

Database sẽ được tạo với:
- Bảng `admin_users` - Quản lý admin accounts
- Bảng `deposit_history` - Lịch sử cộng điểm
- Bảng `admin_sessions` - Quản lý sessions (tùy chọn)

**Admin mặc định:**
- Username: `admin`
- Password: `admin123`

⚠️ **Lưu ý:** Đổi password ngay sau khi cài đặt!

## API Endpoints

### Authentication

#### 1. Đăng nhập
**POST** `/api/auth/login`

Body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "email": "admin@example.com",
      "role": "super_admin"
    }
  }
}
```

#### 2. Kiểm tra token
**GET** `/api/auth/verify`

Headers:
```
Authorization: Bearer <token>
```

#### 3. Đăng xuất
**POST** `/api/auth/logout`

### Admin Management

Tất cả endpoints dưới đây cần **Authorization header**:
```
Authorization: Bearer <token>
```

#### 1. Lấy lịch sử cộng điểm
**GET** `/api/admin/management/history`

Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `username` - Tìm theo username
- `status` - approved/rejected/failed
- `vip_level` - Lọc theo VIP level
- `startDate` - Ngày bắt đầu (YYYY-MM-DD)
- `endDate` - Ngày kết thúc (YYYY-MM-DD)
- `admin_username` - Lọc theo admin thực hiện

Ví dụ:
```
GET /api/admin/management/history?page=1&limit=20&status=approved&vip_level=11
```

#### 2. Lấy thống kê
**GET** `/api/admin/management/stats`

Query params:
- `startDate` - Ngày bắt đầu (YYYY-MM-DD)
- `endDate` - Ngày kết thúc (YYYY-MM-DD)

Response:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_records": 100,
      "approved_count": 80,
      "rejected_count": 15,
      "failed_count": 5,
      "total_code_value": 50000,
      "avg_code_value": 625
    },
    "byVIP": [
      {
        "vip_level": 11,
        "vip_range": "VIP11-20",
        "count": 20,
        "approved_count": 18,
        "total_code_value": 3600
      }
    ]
  }
}
```

#### 3. Lấy chi tiết một record
**GET** `/api/admin/management/history/:id`

### Auto Approve (Cần Authentication)

**POST** `/api/admin/auto-approve`

Headers:
```
Authorization: Bearer <token>
```

Body:
```json
{
  "username": "duykhanh090705",
  "year": 2026
}
```

Lịch sử sẽ được tự động lưu vào database với:
- Thông tin user
- VIP level và code value
- Trạng thái (approved/rejected/failed)
- Admin thực hiện
- Response từ API cộng tiền

## Cấu trúc Database

### admin_users
- `id` - ID admin
- `username` - Tên đăng nhập
- `password` - Password (đã hash)
- `full_name` - Tên đầy đủ
- `email` - Email
- `role` - admin/super_admin
- `is_active` - Trạng thái hoạt động

### deposit_history
- `id` - ID record
- `username` - Username được cộng điểm
- `vip_level` - VIP level
- `vip_range` - VIP range
- `code_value` - Giá trị code được cộng
- `total_deposit_month1` - Tổng nạp tháng 1
- `requirement` - Yêu cầu tối thiểu
- `status` - approved/rejected/failed
- `message` - Thông báo
- `admin_username` - Admin thực hiện
- `deposit_api_response` - Response từ API cộng tiền (JSON)
- `user_info` - Thông tin user (JSON)
- `created_at` - Thời gian tạo

## Tạo Admin mới

Có thể tạo admin mới bằng cách insert trực tiếp vào database hoặc tạo API endpoint (cần super_admin).

Ví dụ insert:
```sql
INSERT INTO admin_users (username, password, full_name, email, role) 
VALUES ('newadmin', '$2a$10$hashed_password', 'New Admin', 'newadmin@example.com', 'admin');
```

Hash password bằng bcrypt với cost 10.

## Bảo mật

1. **Đổi JWT_SECRET** trong production
2. **Đổi password admin mặc định** ngay sau khi cài đặt
3. Sử dụng HTTPS trong production
4. Giới hạn rate limiting cho API
5. Validate và sanitize tất cả inputs

