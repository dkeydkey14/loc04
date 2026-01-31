const axios = require('axios');

// Cấu hình API endpoints
const API_CONFIG = {
  USER_INFO_API: process.env.USER_INFO_API_URL || 'https://loc04.dklive6886.dev',
  DEPOSIT_API: process.env.DEPOSIT_API_URL || 'https://apidiem01.newpei.ink'
};

/**
 * Lấy thông tin user và tổng nạp tháng 1
 * @param {string} username - Tên người dùng
 * @param {number} year - Năm (mặc định 2026)
 * @returns {Promise<Object>} Thông tin user
 */
async function getUserDepositInfo(username, year = 2026) {
  try {
    const url = `${API_CONFIG.USER_INFO_API}/api/user/${username}/deposit/month/1`;
    const response = await axios.get(url, {
      params: { year }
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data
      };
    }

    return {
      success: false,
      message: response.data?.message || 'Không lấy được thông tin user'
    };

  } catch (error) {
    console.error('Error fetching user deposit info:', error.message);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Lỗi khi gọi API lấy thông tin user',
        status: error.response.status
      };
    }

    return {
      success: false,
      message: error.message || 'Lỗi kết nối đến API lấy thông tin user'
    };
  }
}

/**
 * Cộng tiền cho user
 * @param {string} userName - Tên người dùng
 * @param {number} amount - Số tiền cộng
 * @returns {Promise<Object>} Kết quả cộng tiền
 */
async function addDeposit(userName, amount) {
  try {
    const url = `${API_CONFIG.DEPOSIT_API}/api/auto-loc04`;
    const apiKey = process.env.DEPOSIT_API_KEY || '6623code_secure_api_key_$%^@!';
    
    const response = await axios.post(url, {
      userName,
      amount
    }, {
      headers: {
        'X-API-KEY': apiKey
      }
    });

    // Kiểm tra response từ API
    if (response.data && response.data.success === true) {
      // Thành công: success: true, message: "Hoàn thành toàn bộ quy trình LOC04"
      return {
        success: true,
        message: response.data.message || 'Cộng tiền thành công',
        data: response.data.data
      };
    } else {
      // Thất bại: success: false, message: "Thêm khuyến mãi thất bại"
      const errorMessage = response.data?.message || 'Thêm khuyến mãi thất bại';
      const errorDetail = response.data?.data?.data?.msg || response.data?.data?.message || errorMessage;
      
      return {
        success: false,
        message: errorMessage,
        errorDetail: errorDetail,
        data: response.data?.data || response.data
      };
    }

  } catch (error) {
    console.error('Error adding deposit:', error.message);
    
    if (error.response) {
      // API trả về response nhưng có lỗi HTTP
      const responseData = error.response.data;
      
      if (responseData && responseData.success === false) {
        // API trả về success: false trong response
        const errorMessage = responseData.message || 'Thêm khuyến mãi thất bại';
        const errorDetail = responseData.data?.data?.msg || responseData.data?.message || errorMessage;
        
        return {
          success: false,
          message: errorMessage,
          errorDetail: errorDetail,
          data: responseData.data || responseData
        };
      }
      
      return {
        success: false,
        message: error.response.data?.message || 'Lỗi khi gọi API cộng tiền',
        status: error.response.status,
        data: error.response.data
      };
    }

    return {
      success: false,
      message: error.message || 'Lỗi kết nối đến API cộng tiền'
    };
  }
}

module.exports = {
  getUserDepositInfo,
  addDeposit,
  API_CONFIG
};

