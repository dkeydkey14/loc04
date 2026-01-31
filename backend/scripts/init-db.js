const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'loc05_admin';

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔌 Đang kết nối đến MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Kết nối thành công!');

    // Tạo database nếu chưa tồn tại
    console.log(`📦 Đang tạo database: ${DB_NAME}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${DB_NAME}`);
    console.log('✅ Database đã được tạo!');

    // Tạo bảng admin_users
    console.log('📋 Đang tạo bảng admin_users...');
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Bảng admin_users đã được tạo!');

    // Tạo bảng deposit_history
    console.log('📋 Đang tạo bảng deposit_history...');
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Bảng deposit_history đã được tạo!');

    // Tạo bảng admin_sessions
    console.log('📋 Đang tạo bảng admin_sessions...');
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Bảng admin_sessions đã được tạo!');

    // Tạo admin mặc định
    console.log('👤 Đang tạo admin mặc định...');
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('admin123', 10);
    
    const [existingAdmin] = await connection.query(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length === 0) {
      await connection.query(
        `INSERT INTO admin_users (username, password, full_name, email, role) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', defaultPassword, 'Administrator', 'admin@example.com', 'super_admin']
      );
      console.log('✅ Admin mặc định đã được tạo!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin mặc định đã tồn tại, bỏ qua...');
    }

    console.log('\n🎉 Khởi tạo database thành công!');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log('📋 Các bảng đã được tạo:');
    console.log('   - admin_users');
    console.log('   - deposit_history');
    console.log('   - admin_sessions');

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Đã đóng kết nối.');
    }
  }
}

// Chạy script
initDatabase();

