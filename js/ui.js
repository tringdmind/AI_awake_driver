/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/ui.js
 * Chức năng: Điều khiển giao diện (UI), cập nhật số liệu, hiển thị cảnh báo
 * ==========================================================================
 */

window.UIController = (function() {
    let dom = {};
    let errorTimeout = null;

    /**
     * Khởi tạo và lưu cache các phần tử DOM
     */
    function init() {
        dom = {
            video: document.getElementById('video'),
            canvas: document.getElementById('canvas'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('errorMessage'),
            alertDrowsy: document.getElementById('alertDrowsy'),
            alertHands: document.getElementById('alertHands'),
            earValue: document.getElementById('earValue'),
            statusText: document.getElementById('statusText'),
            fpsValue: document.getElementById('fpsValue'),
            drowsyFramesCount: document.getElementById('drowsyFramesCount'),
            handOffFramesCount: document.getElementById('handOffFramesCount'),
            drowsyAlerts: document.getElementById('drowsyAlerts'),
            handAlerts: document.getElementById('handAlerts'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            earThreshold: document.getElementById('earThreshold'),
            drowsyFrames: document.getElementById('drowsyFrames'),
            handFrames: document.getElementById('handFrames')
        };
    }

    /**
     * Hiển thị thông báo lỗi
     * @param {string} message - Nội dung lỗi
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    function showError(message, duration = 5000) {
        if (!dom.errorMessage) return;
        
        if (errorTimeout) {
            clearTimeout(errorTimeout);
        }

        dom.errorMessage.textContent = '❌ ' + message;
        dom.errorMessage.style.display = 'block';

        errorTimeout = setTimeout(() => {
            dom.errorMessage.style.display = 'none';
        }, duration);
    }

    /**
     * Hiển thị hộp loading
     * @param {string} htmlMessage - Nội dung html hoặc text
     */
    function showLoading(htmlMessage) {
        if (!dom.loading) return;
        if (htmlMessage) {
            dom.loading.innerHTML = `<div>${htmlMessage}</div>`;
        }
        dom.loading.style.display = 'block';
    }

    /**
     * Ẩn hộp loading
     */
    function hideLoading() {
        if (dom.loading) {
            dom.loading.style.display = 'none';
        }
    }

    /**
     * Cập nhật trạng thái các nút bấm (Bắt đầu / Dừng lại)
     * @param {boolean} isRunning 
     */
    function setRunningState(isRunning) {
        if (dom.startBtn) dom.startBtn.disabled = isRunning;
        if (dom.stopBtn) dom.stopBtn.disabled = !isRunning;
    }

    /**
     * Cập nhật giá trị EAR hiển thị
     * @param {number} ear 
     */
    function updateEAR(ear) {
        if (dom.earValue) {
            dom.earValue.textContent = Number(ear).toFixed(2);
        }
    }

    /**
     * Cập nhật dòng chữ trạng thái hoạt động
     * @param {string} text 
     */
    function updateStatus(text) {
        if (dom.statusText) {
            dom.statusText.textContent = text;
        }
    }

    /**
     * Cập nhật FPS hiển thị
     * @param {number} fps 
     */
    function updateFPS(fps) {
        if (dom.fpsValue) {
            dom.fpsValue.textContent = fps;
        }
    }

    /**
     * Cập nhật bảng 4 ô thông số thống kê
     * @param {Object} stats 
     */
    function updateStats(stats = {}) {
        if (stats.drowsyFrames !== undefined && dom.drowsyFramesCount) {
            dom.drowsyFramesCount.textContent = stats.drowsyFrames;
        }
        if (stats.handOffFrames !== undefined && dom.handOffFramesCount) {
            dom.handOffFramesCount.textContent = stats.handOffFrames;
        }
        if (stats.drowsyAlerts !== undefined && dom.drowsyAlerts) {
            dom.drowsyAlerts.textContent = stats.drowsyAlerts;
        }
        if (stats.handAlerts !== undefined && dom.handAlerts) {
            dom.handAlerts.textContent = stats.handAlerts;
        }
    }

    /**
     * Bật/tắt banner cảnh báo ngủ gật
     * @param {boolean} visible 
     */
    function setDrowsyAlert(visible) {
        if (dom.alertDrowsy) {
            dom.alertDrowsy.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Bật/tắt banner cảnh báo tay rời vô lăng
     * @param {boolean} visible 
     */
    function setHandAlert(visible) {
        if (dom.alertHands) {
            dom.alertHands.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Đặt lại toàn bộ giao diện về trạng thái ban đầu
     */
    function resetUI() {
        setDrowsyAlert(false);
        setHandAlert(false);
        updateStatus('Đã dừng');
        updateEAR(0);
        updateFPS(0);
        updateStats({
            drowsyFrames: 0,
            handOffFrames: 0
        });
        showLoading('📸 Hãy cho phép sử dụng camera để bắt đầu giám sát');
    }

    /**
     * Thiết lập và lắng nghe các thay đổi trong cài đặt (Settings Panel)
     * @param {Object} currentConfig - Đối tượng cấu hình hiện tại
     * @param {Function} onConfigChange - Callback khi có cài đặt thay đổi
     */
    function setupSettingsListeners(currentConfig, onConfigChange) {
        // Cài đặt âm lượng
        if (dom.volumeSlider) {
            dom.volumeSlider.addEventListener('input', (e) => {
                const volPercent = parseInt(e.target.value, 10);
                if (dom.volumeValue) {
                    dom.volumeValue.textContent = volPercent + '%';
                }
                if (onConfigChange) {
                    onConfigChange('VOLUME', volPercent / 100);
                }
            });
        }

        // Cài đặt ngưỡng EAR
        if (dom.earThreshold) {
            dom.earThreshold.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0.1 && value <= 0.4) {
                    if (onConfigChange) onConfigChange('EAR_THRESHOLD', value);
                }
            });
        }

        // Cài đặt số frame nhắm mắt
        if (dom.drowsyFrames) {
            dom.drowsyFrames.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 5 && value <= 60) {
                    if (onConfigChange) onConfigChange('CONSECUTIVE_FRAMES', value);
                }
            });
        }

        // Cài đặt số frame tay rời
        if (dom.handFrames) {
            dom.handFrames.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 10 && value <= 90) {
                    if (onConfigChange) onConfigChange('HAND_OFF_FRAMES', value);
                }
            });
        }
    }

    /**
     * Đọc các giá trị hiện thời từ form cài đặt
     */
    function getSettingsValues() {
        return {
            EAR_THRESHOLD: parseFloat(dom.earThreshold.value) || 0.25,
            CONSECUTIVE_FRAMES: parseInt(dom.drowsyFrames.value, 10) || 20,
            HAND_OFF_FRAMES: parseInt(dom.handFrames.value, 10) || 30,
            VOLUME: (parseInt(dom.volumeSlider.value, 10) || 100) / 100
        };
    }

    return {
        init,
        dom,
        showError,
        showLoading,
        hideLoading,
        setRunningState,
        updateEAR,
        updateStatus,
        updateFPS,
        updateStats,
        setDrowsyAlert,
        setHandAlert,
        resetUI,
        setupSettingsListeners,
        getSettingsValues
    };
})();
