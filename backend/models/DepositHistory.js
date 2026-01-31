const pool = require('../database/db');

class DepositHistory {
  // Lưu lịch sử cộng điểm
  static async create(data) {
    const {
      username,
      vip_level,
      vip_range,
      code_value,
      total_deposit_month1,
      requirement,
      status,
      message,
      admin_username,
      deposit_api_response,
      user_info
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO deposit_history 
       (username, vip_level, vip_range, code_value, total_deposit_month1, requirement, 
        status, message, admin_username, deposit_api_response, user_info) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        vip_level,
        vip_range,
        code_value,
        total_deposit_month1,
        requirement,
        status,
        message,
        admin_username,
        deposit_api_response ? JSON.stringify(deposit_api_response) : null,
        user_info ? JSON.stringify(user_info) : null
      ]
    );
    return result.insertId;
  }

  // Lấy lịch sử với pagination
  static async findAll({ page = 1, limit = 20, username, status, vip_level, startDate, endDate, admin_username } = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM deposit_history WHERE 1=1';
    const params = [];

    if (username) {
      query += ' AND username LIKE ?';
      params.push(`%${username}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (vip_level) {
      query += ' AND vip_level = ?';
      params.push(vip_level);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    if (admin_username) {
      query += ' AND admin_username = ?';
      params.push(admin_username);
    }

    // LIMIT và OFFSET phải là số nguyên, không dùng placeholder
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await pool.execute(query, params);

    // Đếm tổng số records
    let countQuery = 'SELECT COUNT(*) as total FROM deposit_history WHERE 1=1';
    const countParams = [];

    if (username) {
      countQuery += ' AND username LIKE ?';
      countParams.push(`%${username}%`);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (vip_level) {
      countQuery += ' AND vip_level = ?';
      countParams.push(vip_level);
    }
    if (startDate) {
      countQuery += ' AND created_at >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND created_at <= ?';
      countParams.push(endDate);
    }
    if (admin_username) {
      countQuery += ' AND admin_username = ?';
      countParams.push(admin_username);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Parse JSON fields
    const parsedRows = rows.map(row => {
      let depositApiResponse = null;
      let userInfo = null;
      
      // Parse deposit_api_response
      if (row.deposit_api_response) {
        try {
          depositApiResponse = typeof row.deposit_api_response === 'string' 
            ? JSON.parse(row.deposit_api_response) 
            : row.deposit_api_response;
        } catch (e) {
          console.warn('Error parsing deposit_api_response:', e);
          depositApiResponse = row.deposit_api_response;
        }
      }
      
      // Parse user_info
      if (row.user_info) {
        try {
          userInfo = typeof row.user_info === 'string' 
            ? JSON.parse(row.user_info) 
            : row.user_info;
        } catch (e) {
          console.warn('Error parsing user_info:', e);
          userInfo = row.user_info;
        }
      }
      
      return {
        ...row,
        deposit_api_response: depositApiResponse,
        user_info: userInfo
      };
    });

    return {
      data: parsedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Lấy thống kê
  static async getStats({ startDate, endDate } = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'approved' THEN code_value ELSE 0 END) as total_code_value,
        AVG(code_value) as avg_code_value
      FROM deposit_history
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }

  // Kiểm tra xem username đã có record approved chưa
  static async findApprovedByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM deposit_history WHERE username = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [username, 'approved']
    );
    return rows[0] || null;
  }

  // Xóa record theo ID
  static async deleteById(id) {
    const [result] = await pool.execute(
      'DELETE FROM deposit_history WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Lấy thống kê theo VIP level
  static async getStatsByVIP({ startDate, endDate } = {}) {
    let query = `
      SELECT 
        vip_level,
        vip_range,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'approved' THEN code_value ELSE 0 END) as total_code_value
      FROM deposit_history
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY vip_level, vip_range ORDER BY vip_level';

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = DepositHistory;

