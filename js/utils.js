/**
 * HACKCHECK - Utilities Module
 * ID generation, CSV parsing, QR code generation, date formatting, etc.
 */

const Utils = {
    /**
     * Generate a UUID v4.
     */
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * Generate a short random ID for display.
     */
    shortId(prefix = 'P') {
        return prefix + Math.random().toString(36).substr(2, 6).toUpperCase();
    },

    /**
     * Generate a QR code identifier for a participant.
     * Format: HACK-{teamId}-{shortParticipantId}
     */
    generateQRId(teamId, participantId) {
        return `HACK-${teamId}-${participantId}`;
    },

    /**
     * Format an ISO date string to human-readable time.
     */
    formatTime(isoString) {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    },

    /**
     * Format an ISO date string to a readable date+time.
     */
    formatDateTime(isoString) {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    },

    /**
     * Get current ISO string.
     */
    now() {
        return new Date().toISOString();
    },

    /**
     * Parse a CSV string into an array of row arrays.
     * Handles quoted fields with commas inside.
     */
    parseCSV(csvText) {
        const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        return lines
            .filter(line => line.trim() !== '')
            .map(line => this._parseCSVLine(line));
    },

    _parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    },

    /**
     * Convert array of objects to CSV string.
     */
    toCSV(headers, rows) {
        const escape = val => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };
        const lines = [headers.map(escape).join(',')];
        for (const row of rows) {
            lines.push(row.map(escape).join(','));
        }
        return lines.join('\n');
    },

    /**
     * Trigger a browser file download.
     */
    downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Escape HTML to prevent XSS.
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Get today's date string for filenames.
     */
    todayString() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Debounce a function.
     */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Play a beep sound using the Web Audio API.
     * type: 'success' | 'warning' | 'error'
     */
    playBeep(type = 'success') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'success') {
                oscillator.frequency.setValueAtTime(880, ctx.currentTime);
                oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
            } else if (type === 'warning') {
                oscillator.frequency.setValueAtTime(440, ctx.currentTime);
                oscillator.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
            } else {
                oscillator.frequency.setValueAtTime(220, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {
            // AudioContext not available — silently ignore.
        }
    },

    /**
     * Generate demo data (5 teams, ~20 participants).
     */
    generateDemoData() {
        const colleges = [
            "St. Peter's Engineering College",
            "VIT University",
            "IIT Hyderabad",
            "BITS Pilani",
            "NIT Warangal",
        ];
        const teamNames = [
            "Code Warriors", "Tech Titans", "Binary Bandits",
            "Null Pointers", "Stack Overflow"
        ];
        const firstNames = ["Bala", "Ravi", "Arun", "Kiran", "Priya", "Sneha", "Rahul", "Arjun", "Divya", "Meera", "Sai", "Rohit", "Anjali", "Vijay", "Pooja"];
        const lastNames = ["Reddy", "Kumar", "Sharma", "Singh", "Rao", "Nair", "Patel", "Verma", "Iyer", "Mehta"];

        const teams = [];
        let pCounter = 1;

        for (let t = 0; t < 5; t++) {
            const teamId = `T00${t + 1}`;
            const participants = [];
            const count = 3 + Math.floor(Math.random() * 3); // 3–5 participants

            for (let p = 0; p < count; p++) {
                const participantId = `P${String(pCounter).padStart(3, '0')}`;
                const first = firstNames[Math.floor(Math.random() * firstNames.length)];
                const last = lastNames[Math.floor(Math.random() * lastNames.length)];
                const rollNo = `24BK1A05${String.fromCharCode(65 + pCounter - 1)}`;
                participants.push({
                    participantId,
                    qrId: this.generateQRId(teamId, participantId),
                    name: `${first} ${last}`,
                    rollNo,
                    email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
                    phone: `98765${String(43200 + pCounter).padStart(5, '0')}`,
                    attendance: { status: 'PENDING', checkInTime: null },
                });
                pCounter++;
            }

            teams.push({
                teamId,
                teamName: teamNames[t],
                college: colleges[t],
                participants,
            });
        }

        return teams;
    },
};
