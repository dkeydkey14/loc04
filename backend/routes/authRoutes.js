const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { generateToken, authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * Đăng nhập admin
 * POST /api/auth/login
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Username không được để trống'),
  body('password').notEmpty().withMessage('Password không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Tìm admin
    const admin = await AdminUser.findByUsername(username);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Username hoặc password không đúng'
      });
    }

    // Kiểm tra password
    const isPasswordValid = await AdminUser.verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Username hoặc password không đúng'
      });
    }

    // Tạo token
    const token = generateToken(admin.id);

    // Trả về thông tin admin (không bao gồm password)
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
});

/**
 * Đăng xuất (client sẽ xóa token)
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

/**
 * Kiểm tra token (verify token)
 * GET /api/auth/verify
 */
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      admin: req.admin
    }
  });
});

module.exports = router;

