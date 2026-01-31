const express = require('express');
const router = express.Router();
const { 
  getVIPRange, 
  generateCodeValue, 
  checkDepositRequirement 
} = require('../config/vipConfig');
const { getUserDepositInfo, addDeposit } = require('../services/apiService');
const DepositHistory = require('../models/DepositHistory');

/**
 * API xét duyệt tự động
 * POST /api/admin/auto-approve
 * Body: {
 *   username: string,
 *   year?: number (mặc định 2026)
 * }
 */
router.post('/auto-approve', async (req, res) => {
  try {
    const { username, year } = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username không hợp lệ'
      });
    }

    const checkYear = year || 2026;

    // Kiểm tra xem tài khoản đã nhận thưởng chưa (kiểm tra sớm để tránh gọi API không cần thiết)
    const existingApproved = await DepositHistory.findApprovedByUsername(username);
    if (existingApproved) {
      return res.json({
        success: false,
        approved: false,
        message: 'Tài khoản này đã nhận thưởng rồi',
        existingRecord: {
          id: existingApproved.id,
          created_at: existingApproved.created_at,
          code_value: existingApproved.code_value,
          vip_level: existingApproved.vip_level
        }
      });
    }

    // Gọi API lấy thông tin user và tổng nạp
    console.log(`Đang lấy thông tin user: ${username}, năm: ${checkYear}`);
    const userInfoResult = await getUserDepositInfo(username, checkYear);

    if (!userInfoResult.success) {
      return res.status(400).json({
        success: false,
        message: userInfoResult.message || 'Không lấy được thông tin user',
        error: userInfoResult.status
      });
    }

    const userData = userInfoResult.data;
    const userInfo = userData.userInfo;
    const vipLevel = userInfo?.vipLevel;

    // Kiểm tra VIP level hợp lệ (phải từ 1-60)
    if (!vipLevel || vipLevel === 0 || vipLevel < 1 || vipLevel > 60) {
      return res.json({
        success: false,
        approved: false,
        message: 'Tài khoản bạn không đủ điều kiện',
        userInfo: {
          username: username,
          vipLevel: vipLevel || 0
        }
      });
    }

    // Lấy tổng nạp tháng 1 - tìm trong nhiều vị trí có thể
    let totalDepositMonth1 = 0;
    
    // Hàm helper để parse số có dấu chấm phân cách (ví dụ: "24.032" -> 24032)
    const parseDepositValue = (value) => {
      if (value === undefined || value === null) return 0;
      // Chuyển thành string và loại bỏ dấu chấm phân cách
      const strValue = String(value).replace(/\./g, '');
      return parseFloat(strValue) || 0;
    };
    
    // Tìm trong userData trước
    if (userData.totalDepositMonth1 !== undefined) {
      totalDepositMonth1 = parseDepositValue(userData.totalDepositMonth1);
    } else if (userData.depositSummary?.totalDeposit !== undefined) {
      // Tìm trong depositSummary.totalDeposit (ví dụ: "24.032")
      totalDepositMonth1 = parseDepositValue(userData.depositSummary.totalDeposit);
    } else if (userData.totalDeposit !== undefined) {
      totalDepositMonth1 = parseDepositValue(userData.totalDeposit);
    } else if (userData.depositAmount !== undefined) {
      totalDepositMonth1 = parseDepositValue(userData.depositAmount);
    } else if (userInfo.totalDepositMonth1 !== undefined) {
      totalDepositMonth1 = parseDepositValue(userInfo.totalDepositMonth1);
    } else if (userInfo.totalDeposit !== undefined) {
      totalDepositMonth1 = parseDepositValue(userInfo.totalDeposit);
    } else if (userData.rawData?.data?.records) {
      // Tính tổng từ danh sách records nếu có
      const records = userData.rawData.data.records;
      totalDepositMonth1 = records.reduce((sum, record) => {
        // Chỉ tính các giao dịch nạp tiền (optType = 2112, dealType = 2)
        if (record.optType === 2112 && record.dealType === 2 && record.changeBalance) {
          return sum + (parseFloat(record.changeBalance) || 0);
        }
        return sum;
      }, 0);
    }
    
    // Log để debug nếu không tìm thấy
    if (totalDepositMonth1 === 0) {
      console.warn('Không tìm thấy totalDepositMonth1 trong response, sử dụng giá trị 0. Response:', JSON.stringify(userData, null, 2));
    } else {
      console.log(`Tìm thấy tổng nạp tháng 1: ${totalDepositMonth1}`);
    }

    // Lấy VIP range
    const vipRange = getVIPRange(vipLevel);
    
    if (!vipRange) {
      return res.json({
        success: false,
        approved: false,
        message: 'Tài khoản bạn không đủ điều kiện',
        userInfo: {
          username: username,
          vipLevel: vipLevel
        }
      });
    }

    // Kiểm tra điều kiện nhận thưởng
    const isEligible = checkDepositRequirement(vipRange, totalDepositMonth1);

    if (!isEligible) {
      const requirement = require('../config/vipConfig').VIP_DEPOSIT_REQUIREMENTS[vipRange];
      
      // Lưu lịch sử vào database
      try {
        await DepositHistory.create({
          username,
          vip_level: vipLevel,
          vip_range: vipRange,
          code_value: 0,
          total_deposit_month1: totalDepositMonth1,
          requirement: requirement,
          status: 'rejected',
          message: 'Tài khoản bạn không đủ điều kiện',
          admin_username: 'system',
          user_info: userInfo
        });
      } catch (dbError) {
        console.error('Error saving history to database:', dbError);
      }
      
      return res.json({
        success: false,
        approved: false,
        message: 'Tài khoản bạn không đủ điều kiện',
        userInfo: {
          username: username,
          vipLevel: vipLevel,
          vipRange: vipRange
        },
        requirement: requirement,
        currentDeposit: totalDepositMonth1,
        shortfall: requirement - totalDepositMonth1 // Số tiền còn thiếu
      });
    }

    // Lấy giá trị code cố định theo VIP level
    const codeValue = generateCodeValue(vipLevel);
    
    if (!codeValue) {
      return res.status(400).json({
        success: false,
        message: `Không tìm thấy giá trị code cho VIP level ${vipLevel}`
      });
    }

    // Gọi API cộng tiền
    console.log(`Đang cộng tiền cho user: ${username}, số tiền: ${codeValue}`);
    const depositResult = await addDeposit(username, codeValue);

    if (!depositResult.success) {
      // Lưu lịch sử thất bại vào database
      try {
        await DepositHistory.create({
          username,
          vip_level: vipLevel,
          vip_range: vipRange,
          code_value: codeValue,
          total_deposit_month1: totalDepositMonth1,
          requirement: require('../config/vipConfig').VIP_DEPOSIT_REQUIREMENTS[vipRange],
          status: 'failed',
          message: depositResult.message || 'Xét duyệt thành công nhưng không thể cộng tiền',
          admin_username: 'system',
          deposit_api_response: depositResult.data,
          user_info: userInfo
        });
      } catch (dbError) {
        console.error('Error saving history to database:', dbError);
      }
      
      return res.status(500).json({
        success: false,
        approved: false,
        message: depositResult.message || 'Xét duyệt thành công nhưng không thể cộng tiền',
        errorDetail: depositResult.errorDetail,
        data: {
          username: username,
          vipLevel: vipLevel,
          vipRange: vipRange,
          codeValue: codeValue,
          totalDepositMonth1: totalDepositMonth1,
          depositError: depositResult.data
        }
      });
    }

    // Lưu lịch sử thành công vào database
    try {
      await DepositHistory.create({
        username,
        vip_level: vipLevel,
        vip_range: vipRange,
        code_value: codeValue,
        total_deposit_month1: totalDepositMonth1,
        requirement: require('../config/vipConfig').VIP_DEPOSIT_REQUIREMENTS[vipRange],
        status: 'approved',
        message: depositResult.message || 'Xét duyệt và cộng tiền thành công',
        admin_username: 'system',
        deposit_api_response: depositResult.data,
        user_info: userInfo
      });
    } catch (dbError) {
      console.error('Error saving history to database:', dbError);
    }

    // Xử lý message thành công
    let successMessage = 'Chúc mừng bạn đã nhận thưởng thành công';
    if (depositResult.message && depositResult.message.includes('Hoàn thành toàn bộ quy trình LOC04')) {
      successMessage = 'Chúc mừng bạn đã nhận thưởng thành công';
    } else if (depositResult.message) {
      successMessage = depositResult.message;
    }

    return res.json({
      success: true,
      approved: true,
      message: successMessage,
      data: {
        username: username,
        userInfo: userInfo,
        vipLevel: vipLevel,
        vipRange: vipRange,
        codeValue: codeValue, // Giá trị code cố định theo VIP level
        totalDepositMonth1: totalDepositMonth1,
        depositResult: depositResult.data
      }
    });

  } catch (error) {
    console.error('Error in auto-approve:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xét duyệt',
      error: error.message
    });
  }
});

