/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/detector.js
 * Chức năng: Động cơ AI thị giác máy tính - Tích hợp MediaPipe FaceMesh & Hands
 * ==========================================================================
 */

window.DetectionEngine = (function() {
    let faceMesh = null;
    let hands = null;

    let isRunning = false;
    let config = null;

    // Các biến trạng thái đếm khung hình và số lần cảnh báo
    let earCounter = 0;
    let handOffCounter = 0;
    let drowsyAlertCount = 0;
    let handAlertCount = 0;

    let isDrowsyAlerting = false;
    let isHandAlerting = false;

    let faceResults = null;
    let handsResults = null;

    // Canvas & context
    let videoElement = null;
    let canvasElement = null;
    let canvasCtx = null;

    // FPS counter
    const fpsCounter = window.VisionUtils.createFPSCounter();

    // Callbacks để giao tiếp với Controller bên ngoài
    let callbacks = {
        onDrowsyAlert: null,
        onDrowsyClear: null,
        onHandAlert: null,
        onHandClear: null,
        onStatusUpdate: null,
        onEARUpdate: null,
        onStatsUpdate: null,
        onFPSUpdate: null,
        onError: null
    };

    /**
     * Khởi tạo FaceMesh từ MediaPipe
     */
    function initFaceMesh() {
        try {
            faceMesh = new FaceMesh({
                locateFile: config.MEDIAPIPE.FACE_MESH.LOCATE_FILE
            });

            faceMesh.setOptions({
                maxNumFaces: config.MEDIAPIPE.FACE_MESH.MAX_NUM_FACES,
                refineLandmarks: config.MEDIAPIPE.FACE_MESH.REFINE_LANDMARKS,
                minDetectionConfidence: config.MEDIAPIPE.FACE_MESH.MIN_DETECTION_CONFIDENCE,
                minTrackingConfidence: config.MEDIAPIPE.FACE_MESH.MIN_TRACKING_CONFIDENCE
            });

            faceMesh.onResults(handleFaceResults);
        } catch (e) {
            if (callbacks.onError) {
                callbacks.onError('Lỗi khởi tạo MediaPipe Face Mesh: ' + e.message);
            }
            throw e;
        }
    }

    /**
     * Khởi tạo Hands từ MediaPipe
     */
    function initHands() {
        try {
            hands = new Hands({
                locateFile: config.MEDIAPIPE.HANDS.LOCATE_FILE
            });

            hands.setOptions({
                maxNumHands: config.MEDIAPIPE.HANDS.MAX_NUM_HANDS,
                modelComplexity: config.MEDIAPIPE.HANDS.MODEL_COMPLEXITY,
                minDetectionConfidence: config.MEDIAPIPE.HANDS.MIN_DETECTION_CONFIDENCE,
                minTrackingConfidence: config.MEDIAPIPE.HANDS.MIN_TRACKING_CONFIDENCE
            });

            hands.onResults(handleHandsResults);
        } catch (e) {
            if (callbacks.onError) {
                callbacks.onError('Lỗi khởi tạo MediaPipe Hands: ' + e.message);
            }
            throw e;
        }
    }

    /**
     * Xử lý kết quả nhận diện khuôn mặt và tính toán ngủ gật
     */
    function handleFaceResults(results) {
        if (!isRunning) return;
        faceResults = results;

        if (faceResults && faceResults.multiFaceLandmarks && faceResults.multiFaceLandmarks.length > 0) {
            const landmarks = faceResults.multiFaceLandmarks[0];

            // Trích xuất điểm landmark của mắt
            const leftEye = window.VisionUtils.getEyeLandmarks(landmarks, config.LANDMARKS.LEFT_EYE);
            const rightEye = window.VisionUtils.getEyeLandmarks(landmarks, config.LANDMARKS.RIGHT_EYE);

            // Tính EAR cho 2 mắt
            const leftEAR = window.VisionUtils.calculateEAR(leftEye);
            const rightEAR = window.VisionUtils.calculateEAR(rightEye);
            const ear = (leftEAR + rightEAR) / 2.0;

            if (callbacks.onEARUpdate) {
                callbacks.onEARUpdate(ear);
            }

            // Kiểm tra trạng thái nhắm mắt / ngủ gật
            if (ear < config.EAR_THRESHOLD) {
                earCounter++;

                if (earCounter >= config.CONSECUTIVE_FRAMES) {
                    if (!isDrowsyAlerting) {
                        isDrowsyAlerting = true;
                        drowsyAlertCount++;
                        if (callbacks.onDrowsyAlert) {
                            callbacks.onDrowsyAlert(drowsyAlertCount);
                        }
                    }
                }
            } else {
                earCounter = 0;
                if (isDrowsyAlerting) {
                    isDrowsyAlerting = false;
                    if (callbacks.onDrowsyClear) {
                        callbacks.onDrowsyClear();
                    }
                }
            }

            if (callbacks.onStatsUpdate) {
                callbacks.onStatsUpdate({
                    drowsyFrames: earCounter,
                    drowsyAlerts: drowsyAlertCount
                });
            }
        }

        renderCanvas();
    }

    /**
     * Xử lý kết quả nhận diện bàn tay và phát hiện rời vô lăng
     */
    function handleHandsResults(results) {
        if (!isRunning) return;
        handsResults = results;

        const handsDetected = Boolean(results.multiHandLandmarks && results.multiHandLandmarks.length > 0);

        if (!handsDetected) {
            handOffCounter++;

            if (handOffCounter >= config.HAND_OFF_FRAMES) {
                if (!isHandAlerting) {
                    isHandAlerting = true;
                    handAlertCount++;
                    if (callbacks.onHandAlert) {
                        callbacks.onHandAlert(handAlertCount);
                    }
                }
            }

            if (callbacks.onStatusUpdate) {
                callbacks.onStatusUpdate('Không phát hiện tay');
            }
        } else {
            handOffCounter = 0;
            if (isHandAlerting) {
                isHandAlerting = false;
                if (callbacks.onHandClear) {
                    callbacks.onHandClear();
                }
            }

            if (callbacks.onStatusUpdate) {
                callbacks.onStatusUpdate('Tay trên vô lăng');
            }
        }

        if (callbacks.onStatsUpdate) {
            callbacks.onStatsUpdate({
                handOffFrames: handOffCounter,
                handAlerts: handAlertCount
            });
        }

        // Vẽ lại canvas để cập nhật bàn tay ngay lập tức
        renderCanvas();
    }

    /**
     * Vẽ khung hình khuôn mặt, bàn tay và các kết nối lên canvas
     */
    function renderCanvas() {
        if (!isRunning || !canvasElement || !videoElement || !canvasCtx) return;

        // Đồng bộ kích thước canvas với video
        if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // 1. Vẽ Face Mesh nếu có
        if (faceResults && faceResults.multiFaceLandmarks && faceResults.multiFaceLandmarks.length > 0) {
            const landmarks = faceResults.multiFaceLandmarks[0];
            const styles = config.DRAWING_STYLES;

            if (window.drawConnectors) {
                // Lưới khuôn mặt
                window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_TESSELATION, styles.TESSELATION);
                // Viền 2 mắt
                window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_RIGHT_EYE, styles.EYES);
                window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_LEFT_EYE, styles.EYES);
            }
        }

        // 2. Vẽ bàn tay nếu có
        if (handsResults && handsResults.multiHandLandmarks && handsResults.multiHandLandmarks.length > 0) {
            const styles = config.DRAWING_STYLES;

            for (const landmarks of handsResults.multiHandLandmarks) {
                if (window.drawConnectors) {
                    window.drawConnectors(canvasCtx, landmarks, window.HANDS_CONNECTIONS, styles.HAND_CONNECTIONS);
                }
                if (window.drawLandmarks) {
                    window.drawLandmarks(canvasCtx, landmarks, styles.HAND_LANDMARKS);
                }
            }
        }

        canvasCtx.restore();

        // 3. Cập nhật chỉ số FPS
        const currentFPS = fpsCounter.update();
        if (callbacks.onFPSUpdate) {
            callbacks.onFPSUpdate(currentFPS);
        }
    }

    /**
     * Khởi tạo động cơ nhận diện
     */
    function init(appConfig, elements, registeredCallbacks = {}) {
        config = appConfig;
        videoElement = elements.video;
        canvasElement = elements.canvas;
        if (canvasElement) {
            canvasCtx = canvasElement.getContext('2d');
        }
        callbacks = { ...callbacks, ...registeredCallbacks };

        if (!faceMesh) initFaceMesh();
        if (!hands) initHands();
    }

    /**
     * Gửi khung hình từ video sang cho FaceMesh và Hands xử lý
     */
    async function processFrame(video) {
        if (!isRunning || !faceMesh || !hands) return;

        await faceMesh.send({ image: video });
        await hands.send({ image: video });
    }

    /**
     * Bắt đầu phiên làm việc
     */
    function start() {
        isRunning = true;
        fpsCounter.reset();
    }

    /**
     * Dừng phiên làm việc và xóa bộ nhớ tạm
     */
    function stop() {
        isRunning = false;

        // Reset các biến đếm và trạng thái cảnh báo tức thời
        earCounter = 0;
        handOffCounter = 0;
        isDrowsyAlerting = false;
        isHandAlerting = false;
        faceResults = null;
        handsResults = null;

        // Xóa canvas
        if (canvasCtx && canvasElement) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }

        fpsCounter.reset();
    }

    /**
     * Cập nhật cấu hình khi người dùng chỉnh sửa trong settings
     */
    function updateConfig(newConfig) {
        config = { ...config, ...newConfig };
    }

    /**
     * Lấy toàn bộ số liệu thống kê hiện tại
     */
    function getStats() {
        return {
            earCounter,
            handOffCounter,
            drowsyAlertCount,
            handAlertCount
        };
    }

    return {
        init,
        start,
        stop,
        processFrame,
        updateConfig,
        getStats
    };
})();
