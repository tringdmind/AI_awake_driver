/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/config.js
 * Chức năng: Lưu trữ cấu hình mặc định, thông số ngưỡng và hằng số hệ thống
 * ==========================================================================
 */

window.APP_CONFIG = {
    // Ngưỡng EAR (Eye Aspect Ratio): dưới mức này tính là mắt đang nhắm
    EAR_THRESHOLD: 0.25,

    // Số khung hình (frames) mắt nhắm liên tục để kích hoạt cảnh báo ngủ gật
    CONSECUTIVE_FRAMES: 20,

    // Số khung hình (frames) không thấy tay để kích hoạt cảnh báo rời vô lăng
    HAND_OFF_FRAMES: 30,

    // Cấu hình âm thanh cảnh báo ngủ gật (Hz và ms)
    DROWSY_SOUND: {
        FREQ: 1000,
        DURATION: 500
    },

    // Cấu hình âm thanh cảnh báo tay rời vô lăng (Hz và ms)
    HAND_SOUND: {
        FREQ: 1500,
        DURATION: 300
    },

    // Âm lượng mặc định (0.0 đến 1.0)
    VOLUME: 1.0,

    // Kích thước camera mong muốn
    CAMERA: {
        WIDTH: 1280,
        HEIGHT: 720
    },

    // Cấu hình MediaPipe
    MEDIAPIPE: {
        FACE_MESH: {
            MAX_NUM_FACES: 1,
            REFINE_LANDMARKS: true,
            MIN_DETECTION_CONFIDENCE: 0.5,
            MIN_TRACKING_CONFIDENCE: 0.5,
            LOCATE_FILE: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        },
        HANDS: {
            MAX_NUM_HANDS: 2,
            MODEL_COMPLEXITY: 1,
            MIN_DETECTION_CONFIDENCE: 0.5,
            MIN_TRACKING_CONFIDENCE: 0.5,
            LOCATE_FILE: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
    },

    // Chỉ số landmark trên khuôn mặt dành cho 2 mắt (theo chuẩn MediaPipe FaceMesh 468/478 điểm)
    LANDMARKS: {
        LEFT_EYE: [362, 385, 387, 263, 373, 380],
        RIGHT_EYE: [33, 160, 158, 133, 153, 144]
    },

    // Kiểu hiển thị trên Canvas
    DRAWING_STYLES: {
        TESSELATION: { color: '#3a3a3a50', lineWidth: 1 },
        EYES: { color: '#10b981', lineWidth: 2 },
        HAND_CONNECTIONS: { color: '#10b981', lineWidth: 3 },
        HAND_LANDMARKS: { color: '#ef4444', lineWidth: 1, radius: 3 }
    }
};
