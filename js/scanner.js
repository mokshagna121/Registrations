/**
 * HACKCHECK - Scanner Module
 * Manages camera QR scanning (html5-qrcode) and keyboard/USB scanner input.
 */

const Scanner = {
    _html5QrCode: null,
    _isScanning: false,
    _settings: {},
    _resultTimeout: null,
    _manualBuffer: '',
    _manualTimer: null,
    _scanCooldown: false,

    init(settings) {
        this._settings = settings;
        this._setupManualInput();
        this._setupKeyboardScanner();
    },

    // -------------------------------------------------------------------------
    // CAMERA
    // -------------------------------------------------------------------------
    async start() {
        if (this._isScanning) return;

        const viewport = document.getElementById('scanner-viewport');
        if (!viewport) return;

        // Remove placeholder content
        const statusOverlay = document.getElementById('scanner-status');
        if (statusOverlay) statusOverlay.innerHTML = '<div class="scanner-loading">Initializing camera…</div>';

        try {
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error('QR scanning library not loaded. Please check your internet connection.');
            }

            this._html5QrCode = new Html5Qrcode('scanner-viewport');

            const config = {
                fps: 15,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false,
            };

            await this._html5QrCode.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => this._onScanSuccess(decodedText),
                () => { /* scan failure — ignore */ }
            );

            this._isScanning = true;
            if (statusOverlay) statusOverlay.classList.add('hidden');
            this._updateCameraButtons(true);

        } catch (err) {
            this._isScanning = false;
            let msg = 'Could not start camera.';
            if (err.message && err.message.includes('permission')) {
                msg = 'Camera permission denied. Please allow camera access and try again.';
            } else if (err.message && err.message.includes('not found')) {
                msg = 'No camera found on this device.';
            } else if (err.message) {
                msg = err.message;
            }
            if (statusOverlay) statusOverlay.innerHTML = `<div class="scanner-error-msg">⚠ ${Utils.escapeHtml(msg)}</div>`;
            UI.toast(msg, 'error');
        }
    },

    async stop() {
        if (this._html5QrCode && this._isScanning) {
            try {
                await this._html5QrCode.stop();
            } catch (e) { /* ignore */ }
            this._html5QrCode = null;
        }
        this._isScanning = false;
        this._updateCameraButtons(false);

        const statusOverlay = document.getElementById('scanner-status');
        if (statusOverlay) {
            statusOverlay.classList.remove('hidden');
            statusOverlay.innerHTML = '<div class="scanner-idle-text">Camera stopped</div>';
        }
    },

    _updateCameraButtons(scanning) {
        const start = document.getElementById('btn-start-scan');
        const stop = document.getElementById('btn-stop-scan');
        if (start) start.classList.toggle('hidden', scanning);
        if (stop) stop.classList.toggle('hidden', !scanning);
    },

    // -------------------------------------------------------------------------
    // MANUAL INPUT (text field)
    // -------------------------------------------------------------------------
    _setupManualInput() {
        const input = document.getElementById('manual-qr-input');
        if (!input) return;
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.processManual();
            }
        });
    },

    processManual() {
        const input = document.getElementById('manual-qr-input');
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        input.value = '';
        input.focus();
        this._processQR(val);
    },

    // -------------------------------------------------------------------------
    // KEYBOARD SCANNER (USB / Bluetooth scanners type fast)
    // -------------------------------------------------------------------------
    _setupKeyboardScanner() {
        // USB scanners act as a keyboard — they type rapidly and end with Enter.
        // We intercept keystrokes when focus is NOT on an input/textarea.
        document.addEventListener('keydown', e => {
            // Only intercept if current focus is not an input/textarea/button
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (['input', 'textarea', 'button', 'select'].includes(tag)) return;

            if (e.key === 'Enter') {
                if (this._manualBuffer.trim()) {
                    this._processQR(this._manualBuffer.trim());
                    this._manualBuffer = '';
                }
                clearTimeout(this._manualTimer);
                return;
            }

            if (e.key.length === 1) {
                this._manualBuffer += e.key;
                clearTimeout(this._manualTimer);
                this._manualTimer = setTimeout(() => { this._manualBuffer = ''; }, 200);
            }
        });
    },

    // -------------------------------------------------------------------------
    // QR SCAN SUCCESS (camera)
    // -------------------------------------------------------------------------
    _onScanSuccess(decodedText) {
        if (this._scanCooldown) return;
        this._scanCooldown = true;
        this._processQR(decodedText);
        setTimeout(() => { this._scanCooldown = false; }, 1500);
    },

    // -------------------------------------------------------------------------
    // PROCESS QR
    // -------------------------------------------------------------------------
    _processQR(qrId) {
        const result = App.checkIn(qrId);
        this._showResult(result);

        const s = this._settings;
        if (s.soundEnabled) {
            if (result.status === 'SUCCESS' && s.successSound) Utils.playBeep('success');
            else if ((result.status === 'DUPLICATE' || result.status === 'INVALID') && s.errorSound) Utils.playBeep('warning');
        }
    },

    // -------------------------------------------------------------------------
    // SHOW RESULT
    // -------------------------------------------------------------------------
    _showResult(result) {
        const panel = document.getElementById('scan-result-panel');
        if (!panel) return;

        clearTimeout(this._resultTimeout);
        panel.classList.remove('hidden');
        panel.className = 'scan-result-panel';

        if (result.status === 'SUCCESS') {
            const p = result.participant;
            const t = result.team;
            panel.classList.add('scan-result-success');
            panel.innerHTML = `
              <div class="scan-result-icon success-icon">✓</div>
              <div class="scan-result-heading">CHECK-IN SUCCESSFUL</div>
              <div class="scan-result-name">${Utils.escapeHtml(p.name)}</div>
              <div class="scan-result-meta">
                <div class="scan-result-row"><span class="sr-label">Team</span><span class="sr-value">${Utils.escapeHtml(t.teamName)}</span></div>
                <div class="scan-result-row"><span class="sr-label">Team ID</span><span class="sr-value">${Utils.escapeHtml(t.teamId)}</span></div>
                <div class="scan-result-row"><span class="sr-label">College</span><span class="sr-value">${Utils.escapeHtml(t.college)}</span></div>
                <div class="scan-result-row"><span class="sr-label">Roll No</span><span class="sr-value">${Utils.escapeHtml(p.rollNo)}</span></div>
                <div class="scan-result-row"><span class="sr-label">Check-in Time</span><span class="sr-value" style="color:#22C55E">${Utils.formatTime(p.attendance.checkInTime)}</span></div>
              </div>
              <div class="status-badge status-present scan-status-badge">✓ PRESENT</div>
              <button class="btn btn-accent btn-lg mt-16 scan-next-btn" onclick="Scanner._clearResult()" aria-label="Scan next participant">SCAN NEXT</button>
              <div class="scan-auto-note">Auto-returning in <span id="scan-countdown">${this._settings.autoReturnDelay}</span>s</div>`;

            App.updateHeaderStats();
            this._startCountdown(result.status);

        } else if (result.status === 'DUPLICATE') {
            const p = result.participant;
            const t = result.team;
            panel.classList.add('scan-result-warning');
            panel.innerHTML = `
              <div class="scan-result-icon warning-icon">⚠</div>
              <div class="scan-result-heading">ALREADY CHECKED IN</div>
              <div class="scan-result-name">${Utils.escapeHtml(p.name)}</div>
              <div class="scan-result-meta">
                <div class="scan-result-row"><span class="sr-label">Team</span><span class="sr-value">${Utils.escapeHtml(t.teamName)}</span></div>
                <div class="scan-result-row"><span class="sr-label">Already checked in at</span><span class="sr-value" style="color:#F59E0B">${Utils.formatTime(p.attendance.checkInTime)}</span></div>
              </div>
              <button class="btn btn-ghost btn-lg mt-16 scan-next-btn" onclick="Scanner._clearResult()" aria-label="Scan next participant">SCAN NEXT</button>`;

            this._startCountdown(result.status);

        } else {
            // INVALID
            panel.classList.add('scan-result-error');
            panel.innerHTML = `
              <div class="scan-result-icon error-icon">✕</div>
              <div class="scan-result-heading">INVALID QR</div>
              <div class="scan-result-sub">This participant is not registered in the hackathon system.</div>
              <div class="scan-result-qr-id">Scanned: <code>${Utils.escapeHtml(result.qrId)}</code></div>
              <button class="btn btn-ghost btn-lg mt-16 scan-next-btn" onclick="Scanner._clearResult()" aria-label="Scan again">SCAN AGAIN</button>`;

            this._startCountdown(result.status);
        }
    },

    _startCountdown(status) {
        const delay = this._settings.autoReturnDelay * 1000;
        let remaining = this._settings.autoReturnDelay;
        const countdownEl = document.getElementById('scan-countdown');

        const tick = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(tick);
                this._clearResult();
            }
        }, 1000);

        this._resultTimeout = { _tick: tick };
    },

    _clearResult() {
        if (this._resultTimeout?._tick) clearInterval(this._resultTimeout._tick);
        const panel = document.getElementById('scan-result-panel');
        if (panel) {
            panel.classList.add('hidden');
            panel.innerHTML = '';
        }
        const input = document.getElementById('manual-qr-input');
        if (input) input.focus();
    },

    // Called when navigating away from scanner page
    destroy() {
        this.stop();
        if (this._resultTimeout?._tick) clearInterval(this._resultTimeout._tick);
    },
};

// Ensure scanner is cleaned up on navigation
const _origNavigate = App.navigateTo.bind(App);
App.navigateTo = function (page, params) {
    if (Scanner._isScanning) Scanner.destroy();
    _origNavigate(page, params);
};
