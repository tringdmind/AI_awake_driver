/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/utils.js
 * Chức năng: Các hàm tiện ích toán học, tính khoảng cách Euclidean, EAR và FPS
 * ==========================================================================
 */

window.VisionUtils = {
    /**
     * Tính khoảng cách Euclidean giữa 2 điểm 2D
     * @param {{x: number, y: number}} p1 
     * @param {{x: number, y: number}} p2 
     * @returns {number} Khoảng cách giữa p1 và p2
     */
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },

    /**
     * Tính tỷ lệ mở mắt EAR (Eye Aspect Ratio) dựa trên 6 điểm landmark mắt
     * Công thức: EAR = (|p1 - p5| + |p2 - p4|) / (2 * |p0 - p3|)
     * Trong đó:
     * - p0, p3 là 2 khóe mắt ngoài và trong (chiều ngang)
     * - p1, p5 và p2, p4 là các cặp mí trên và dưới (chiều dọc)
     * @param {Array<{x: number, y: number}>} eyeLandmarks - Mảng 6 điểm landmark của mắt
     * @returns {number} Giá trị EAR
     */
    calculateEAR(eyeLandmarks) {
        if (!eyeLandmarks || eyeLandmarks.length < 6) return 0;

        const A = this.distance(eyeLandmarks[1], eyeLandmarks[5]);
        const B = this.distance(eyeLandmarks[2], eyeLandmarks[4]);
        const C = this.distance(eyeLandmarks[0], eyeLandmarks[3]);

        if (C === 0) return 0;
        return (A + B) / (2.0 * C);
    },

    /**
     * Trích xuất các điểm landmark tương ứng từ mảng landmark đầy đủ
     * @param {Array} landmarks - Mảng toàn bộ landmark
     * @param {Array<number>} eyeIndices - Danh sách chỉ số cần lấy
     * @returns {Array} Mảng các điểm landmark được chọn
     */
    getEyeLandmarks(landmarks, eyeIndices) {
        return eyeIndices.map(idx => landmarks[idx]);
    },

    /**
     * Bộ đếm và tính toán FPS (Frames Per Second)
     */
    createFPSCounter() {
        let lastFrameTime = Date.now();
        let currentFPS = 0;

        return {
            update() {
                const now = Date.now();
                const delta = now - lastFrameTime;
                if (delta > 0) {
                    currentFPS = Math.round(1000 / delta);
                }
                lastFrameTime = now;
                return currentFPS;
            },
            getFPS() {
                return currentFPS;
            },
            reset() {
                lastFrameTime = Date.now();
                currentFPS = 0;
            }
        };
    }
};
