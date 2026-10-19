/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/app.js
 * Chức năng: Điều phối chính (Main Application Controller), quản lý Camera & vòng đời
 * ==========================================================================
 */

(function() {
    'use strict';

    let camera = null;
    let isRunning = false;

    /**
     * Bắt đầu phiên giám sát tài xế
     */
    async function startMonitoring() {
        try {
            isRunning = true;
            window.UIController.setRunningState(true);
            window.UIController.showLoading('Đang kích hoạt camera và tải mô hình AI...');

            // 1. Cập nhật cấu hình hiện tại từ bảng điều khiển Settings
            const currentSettings = window.UIController.getSettingsValues();
            window.APP_CONFIG.EAR_THRESHOLD = currentSettings.EAR_THRESHOLD;
            window.APP_CONFIG.CONSECUTIVE_FRAMES = currentSettings.CONSECUTIVE_FRAMES;
            window.APP_CONFIG.HAND_OFF_FRAMES = currentSettings.HAND_OFF_FRAMES;
            window.APP_CONFIG.VOLUME = currentSettings.VOLUME;

            window.AudioManager.setVolume(window.APP_CONFIG.VOLUME);
            window.AudioManager.init();

            // 2. Khởi tạo động cơ nhận diện
            const dom = window.UIController.dom;
            window.DetectionEngine.init(
                window.APP_CONFIG,
                { video: dom.video, canvas: dom.canvas },
                {
                    onDrowsyAlert: (count) => {
                        window.UIController.setDrowsyAlert(true);
                        window.UIController.updateStats({ drowsyAlerts: count });
                        window.AudioManager.playAlert(
                            window.APP_CONFIG.DROWSY_SOUND.FREQ,
                            window.APP_CONFIG.DROWSY_SOUND.DURATION
                        );
                    },
                    onDrowsyClear: () => {
                        window.UIController.setDrowsyAlert(false);
                    },
                    onHandAlert: (count) => {
                        window.UIController.setHandAlert(true);
                        window.UIController.updateStats({ handAlerts: count });
                        window.AudioManager.playAlert(
                            window.APP_CONFIG.HAND_SOUND.FREQ,
                            window.APP_CONFIG.HAND_SOUND.DURATION
                        );
                    },
                    onHandClear: () => {
                        window.UIController.setHandAlert(false);
                    },
                    onEARUpdate: (ear) => {
                        window.UIController.updateEAR(ear);
                    },
                    onStatusUpdate: (text) => {
                        window.UIController.updateStatus(text);
                    },
                    onStatsUpdate: (stats) => {
                        window.UIController.updateStats(stats);
                    },
                    onFPSUpdate: (fps) => {
                        window.UIController.updateFPS(fps);
                    },
                    onError: (msg) => {
                        window.UIController.showError(msg);
                    }
                }
            );

            // 3. Khởi động Camera MediaPipe
            if (!camera) {
                camera = new Camera(dom.video, {
                    onFrame: async () => {
                        if (isRunning) {
                            await window.DetectionEngine.processFrame(dom.video);
                        }
                    },
                    width: window.APP_CONFIG.CAMERA.WIDTH,
                    height: window.APP_CONFIG.CAMERA.HEIGHT
                });

                await camera.start();
            }

            window.DetectionEngine.start();
            window.UIController.hideLoading();
            window.UIController.updateStatus('Đang theo dõi...');
        } catch (e) {
            isRunning = false;
            window.UIController.setRunningState(false);
            window.UIController.hideLoading();
            window.UIController.showError('Lỗi khởi động hoặc từ chối cấp quyền sử dụng camera: ' + e.message);
            console.error('Lỗi khi bắt đầu giám sát:', e);
        }
    }

    /**
     * Dừng phiên giám sát và giải phóng tài nguyên
     */
    function stopMonitoring() {
        isRunning = false;
        window.UIController.setRunningState(false);

        // 1. Dừng động cơ nhận diện
        window.DetectionEngine.stop();

        // 2. Dừng Camera MediaPipe
        if (camera) {
            try {
                camera.stop();
            } catch (err) {
                console.warn('Lỗi khi dừng camera:', err);
            }
            camera = null;
        }

        // 3. Giải phóng stream từ webcam
        const video = window.UIController.dom.video;
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }

        // 4. Reset giao diện
        window.UIController.resetUI();
    }

    /**
     * Xử lý khi người dùng điều chỉnh thông số trong bảng cài đặt
     */
    function handleConfigChange(key, value) {
        if (key === 'VOLUME') {
            window.APP_CONFIG.VOLUME = value;
            window.AudioManager.setVolume(value);
        } else if (key === 'EAR_THRESHOLD') {
            window.APP_CONFIG.EAR_THRESHOLD = value;
            window.DetectionEngine.updateConfig({ EAR_THRESHOLD: value });
        } else if (key === 'CONSECUTIVE_FRAMES') {
            window.APP_CONFIG.CONSECUTIVE_FRAMES = value;
            window.DetectionEngine.updateConfig({ CONSECUTIVE_FRAMES: value });
        } else if (key === 'HAND_OFF_FRAMES') {
            window.APP_CONFIG.HAND_OFF_FRAMES = value;
            window.DetectionEngine.updateConfig({ HAND_OFF_FRAMES: value });
        }
    }

    /**
     * Khởi tạo toàn bộ ứng dụng khi DOM sẵn sàng
     */
    function initApp() {
        // Khởi tạo UI
        window.UIController.init();

        // Gắn sự kiện các nút chính
        if (window.UIController.dom.startBtn) {
            window.UIController.dom.startBtn.addEventListener('click', startMonitoring);
        }

        if (window.UIController.dom.stopBtn) {
            window.UIController.dom.stopBtn.addEventListener('click', stopMonitoring);
        }

        // Khởi tạo lắng nghe cài đặt (settings)
        window.UIController.setupSettingsListeners(window.APP_CONFIG, handleConfigChange);

        console.log('🚗 Hệ thống cảnh báo tài xế - Trường THPT Hùng Vương đã khởi tạo thành công.');
    }

    // Lắng nghe sự kiện load trang
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
