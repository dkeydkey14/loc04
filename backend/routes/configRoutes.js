const express = require('express');
const router = express.Router();

/**
 * Lấy cấu hình frontend
 * GET /api/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      apiBase: process.env.API_BASE_URL || req.protocol + '://' + req.get('host'),
      apiUrl: process.env.API_BASE_URL || req.protocol + '://' + req.get('host')
    }
  });
});

module.exports = router;

