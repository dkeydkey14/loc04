-- Database schema cho hệ thống admin quản lý cộng điểm

CREATE DATABASE IF NOT EXISTS loc05_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE loc05_admin;

-- Bảng admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role ENUM('admin', 'super_admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng lịch sử cộng điểm
CREATE TABLE IF NOT EXISTS deposit_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    vip_level INT NOT NULL,
    vip_range VARCHAR(20),
    code_value DECIMAL(10, 2) NOT NULL,
    total_deposit_month1 DECIMAL(15, 2) DEFAULT 0,
    requirement DECIMAL(15, 2),
    status ENUM('approved', 'rejected', 'failed') NOT NULL,
    message TEXT,
    admin_username VARCHAR(50),
    deposit_api_response TEXT,
    user_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_vip_level (vip_level),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_admin_username (admin_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng session tokens
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_token (token(255)),
    INDEX idx_admin_id (admin_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo admin mặc định (username: admin, password: admin123)
-- Password sẽ được hash bằng bcrypt khi chạy script init-db.js
-- Hoặc chạy lệnh sau để tạo admin:
-- node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"
-- Sau đó INSERT vào database với password đã hash

