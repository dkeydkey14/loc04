const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware xác thực JWT
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Kiểm tra admin còn tồn tại và active
    const admin = await AdminUser.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc admin không tồn tại'
      });
    }

    // Gắn thông tin admin vào request
    req.admin = admin;
    req.adminId = decoded.id;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
      error: error.message
    });
  }
};

// Middleware kiểm tra quyền super_admin
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ super admin mới có quyền thực hiện hành động này'
    });
  }
  next();
};

// Tạo JWT token
const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    JWT_SECRET,
    { expiresIn: '7d' } // Token hết hạn sau 7 ngày
  );
};

module.exports = {
  authenticate,
  requireSuperAdmin,
  generateToken
};

