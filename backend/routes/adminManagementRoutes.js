const express = require('express');
const router = express.Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const DepositHistory = require('../models/DepositHistory');

// Tất cả routes đều cần authentication
router.use(authenticate);

/**
 * Lấy lịch sử cộng điểm
 * GET /api/admin/management/history
 * Query params: page, limit, username, status, vip_level, startDate, endDate, admin_username
 */
router.get('/history', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      username,
      status,
      vip_level,
      startDate,
      endDate,
      admin_username
    } = req.query;

    const result = await DepositHistory.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      username,
      status,
      vip_level: vip_level ? parseInt(vip_level) : null,
      startDate,
      endDate,
      admin_username
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử',
      error: error.message
    });
  }
});

/**
 * Lấy thống kê tổng quan
 * GET /api/admin/management/stats
 * Query params: startDate, endDate
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await DepositHistory.getStats({ startDate, endDate });
    const statsByVIP = await DepositHistory.getStatsByVIP({ startDate, endDate });

    res.json({
      success: true,
      data: {
        overview: stats,
        byVIP: statsByVIP
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

/**
 * Xóa một record
 * DELETE /api/admin/management/history/:id
 */
router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DepositHistory.deleteById(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy record để xóa'
      });
    }

    return res.json({
      success: true,
      message: 'Xóa lịch sử thành công',
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting history:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử',
      error: error.message
    });
  }
});

/**
 * Lấy chi tiết một record
 * GET /api/admin/management/history/:id
 */
router.get('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../database/db');
    
    const [rows] = await pool.execute(
      'SELECT * FROM deposit_history WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy record'
      });
    }

    const record = rows[0];
    // Parse JSON fields
    if (record.deposit_api_response) {
      try {
        record.deposit_api_response = typeof record.deposit_api_response === 'string' 
          ? JSON.parse(record.deposit_api_response) 
          : record.deposit_api_response;
      } catch (e) {
        console.warn('Error parsing deposit_api_response:', e);
      }
    }
    
    if (record.user_info) {
      try {
        record.user_info = typeof record.user_info === 'string' 
          ? JSON.parse(record.user_info) 
          : record.user_info;
      } catch (e) {
        console.warn('Error parsing user_info:', e);
      }
    }

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Error fetching history detail:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết',
      error: error.message
    });
  }
});

module.exports = router;

