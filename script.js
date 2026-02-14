// Countdown Timer - Countdown to 17/02/2026 00:00:00
function updateCountdown() {
    // Set target date: 17 February 2026, 00:00:00
    const targetDate = new Date('2026-02-17T00:00:00');
    
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;
    
    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        
        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    } else {
        // Countdown finished
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
    }
}

// Update countdown immediately and then every minute
document.addEventListener('DOMContentLoaded', function() {
    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute
});

// Participant count - increase by 5 every second
document.addEventListener('DOMContentLoaded', function() {
    const participantCount = document.getElementById('participant-count');
    if (participantCount) {
        let currentCount = 15343;
        participantCount.textContent = currentCount.toLocaleString('vi-VN');
        
        // Increase by 5 every second
        setInterval(function() {
            currentCount += 5;
            participantCount.textContent = currentCount.toLocaleString('vi-VN');
        }, 1000);
    }
});

// Add hover effects and animations
document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const modalClose = document.querySelector('.modal-close');
    
    // Open modal when clicking rules button
    if (rulesBtn && rulesModal) {
        rulesBtn.addEventListener('click', function() {
            rulesModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close modal when clicking close button
    if (modalClose && rulesModal) {
        modalClose.addEventListener('click', function() {
            rulesModal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
    
    // Close modal when clicking outside
    if (rulesModal) {
        rulesModal.addEventListener('click', function(e) {
            if (e.target === rulesModal) {
                rulesModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && rulesModal && rulesModal.classList.contains('show')) {
            rulesModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
    
    
    // Add click animations to buttons
    const buttons = document.querySelectorAll('.sidebar-btn, .nav-diamond');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.input-form');
    const submitBtn = form ? form.querySelector('.submit-btn') : null;
    
    // Sự kiện mở từ 00:00 ngày 15/02/2026 (giờ VN = UTC+7)
    const EVENT_START = new Date('2026-02-14T17:00:00.000Z').getTime(); // 00:00 15/02/2026 VN

    function updateSubmitButtonState() {
        if (!submitBtn) return;
        if (Date.now() < EVENT_START) {
            submitBtn.disabled = true;
            submitBtn.title = 'Sự kiện chưa bắt đầu. Mở từ 00h ngày 15/02/2026.';
            if (!submitBtn.dataset.originalText) submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sự kiện chưa bắt đầu';
        } else {
            submitBtn.disabled = false;
            submitBtn.title = '';
            if (submitBtn.dataset.originalText) submitBtn.textContent = submitBtn.dataset.originalText;
        }
    }
    updateSubmitButtonState();
    setInterval(updateSubmitButtonState, 60000); // Cập nhật mỗi phút

    // Form submit handler
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (Date.now() < EVENT_START) {
                showNotification('Sự kiện chưa bắt đầu. Vui lòng quay lại từ 00h ngày 15/02/2026.', 'error');
                return;
            }
            
            const username = document.getElementById('username').value.trim();
            
            if (!username) {
                showNotification('Vui lòng nhập tên tài khoản!');
                return;
            }
            
            // Check Cloudflare Turnstile token
            const turnstileResponse = document.querySelector('input[name="cf-turnstile-response"]');
            if (!turnstileResponse || !turnstileResponse.value) {
                showNotification('Vui lòng hoàn thành xác thực!');
                return;
            }
            
            // Disable submit button and show loading
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang xử lý...';
            }
            
            try {
                // Send API request - convert username to lowercase
                const response = await fetch('https://apiloc04.dklive6886.dev/api/admin/auto-approve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username.toLowerCase(),
                        year: 2026
                    })
                });
                
                const data = await response.json();
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Xác nhận';
                }
                
                // Handle response
                if (data.success && data.approved) {
                    // Success - Change message and show success icon
                    let successMessage = 'Chúc mừng bạn đã nhận thưởng thành công!';
                    if (data.message && data.message.includes('LOC04')) {
                        successMessage = 'Chúc mừng bạn đã nhận thưởng thành công!';
                    }
                    showNotification(successMessage, 'success');
                    // Reset form
                    form.reset();
                    // Reset Turnstile
                    if (window.turnstile) {
                        window.turnstile.reset();
                    }
                } else {
                    // Failed
                    let errorMessage = data.message || 'Có lỗi xảy ra!';
                    if (data.existingRecord) {
                        errorMessage += `\n\nThông tin đã tồn tại:\n- Ngày tạo: ${new Date(data.existingRecord.created_at).toLocaleString('vi-VN')}\n- Mã: ${data.existingRecord.code_value}\n- VIP Level: ${data.existingRecord.vip_level}`;
                    }
                    showNotification(errorMessage, 'error');
                }
            } catch (error) {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Xác nhận';
                }
                
                console.error('Error:', error);
                showNotification('Có lỗi xảy ra khi kết nối đến server. Vui lòng thử lại sau!', 'error');
            }
        });
    }
});

// Notification Popup Function
function showNotification(message, type = 'error') {
    const popup = document.getElementById('notification-popup');
    const messageEl = document.getElementById('notification-message');
    const iconEl = document.querySelector('.notification-icon');
    const closeBtn = document.getElementById('notification-close');
    
    if (popup && messageEl) {
        messageEl.textContent = message;
        
        // Update icon based on type
        if (iconEl) {
            if (type === 'success') {
                iconEl.textContent = '✓';
                iconEl.classList.add('success-icon');
                iconEl.classList.remove('error-icon');
            } else {
                iconEl.textContent = '!';
                iconEl.classList.add('error-icon');
                iconEl.classList.remove('success-icon');
            }
        }
        
        popup.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Close button handler
        if (closeBtn) {
            closeBtn.onclick = function() {
                popup.classList.remove('show');
                document.body.style.overflow = '';
            };
        }
        
        // Close when clicking outside
        popup.onclick = function(e) {
            if (e.target === popup) {
                popup.classList.remove('show');
                document.body.style.overflow = '';
            }
        };
        
        // Close with ESC key
        const escHandler = function(e) {
            if (e.key === 'Escape' && popup.classList.contains('show')) {
                popup.classList.remove('show');
                document.body.style.overflow = '';
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
}

// Add ripple effect styles dynamically
const style = document.createElement('style');
style.textContent = `
    .sidebar-btn, .nav-diamond {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

