/**
 * ==========================================================================
 * HỆ THỐNG CẢNH BÁO TÀI XẾ - TRƯỜNG THPT HÙNG VƯƠNG
 * File: js/audio.js
 * Chức năng: Quản lý âm thanh cảnh báo bằng Web Audio API
 * ==========================================================================
 */

window.AudioManager = (function() {
    let audioContext = null;
    let volume = 1.0;

    /**
     * Khởi tạo hoặc kích hoạt AudioContext
     */
    function init() {
        if (!audioContext) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    audioContext = new AudioCtx();
                }
            } catch (e) {
                console.error('Không thể khởi tạo Web Audio API:', e);
            }
        }

        // Trình duyệt yêu cầu tương tác người dùng để mở AudioContext
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(err => console.warn('Lỗi kích hoạt AudioContext:', err));
        }

        return audioContext;
    }

    /**
     * Phát âm thanh cảnh báo dạng sóng hình sin (Sine Wave)
     * @param {number} frequency - Tần số âm thanh (Hz)
     * @param {number} duration - Thời lượng phát (ms)
     * @param {number} customVolume - Âm lượng tùy chỉnh (0.0 - 1.0, nếu không truyền sẽ dùng volume hiện tại)
     */
    function playAlert(frequency = 1000, duration = 500, customVolume = null) {
        init();
        if (!audioContext) return;

        try {
            const currentVol = (customVolume !== null) ? customVolume : volume;
            if (currentVol <= 0) return; // Âm lượng tắt thì bỏ qua

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            const now = audioContext.currentTime;
            const durationSec = duration / 1000;

            gainNode.gain.setValueAtTime(currentVol, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + durationSec);

            oscillator.start(now);
            oscillator.stop(now + durationSec);
        } catch (e) {
            console.error('Lỗi khi phát âm thanh cảnh báo:', e);
        }
    }

    /**
     * Cập nhật âm lượng toàn cục
     * @param {number} newVolume - Giá trị từ 0.0 đến 1.0
     */
    function setVolume(newVolume) {
        volume = Math.max(0, Math.min(1, newVolume));
    }

    /**
     * Lấy âm lượng hiện tại
     * @returns {number}
     */
    function getVolume() {
        return volume;
    }

    return {
        init,
        playAlert,
        setVolume,
        getVolume
    };
})();
