const pool = require('../database/db');
const bcrypt = require('bcryptjs');

class AdminUser {
  // Tìm admin theo username
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    return rows[0] || null;
  }

  // Tìm admin theo ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, full_name, email, role, created_at FROM admin_users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows[0] || null;
  }

  // Kiểm tra password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Tạo admin mới
  static async create({ username, password, full_name, email, role = 'admin' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO admin_users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, email, role]
    );
    return result.insertId;
  }

  // Cập nhật password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE admin_users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }
}

module.exports = AdminUser;

