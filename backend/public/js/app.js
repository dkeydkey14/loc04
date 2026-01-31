// API Base URL - sẽ được load từ config
let API_BASE = window.location.origin; // Default
let currentToken = localStorage.getItem('admin_token');
let currentPage = 1;
let currentLimit = 20;

// Load config từ server
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.apiBase) {
                API_BASE = data.data.apiBase;
                console.log('API Base URL:', API_BASE);
            }
        }
    } catch (error) {
        console.warn('Không thể load config từ server, sử dụng default:', error);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    checkAuth();
    setupEventListeners();
});

// Check Authentication
function checkAuth() {
    if (currentToken) {
        verifyToken();
    } else {
        showLoginPage();
    }
}

// Verify Token
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showMainApp(data.data.admin);
            } else {
                showLoginPage();
            }
        } else {
            showLoginPage();
        }
    } catch (error) {
        console.error('Verify error:', error);
        showLoginPage();
    }
}

// Show Login Page
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Show Main App
function showMainApp(admin) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    if (admin) {
        document.getElementById('adminName').textContent = admin.full_name || admin.username;
        document.getElementById('adminRole').textContent = admin.role === 'super_admin' ? 'Super Admin' : 'Admin';
    }
    
    showPage('dashboard');
}

// Setup Event Listeners
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Approve Form
    document.getElementById('approveForm').addEventListener('submit', handleApprove);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('loginError');
    errorDiv.style.display = 'none';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.data.token;
            localStorage.setItem('admin_token', currentToken);
            showMainApp(data.data.admin);
        } else {
            errorDiv.textContent = data.message || 'Đăng nhập thất bại';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Lỗi kết nối đến server';
        errorDiv.style.display = 'block';
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('admin_token');
    currentToken = null;
    showLoginPage();
}

// Show Page
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`${pageName}Page`).classList.remove('hidden');
    
    // Add active to nav item
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Load page data
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'history') {
        loadHistory();
    } else if (pageName === 'stats') {
        loadStats();
    }
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/management/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                updateDashboardStats(data.data.overview);
                updateVIPStats(data.data.byVIP);
            }
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Update Dashboard Stats
function updateDashboardStats(stats) {
    document.getElementById('totalRecords').textContent = stats.total_records || 0;
    document.getElementById('approvedCount').textContent = stats.approved_count || 0;
    document.getElementById('rejectedCount').textContent = stats.rejected_count || 0;
    document.getElementById('failedCount').textContent = stats.failed_count || 0;
    document.getElementById('totalCodeValue').textContent = formatNumber(stats.total_code_value || 0);
    document.getElementById('avgCodeValue').textContent = formatNumber(stats.avg_code_value || 0);
}

