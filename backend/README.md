# Backend API - Hệ thống xét duyệt tự động VIP

## Cài đặt

```bash
npm install
```

## Chạy server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### 1. Xét duyệt tự động
**POST** `/api/admin/auto-approve`

Body:
```json
{
  "username": "duykhanh090705",
  "year": 2026
}
```

**Lưu ý:** 
- `year` là optional, mặc định là 2026
- API sẽ tự động:
  1. Gọi API lấy thông tin user: `GET http://localhost:3005/api/user/{username}/deposit/month/1?year={year}`
  2. Kiểm tra VIP level và tổng nạp tháng 1
  3. Nếu đủ điều kiện, sinh code value và gọi API cộng tiền: `POST http://localhost:6688/api/auto-loc04`

Response thành công:
```json
{
  "success": true,
  "approved": true,
  "message": "Xét duyệt và cộng tiền thành công",
  "data": {
    "username": "duykhanh090705",
    "userInfo": {
      "username": "duykhanh090705",
      "vipLevel": 11,
      ...
    },
    "vipLevel": 11,
    "vipRange": "VIP11-20",
    "codeValue": 500,
    "codeRange": {
      "min": 188,
      "max": 888
    },
    "totalDepositMonth1": 50000,
    "depositResult": { ... }
  }
}
```

Response không đủ điều kiện:
```json
{
  "success": false,
  "approved": false,
  "message": "Không đủ điều kiện. Cần tổng nạp tháng 1 tối thiểu: 50,000",
  "userInfo": {
    "username": "duykhanh090705",
    "vipLevel": 11,
    "vipRange": "VIP11-20"
  },
  "requirement": 50000,
  "currentDeposit": 30000
}
```

### 2. Lấy thông tin VIP theo level
**GET** `/api/admin/vip-info/:vipLevel`

Ví dụ: `/api/admin/vip-info/10`

### 3. Lấy tất cả thông tin VIP
**GET** `/api/admin/vip-info`

## Cấu hình VIP

- **VIP1-5**: Code 28-68, Tổng nạp: 3,000
- **VIP6-10**: Code 58-128, Tổng nạp: 30,000
- **VIP11-20**: Code 188-888, Tổng nạp: 50,000
- **VIP21-30**: Code 688-1,288, Tổng nạp: 100,000
- **VIP31-40**: Code 1,688-2,888, Tổng nạp: 300,000
- **VIP41-50**: Code 2,888-4,888, Tổng nạp: 500,000
- **VIP51-60**: Code 3,888-8,888, Không yêu cầu tổng nạp

## Cấu hình API

Có thể cấu hình URL của các API trong file `.env`:

```
PORT=3000
USER_INFO_API_URL=http://localhost:3005
DEPOSIT_API_URL=http://localhost:6688
```

Nếu không cấu hình, sẽ sử dụng giá trị mặc định:
- User Info API: `http://localhost:3005`
- Deposit API: `http://localhost:6688`

