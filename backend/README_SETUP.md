# Hướng Dẫn Setup Database

## Cách 1: Sử dụng Script Tự Động (Khuyến nghị)

Chạy script tự động để tạo database và tables:

```bash
npm run init-db
```

Script sẽ:
- ✅ Tạo database `loc05_admin`
- ✅ Tạo tất cả các bảng cần thiết
- ✅ Tạo admin mặc định (username: `admin`, password: `admin123`)

## Cách 2: Chạy SQL Thủ Công

### Bước 1: Kết nối MySQL

```bash
mysql -u root -p
```

### Bước 2: Chạy file SQL

```sql
source database/schema.sql
```

Hoặc:

```bash
mysql -u root -p < database/schema.sql
```

### Bước 3: Tạo Admin Mặc Định

Tạo password hash:

```bash
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"
```

Copy password hash và chạy SQL:

```sql
USE loc05_admin;

INSERT INTO admin_users (username, password, full_name, email, role) 
VALUES ('admin', '<password_hash>', 'Administrator', 'admin@example.com', 'super_admin');
```

## Kiểm Tra

Sau khi setup, kiểm tra database:

```sql
USE loc05_admin;
SHOW TABLES;
SELECT * FROM admin_users;
```

Bạn sẽ thấy:
- ✅ 3 bảng: `admin_users`, `deposit_history`, `admin_sessions`
- ✅ 1 admin user với username: `admin`

## Troubleshooting

### Lỗi: "Table doesn't exist"
→ Chạy lại `npm run init-db`

### Lỗi: "Access denied"
→ Kiểm tra thông tin database trong file `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=loc05_admin
```

### Lỗi: "Database already exists"
→ Không sao, script sẽ bỏ qua và tiếp tục tạo tables