// Update VIP Stats
function updateVIPStats(vipStats) {
    const chartContainer = document.getElementById('vipStatsChart');
    
    if (vipStats.length === 0) {
        chartContainer.innerHTML = '<p class="text-center">Không có dữ liệu</p>';
        return;
    }
    
    let html = '<div class="vip-stats-list">';
    vipStats.forEach(stat => {
        html += `
            <div class="vip-stat-item">
                <div class="vip-stat-header">
                    <span class="vip-level">VIP${stat.vip_level}</span>
                    <span class="vip-range">${stat.vip_range}</span>
                </div>
                <div class="vip-stat-details">
                    <div>Tổng: ${stat.count}</div>
                    <div>Thành công: ${stat.approved_count}</div>
                    <div>Tổng giá trị: ${formatNumber(stat.total_code_value || 0)}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    chartContainer.innerHTML = html;
}

// Handle Approve
async function handleApprove(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('approveError');
    const successDiv = document.getElementById('approveSuccess');
    const resultDiv = document.getElementById('approveResult');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    resultDiv.classList.add('hidden');
    
    const username = document.getElementById('approveUsername').value;
    const year = document.getElementById('approveYear').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/auto-approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ username, year: parseInt(year) })
        });
        
        const data = await response.json();
        
        if (data.success && data.approved) {
            // Hiển thị message với icon tích xanh
            const message = data.message || 'Chúc mừng bạn đã nhận thưởng thành công';
            successDiv.innerHTML = `<span style="color: #10b981; font-size: 1.2rem; margin-right: 0.5rem;">✅</span> ${message}`;
            successDiv.style.display = 'flex';
            
            resultDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-size: 4rem; color: #10b981; margin-bottom: 0.5rem;">✅</div>
                    <h3 style="color: #10b981; margin: 0;">${message}</h3>
                </div>
                <div style="margin-top: 1.5rem;">
                    <h4>Chi tiết:</h4>
                    <pre>${JSON.stringify(data.data, null, 2)}</pre>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            
            // Reset form
            document.getElementById('approveForm').reset();
            document.getElementById('approveYear').value = 2026;
            
            // Reload dashboard
            setTimeout(() => loadDashboard(), 1000);
        } else {
            errorDiv.textContent = data.message || 'Cộng điểm thất bại';
            errorDiv.style.display = 'block';
            
            if (data.data) {
                resultDiv.innerHTML = `
                    <h3>Chi tiết:</h3>
                    <pre>${JSON.stringify(data.data, null, 2)}</pre>
                `;
                resultDiv.classList.remove('hidden');
            }
        }
    } catch (error) {
        errorDiv.textContent = 'Lỗi kết nối đến server';
        errorDiv.style.display = 'block';
    }
}

// Load History
async function loadHistory(page = 1) {
    currentPage = page;
    
    const username = document.getElementById('filterUsername').value;
    const status = document.getElementById('filterStatus').value;
    const vipLevel = document.getElementById('filterVIP').value;
    
    let url = `${API_BASE}/api/admin/management/history?page=${page}&limit=${currentLimit}`;
    if (username) url += `&username=${encodeURIComponent(username)}`;
    if (status) url += `&status=${status}`;
    if (vipLevel) url += `&vip_level=${vipLevel}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayHistory(data.data, data.pagination);
            }
        }
    } catch (error) {
        console.error('Load history error:', error);
    }
}

// Display History
function displayHistory(records, pagination) {
    const tbody = document.getElementById('historyTableBody');
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map(record => `
        <tr>
            <td>${record.id}</td>
            <td>${record.username}</td>
            <td>VIP${record.vip_level}</td>
            <td>${formatNumber(record.code_value)}</td>
            <td>${formatNumber(record.total_deposit_month1)}</td>
            <td><span class="status-badge status-${record.status}">${getStatusText(record.status)}</span></td>
            <td>${record.admin_username || '-'}</td>
            <td>${formatDateTime(record.created_at)}</td>
            <td>
                <button class="btn btn-secondary" onclick="showDetail(${record.id})">Chi tiết</button>
                ${record.status === 'approved' ? `<button class="btn btn-danger" onclick="deleteHistory(${record.id}, '${record.username}')" style="margin-left: 0.5rem;">Xóa</button>` : ''}
            </td>
        </tr>
    `).join('');
    
    // Update pagination
    updatePagination(pagination);
}

// Update Pagination
function updatePagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button ${pagination.page === 1 ? 'disabled' : ''} onclick="loadHistory(${pagination.page - 1})">‹ Trước</button>`;
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === 1 || i === pagination.totalPages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
            html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="loadHistory(${i})">${i}</button>`;
        } else if (i === pagination.page - 3 || i === pagination.page + 3) {
            html += `<span>...</span>`;
        }
    }
    
    // Next button
    html += `<button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="loadHistory(${pagination.page + 1})">Sau ›</button>`;
    
    html += `<span style="margin-left: 1rem;">Trang ${pagination.page} / ${pagination.totalPages} (${pagination.total} records)</span>`;
    
    paginationDiv.innerHTML = html;
}

// Reset Filters
function resetFilters() {
    document.getElementById('filterUsername').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterVIP').value = '';
    loadHistory(1);
}

