// Giá trị code cố định cho từng VIP level
const VIP_CODE_VALUES = {
  1: 28,
  2: 38,
  3: 48,
  4: 58,
  5: 68,
  6: 58,
  7: 76,
  8: 93,
  9: 111,
  10: 128,
  11: 188,
  12: 266,
  13: 344,
  14: 422,
  15: 500,
  16: 578,
  17: 656,
  18: 734,
  19: 811,
  20: 888,
  21: 688,
  22: 755,
  23: 822,
  24: 888,
  25: 955,
  26: 1022,
  27: 1088,
  28: 1155,
  29: 1222,
  30: 1288,
  31: 1688,
  32: 1822,
  33: 1955,
  34: 2088,
  35: 2222,
  36: 2355,
  37: 2488,
  38: 2622,
  39: 2755,
  40: 2888,
  41: 2888,
  42: 3111,
  43: 3333,
  44: 3555,
  45: 3777,
  46: 4000,
  47: 4222,
  48: 4444,
  49: 4666,
  50: 4888,
  51: 3888,
  52: 4444,
  53: 5000,
  54: 5555,
  55: 6111,
  56: 6666,
  57: 7222,
  58: 7777,
  59: 8333,
  60: 8888
};

// Điều kiện nhận thưởng: Tổng nạp tháng 1 TỐI THIỂU theo cấp VIP
// Giá trị này là mức tối thiểu, user cần nạp TỪ số tiền này TRỞ LÊN
const VIP_DEPOSIT_REQUIREMENTS = {
  'VIP1-5': 3000,        // Tối thiểu 3,000
  'VIP6-10': 30000,      // Tối thiểu 30,000
  'VIP11-20': 50000,     // Tối thiểu 50,000
  'VIP21-30': 100000,    // Tối thiểu 100,000
  'VIP31-40': 300000,    // Tối thiểu 300,000
  'VIP41-50': 500000,    // Tối thiểu 500,000
  'VIP51-60': null       // Không có yêu cầu tổng nạp
};

// Hàm lấy VIP range từ VIP level
function getVIPRange(vipLevel) {
  if (vipLevel >= 1 && vipLevel <= 5) return 'VIP1-5';
  if (vipLevel >= 6 && vipLevel <= 10) return 'VIP6-10';
  if (vipLevel >= 11 && vipLevel <= 20) return 'VIP11-20';
  if (vipLevel >= 21 && vipLevel <= 30) return 'VIP21-30';
  if (vipLevel >= 31 && vipLevel <= 40) return 'VIP31-40';
  if (vipLevel >= 41 && vipLevel <= 50) return 'VIP41-50';
  if (vipLevel >= 51 && vipLevel <= 60) return 'VIP51-60';
  return null;
}

// Hàm lấy giá trị code cố định theo VIP level
function getCodeValue(vipLevel) {
  if (vipLevel < 1 || vipLevel > 60) return null;
  return VIP_CODE_VALUES[vipLevel] || null;
}

// Hàm sinh giá trị code (giữ lại để tương thích, nhưng giờ dùng getCodeValue)
function generateCodeValue(vipLevel) {
  return getCodeValue(vipLevel);
}

// Hàm kiểm tra điều kiện nhận thưởng
// Kiểm tra xem tổng nạp tháng 1 có đạt mức TỐI THIỂU (từ requirement trở lên) không
function checkDepositRequirement(vipRange, totalDepositMonth1) {
  const requirement = VIP_DEPOSIT_REQUIREMENTS[vipRange];
  
  // Nếu không có yêu cầu (VIP51-60)
  if (requirement === null) return true;
  
  // Kiểm tra tổng nạp có đạt mức tối thiểu không (>= requirement)
  // Ví dụ: requirement = 50000, user nạp 50000 hoặc nhiều hơn => đủ điều kiện
  return totalDepositMonth1 >= requirement;
}

module.exports = {
  VIP_CODE_VALUES,
  VIP_DEPOSIT_REQUIREMENTS,
  getVIPRange,
  getCodeValue,
  generateCodeValue,
  checkDepositRequirement
};