/**
 * API lấy thông tin VIP range
 * GET /api/admin/vip-info/:vipLevel
 */
router.get('/vip-info/:vipLevel', (req, res) => {
  try {
    const vipLevel = parseInt(req.params.vipLevel);
    
    if (isNaN(vipLevel)) {
      return res.status(400).json({
        success: false,
        message: 'VIP level không hợp lệ'
      });
    }

    const vipRange = getVIPRange(vipLevel);
    
    if (!vipRange) {
      return res.status(400).json({
        success: false,
        message: `VIP level ${vipLevel} không hợp lệ. Phải từ 1-60`
      });
    }

    const codeValue = require('../config/vipConfig').getCodeValue(vipLevel);
    const depositRequirement = require('../config/vipConfig').VIP_DEPOSIT_REQUIREMENTS[vipRange];

    return res.json({
      success: true,
      data: {
        vipLevel: vipLevel,
        vipRange: vipRange,
        codeValue: codeValue,
        depositRequirement: depositRequirement
      }
    });

  } catch (error) {
    console.error('Error in vip-info:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

/**
 * API lấy tất cả thông tin VIP
 * GET /api/admin/vip-info
 */
router.get('/vip-info', (req, res) => {
  try {
    const { VIP_CODE_VALUES, VIP_DEPOSIT_REQUIREMENTS, getVIPRange } = require('../config/vipConfig');
    
    // Tạo danh sách thông tin VIP từ VIP_CODE_VALUES
    const allVIPInfo = [];
    for (let level = 1; level <= 60; level++) {
      const vipRange = getVIPRange(level);
      const codeValue = VIP_CODE_VALUES[level];
      const depositRequirement = VIP_DEPOSIT_REQUIREMENTS[vipRange];
      
      // Chỉ thêm vào danh sách nếu chưa có vipRange này
      if (!allVIPInfo.find(item => item.vipRange === vipRange)) {
        allVIPInfo.push({
          vipRange: vipRange,
          codeValue: codeValue, // Giá trị code của level đầu tiên trong range
          depositRequirement: depositRequirement
        });
      }
    }

    return res.json({
      success: true,
      data: allVIPInfo
    });

  } catch (error) {
    console.error('Error in vip-info:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

module.exports = router;