// Load Stats
async function loadStats() {
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;
    
    let url = `${API_BASE}/api/admin/management/stats`;
    if (startDate) url += `?startDate=${startDate}`;
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayStats(data.data);
            }
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Display Stats
function displayStats(stats) {
    const contentDiv = document.getElementById('statsContent');
    
    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-label">Tổng Giao Dịch</div>
                    <div class="stat-value">${stats.overview.total_records || 0}</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-label">Thành Công</div>
                    <div class="stat-value">${stats.overview.approved_count || 0}</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">❌</div>
                <div class="stat-content">
                    <div class="stat-label">Từ Chối</div>
                    <div class="stat-value">${stats.overview.rejected_count || 0}</div>
                </div>
            </div>
            <div class="stat-card danger">
                <div class="stat-icon">⚠️</div>
                <div class="stat-content">
                    <div class="stat-label">Thất Bại</div>
                    <div class="stat-value">${stats.overview.failed_count || 0}</div>
                </div>
            </div>
        </div>
        
        <div class="chart-section">
            <h2>Thống Kê Theo VIP Level</h2>
            <div class="chart-container">
                <div class="vip-stats-list">
    `;
    
    stats.byVIP.forEach(stat => {
        html += `
            <div class="vip-stat-item">
                <div class="vip-stat-header">
                    <span class="vip-level">VIP${stat.vip_level}</span>
                    <span class="vip-range">${stat.vip_range}</span>
                </div>
                <div class="vip-stat-details">
                    <div>Tổng: ${stat.count}</div>
                    <div>Thành công: ${stat.approved_count}</div>
                    <div>Tổng giá trị: ${formatNumber(stat.total_code_value || 0)}</div>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    contentDiv.innerHTML = html;
}

// Show Detail
async function showDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/management/history/${id}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const modal = document.getElementById('detailModal');
                const modalBody = document.getElementById('detailModalBody');
                
                modalBody.innerHTML = `
                    <div class="detail-section">
                        <h3>Thông tin cơ bản</h3>
                        <p><strong>ID:</strong> ${data.data.id}</p>
                        <p><strong>Username:</strong> ${data.data.username}</p>
                        <p><strong>VIP Level:</strong> VIP${data.data.vip_level} (${data.data.vip_range})</p>
                        <p><strong>Code Value:</strong> ${formatNumber(data.data.code_value)}</p>
                        <p><strong>Tổng nạp tháng 1:</strong> ${formatNumber(data.data.total_deposit_month1)}</p>
                        <p><strong>Yêu cầu:</strong> ${formatNumber(data.data.requirement || 0)}</p>
                        <p><strong>Trạng thái:</strong> <span class="status-badge status-${data.data.status}">${getStatusText(data.data.status)}</span></p>
                        <p><strong>Admin:</strong> ${data.data.admin_username || '-'}</p>
                        <p><strong>Thời gian:</strong> ${formatDateTime(data.data.created_at)}</p>
                    </div>
                    ${data.data.user_info ? `
                    <div class="detail-section">
                        <h3>Thông tin User</h3>
                        <pre>${JSON.stringify(data.data.user_info, null, 2)}</pre>
                    </div>
                    ` : ''}
                    ${data.data.deposit_api_response ? `
                    <div class="detail-section">
                        <h3>Response từ API</h3>
                        <pre>${JSON.stringify(data.data.deposit_api_response, null, 2)}</pre>
                    </div>
                    ` : ''}
                `;
                
                modal.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Show detail error:', error);
    }
}

// Close Modal
function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Utility Functions
function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
}

function getStatusText(status) {
    const statusMap = {
        'approved': 'Thành công',
        'rejected': 'Từ chối',
        'failed': 'Thất bại'
    };
    return statusMap[status] || status;
}

// Delete History
async function deleteHistory(id, username) {
    if (!confirm(`Bạn có chắc muốn xóa lịch sử này?\nTài khoản "${username}" sẽ có thể nhận thưởng lại sau khi xóa.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/management/history/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                alert('Xóa lịch sử thành công!');
                loadHistory(currentPage); // Reload danh sách
            } else {
                alert('Xóa thất bại: ' + (data.message || 'Lỗi không xác định'));
            }
        } else {
            const data = await response.json();
            alert('Xóa thất bại: ' + (data.message || 'Lỗi server'));
        }
    } catch (error) {
        console.error('Delete history error:', error);
        alert('Lỗi kết nối đến server');
    }
}

// Close modal when clicking outside
document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        closeModal();
    }
});

