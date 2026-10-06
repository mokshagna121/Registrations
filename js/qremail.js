/**
 * HACKCHECK - QR & Email Module
 * Generates QR code images and dispatches participant QR codes via EmailJS or Mail Client.
 */

const QREmail = {

    // -------------------------------------------------------------------------
    // QR CODE GENERATION
    // -------------------------------------------------------------------------

    /**
     * Generate a QR code as a base64 PNG data URL for a given text.
     * Returns a Promise<string> resolving to the data URL.
     */
    generateQRDataURL(text, size = 256) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof QRCode === 'undefined') {
                    // Fallback using quick SVG canvas if library not ready
                    return resolve(this._fallbackQRCodeURL(text, size));
                }

                // Create a temporary off-screen container
                const container = document.createElement('div');
                container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:' + size + 'px;height:' + size + 'px;';
                document.body.appendChild(container);

                new QRCode(container, {
                    text,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#FFFFFF',
                    correctLevel: QRCode.CorrectLevel.H,
                });

                // QRCode renders asynchronously via canvas/img
                setTimeout(() => {
                    const canvas = container.querySelector('canvas');
                    const img = container.querySelector('img');
                    let dataURL = null;

                    if (canvas) {
                        dataURL = canvas.toDataURL('image/png');
                    } else if (img && img.src) {
                        dataURL = img.src;
                    }

                    if (container.parentNode) {
                        document.body.removeChild(container);
                    }

                    if (dataURL) {
                        resolve(dataURL);
                    } else {
                        resolve(this._fallbackQRCodeURL(text, size));
                    }
                }, 150);
            } catch (err) {
                resolve(this._fallbackQRCodeURL(text, size));
            }
        });
    },

    /**
     * Render a QR code into a given DOM element by ID.
     */
    renderQRInto(elementId, text, size = 180) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = '';
        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(el, {
                    text,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#FFFFFF',
                    correctLevel: QRCode.CorrectLevel.H,
                });
            } else {
                el.innerHTML = `<img src="${this._fallbackQRCodeURL(text, size)}" alt="QR Code" style="width:${size}px;height:${size}px;" />`;
            }
        } catch (e) {
            el.innerHTML = `<img src="${this._fallbackQRCodeURL(text, size)}" alt="QR Code" style="width:${size}px;height:${size}px;" />`;
        }
    },

    /**
     * Fallback URL generator if offline or library hasn't loaded
     */
    _fallbackQRCodeURL(text, size = 200) {
        // High-availability QR API fallback
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    },

    // -------------------------------------------------------------------------
    // EMAIL DISPATCH HELPERS
    // -------------------------------------------------------------------------

    /**
     * Check if EmailJS is configured.
     */
    isEmailConfigured(settings) {
        return !!(
            settings &&
            settings.emailjsServiceId &&
            settings.emailjsTemplateId &&
            settings.emailjsPublicKey
        );
    },

    /**
     * Initialize EmailJS with the public key.
     */
    initEmailJS(publicKey) {
        try {
            if (typeof emailjs !== 'undefined') {
                emailjs.init(publicKey);
                return true;
            }
        } catch (e) { /* ignore */ }
        return false;
    },

    /**
     * Generate mailto: link for fallback manual email opening
     */
    getMailtoUrl(participant, team, settings) {
        const eventName = settings?.hackathonName || 'Hackathon 2026';
        const deskName = settings?.deskName || 'Registration Desk';
        const subject = encodeURIComponent(`[${eventName}] Your Check-in Pass & QR Code — ${team.teamName}`);
        const body = encodeURIComponent(
`Hi ${participant.name},

You have been registered for ${eventName}!

════════════════════════════════════════
REGISTRATION DETAILS
════════════════════════════════════════
Team Name   : ${team.teamName}
Team ID     : ${team.teamId}
College     : ${team.college || 'N/A'}
Participant : ${participant.name}
Roll Number : ${participant.rollNo || 'N/A'}

YOUR CHECK-IN QR ID:
👉 ${participant.qrId} 👈

════════════════════════════════════════
CHECK-IN INSTRUCTIONS:
Present this QR ID or your badge to the volunteers at ${deskName} upon arrival.

We look forward to seeing you at ${eventName}!

Best regards,
${eventName} Organizing Team`
        );
        return `mailto:${encodeURIComponent(participant.email)}?subject=${subject}&body=${body}`;
    },

    /**
     * Send QR code email to a single participant via EmailJS.
     * Returns Promise<{ success, error }>
     */
    async sendParticipantEmail(participant, team, settings) {
        if (!this.isEmailConfigured(settings)) {
            return { success: false, error: 'EmailJS is not configured. Go to Settings → Email Setup.' };
        }
        if (!participant.email) {
            return { success: false, error: 'Participant has no email address.' };
        }

        try {
            // Generate QR as data URL to embed in email
            let qrDataURL = '';
            try {
                qrDataURL = await this.generateQRDataURL(participant.qrId, 220);
            } catch (e) {
                qrDataURL = this._fallbackQRCodeURL(participant.qrId, 220);
            }

            this.initEmailJS(settings.emailjsPublicKey);

            const templateParams = {
                to_email: participant.email,
                to_name: participant.name,
                hackathon_name: settings.hackathonName || 'Hackathon 2026',
                team_name: team.teamName,
                team_id: team.teamId,
                college: team.college || '',
                roll_number: participant.rollNo || '',
                qr_id: participant.qrId,
                qr_image: qrDataURL,
                event_date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            };

            await emailjs.send(
                settings.emailjsServiceId,
                settings.emailjsTemplateId,
                templateParams
            );

            return { success: true };
        } catch (err) {
            const msg = err?.text || err?.message || 'Failed to send email.';
            return { success: false, error: msg };
        }
    },

    /**
     * Send a quick test email to verify credentials.
     */
    async sendTestEmail(targetEmail, settings) {
        if (!this.isEmailConfigured(settings)) {
            return { success: false, error: 'Please enter Service ID, Template ID, and Public Key first.' };
        }
        try {
            this.initEmailJS(settings.emailjsPublicKey);
            const templateParams = {
                to_email: targetEmail,
                to_name: 'Hackathon Tester',
                hackathon_name: settings.hackathonName || 'HACKCHECK Test',
                team_name: 'Test Team',
                team_id: 'T-DEMO',
                college: 'Test University',
                roll_number: 'DEMO-001',
                qr_id: 'HACK-DEMO-P1',
                qr_image: this._fallbackQRCodeURL('HACK-DEMO-P1', 200),
                event_date: new Date().toLocaleDateString(),
            };
            await emailjs.send(
                settings.emailjsServiceId,
                settings.emailjsTemplateId,
                templateParams
            );
            return { success: true };
        } catch (err) {
            return { success: false, error: err?.text || err?.message || 'Failed to send test email.' };
        }
    },

    /**
     * Send QR emails to all participants in a team.
     * Returns Promise<{ sent, failed, errors }>
     */
    async sendTeamEmails(team, settings, onProgress) {
        let sent = 0, failed = 0;
        const errors = [];

        for (let i = 0; i < team.participants.length; i++) {
            const p = team.participants[i];
            if (onProgress) onProgress(i + 1, team.participants.length, p.name);

            if (!p.email) {
                failed++;
                errors.push({ name: p.name, error: 'No email address.' });
                continue;
            }

            const result = await this.sendParticipantEmail(p, team, settings);
            if (result.success) {
                sent++;
            } else {
                failed++;
                errors.push({ name: p.name, error: result.error });
            }

            // Small delay to respect EmailJS rate limits
            if (i < team.participants.length - 1) {
                await new Promise(r => setTimeout(r, 400));
            }
        }

        return { sent, failed, errors };
    },

    // -------------------------------------------------------------------------
    // QR CODES MODAL (Shown after team creation or from team list)
    // -------------------------------------------------------------------------

    showTeamQRModal(team, settings) {
        if (!team) return;
        const emailConfigured = this.isEmailConfigured(settings);
        this._currentTeam = team;

        const participantRows = team.participants.map((p, idx) => {
            const mailtoUrl = p.email ? this.getMailtoUrl(p, team, settings) : '#';
            return `
          <div class="qr-participant-card" id="qr-card-${idx}">
            <div class="qr-card-header">
              <div class="qr-card-info">
                <div class="qr-name">${Utils.escapeHtml(p.name)}</div>
                <div class="qr-meta">${Utils.escapeHtml(p.rollNo || 'No roll')} · ${Utils.escapeHtml(p.email || 'No email')}</div>
                <div class="qr-id-text"><code>${Utils.escapeHtml(p.qrId)}</code></div>
              </div>
              <div class="qr-code-box" id="qr-render-${idx}">
                <div class="qr-loading">Generating…</div>
              </div>
            </div>
            <div class="qr-card-actions">
              <button class="btn btn-ghost btn-sm" onclick="QREmail.downloadParticipantQR(${idx}, '${Utils.escapeHtml(p.qrId)}', '${Utils.escapeHtml(p.name)}')" aria-label="Download QR code">
                ⬇ Download QR
              </button>
              ${p.email ? `
                <a class="btn btn-ghost btn-sm" href="${mailtoUrl}" target="_blank" title="Send via your default email app">
                  ✉ Mail Client
                </a>
                <button class="btn btn-accent btn-sm" id="send-btn-${idx}"
                  onclick="QREmail._sendOneEmail(${idx}, '${Utils.escapeHtml(p.participantId)}', '${Utils.escapeHtml(team.teamId)}')"
                  ${emailConfigured ? '' : 'title="EmailJS not configured — click to configure or use Mail Client above"'}
                  aria-label="Send QR email">
                  ${emailConfigured ? '⚡ Send via EmailJS' : '⚙ Send via EmailJS'}
                </button>` : `<span class="text-muted-sm">No email</span>`}
              <div class="send-status" id="send-status-${idx}"></div>
            </div>
          </div>`;
        }).join('');

        UI.showModal({
            title: `QR Codes & Email Dispatch — ${team.teamName}`,
            size: 'lg',
            body: `
              <div class="qr-modal-top">
                <p class="card-desc">Each participant has a unique check-in QR code. Send to their email, download PNGs, or print badge passes.</p>
                ${!emailConfigured ? `
                  <div class="alert-banner alert-warning" style="margin-top:10px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
                    <div>
                      <strong>⚡ Automated Email Sending (EmailJS):</strong>
                      <span style="font-size:0.82rem; display:block; opacity:0.9;">Configure EmailJS in Settings for 100% automated background email dispatch. Meanwhile, you can use <strong>✉ Mail Client</strong> above!</span>
                    </div>
                    <button class="btn btn-accent btn-sm" onclick="UI.closeModal(); App.navigateTo('settings');">Configure</button>
                  </div>` : `
                  <div class="alert-banner alert-success" style="margin-top:10px;">
                    ✓ <strong>EmailJS is connected!</strong> You can send emails automatically with 1 click.
                  </div>`}
              </div>
              <div class="qr-participants-grid">
                ${participantRows}
              </div>
              <div class="qr-bulk-actions">
                <button class="btn btn-ghost" onclick="QREmail.printAllQR('${Utils.escapeHtml(team.teamId)}')" aria-label="Print all QR codes">
                  🖨 Print Badges / QR Passes
                </button>
                ${emailConfigured ? `
                  <button class="btn btn-accent" id="btn-send-all" onclick="QREmail._sendAllEmails('${Utils.escapeHtml(team.teamId)}')" aria-label="Send all QR codes by email">
                    ✉ Email All Participants (EmailJS)
                  </button>` : `
                  <button class="btn btn-accent" onclick="UI.closeModal(); App.navigateTo('settings');">
                    ⚙ Setup EmailJS for 1-Click Mass Send
                  </button>`}
              </div>
              <div id="bulk-send-progress" class="bulk-send-progress hidden"></div>`,
            actions: [
                { label: 'Done', class: 'btn-ghost', id: 'close', handler: () => UI.closeModal() },
            ],
        });

        // Render QR codes after modal is visible
        setTimeout(() => {
            team.participants.forEach((p, idx) => {
                this.renderQRInto(`qr-render-${idx}`, p.qrId, 140);
            });
        }, 100);
    },

    _currentTeam: null,

    async downloadParticipantQR(idx, qrId, name) {
        try {
            const dataURL = await this.generateQRDataURL(qrId, 400);
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `qr-${name.replace(/\s+/g, '-')}-${qrId}.png`;
            a.click();
        } catch (e) {
            UI.toast('Could not generate QR image for download.', 'error');
        }
    },

    async _sendOneEmail(idx, participantId, teamId) {
        const team = App.getTeam(teamId) || this._currentTeam;
        if (!team) return;
        const participant = team.participants.find(p => p.participantId === participantId);
        if (!participant) return;

        if (!this.isEmailConfigured(App.state.settings)) {
            UI.showModal({
                title: 'EmailJS Configuration Required',
                size: 'md',
                body: `
                  <p style="margin-bottom:12px">Automated background emails require free EmailJS API keys. Would you like to configure EmailJS now, or open your default mail client?</p>
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    <a class="btn btn-accent" href="${this.getMailtoUrl(participant, team, App.state.settings)}" target="_blank" onclick="UI.closeModal()">
                      ✉ Open in My Mail Client (Instant)
                    </a>
                    <button class="btn btn-ghost" onclick="UI.closeModal(); App.navigateTo('settings');">
                      ⚙ Open Settings to Configure EmailJS
                    </button>
                  </div>`,
                actions: [{ label: 'Cancel', class: 'btn-ghost', handler: () => UI.closeModal() }]
            });
            return;
        }

        const btn = document.getElementById(`send-btn-${idx}`);
        const statusEl = document.getElementById(`send-status-${idx}`);
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        if (statusEl) statusEl.innerHTML = '';

        const result = await this.sendParticipantEmail(participant, team, App.state.settings);

        if (btn) { btn.disabled = false; btn.textContent = '⚡ Send via EmailJS'; }
        if (result.success) {
            if (statusEl) statusEl.innerHTML = '<span style="color:#22C55E;font-size:0.75rem">✓ Email Sent!</span>';
            UI.toast(`QR email sent to ${participant.name}.`, 'success');
        } else {
            if (statusEl) statusEl.innerHTML = `<span style="color:#EF4444;font-size:0.75rem">✕ ${Utils.escapeHtml(result.error)}</span>`;
            UI.toast(`Failed: ${result.error}`, 'error');
        }
    },

    async _sendAllEmails(teamId) {
        const team = App.getTeam(teamId) || this._currentTeam;
        if (!team) return;

        const withEmail = team.participants.filter(p => p.email);
        if (withEmail.length === 0) {
            UI.toast('No participants in this team have email addresses.', 'warning');
            return;
        }

        if (!this.isEmailConfigured(App.state.settings)) {
            UI.toast('Please configure EmailJS in Settings first.', 'warning');
            App.navigateTo('settings');
            return;
        }

        const btn = document.getElementById('btn-send-all');
        const progressEl = document.getElementById('bulk-send-progress');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        if (progressEl) {
            progressEl.classList.remove('hidden');
            progressEl.innerHTML = '<div class="progress-label">Preparing emails…</div>';
        }

        const result = await this.sendTeamEmails(team, App.state.settings, (current, total, name) => {
            if (progressEl) {
                const pct = Math.round((current / total) * 100);
                progressEl.innerHTML = `
                  <div class="progress-label">Sending ${current}/${total} — ${Utils.escapeHtml(name)}</div>
                  <div class="progress-bar-track" style="margin-top:6px">
                    <div class="progress-bar-fill" style="width:${pct}%"></div>
                  </div>`;
            }
        });

        if (btn) { btn.disabled = false; btn.textContent = '✉ Email All Participants (EmailJS)'; }
        if (progressEl) {
            progressEl.innerHTML = `
              <div class="progress-label" style="color:#22C55E">
                ✓ Done — ${result.sent} sent${result.failed > 0 ? `, ${result.failed} failed` : ''}.
              </div>`;
        }

        if (result.sent > 0) {
            UI.toast(`✓ ${result.sent} email(s) sent successfully.`, 'success');
        }
        if (result.errors.length > 0) {
            result.errors.forEach(e => UI.toast(`✕ ${e.name}: ${e.error}`, 'error', 5000));
        }
    },

    // -------------------------------------------------------------------------
    // PRINT ALL QR CODES / PASSES
    // -------------------------------------------------------------------------
    async printAllQR(teamId) {
        const team = App.getTeam(teamId) || this._currentTeam;
        if (!team) return;

        UI.toast('Preparing print passes…', 'info', 2000);

        // Generate all QR data URLs
        const qrImages = await Promise.all(
            team.participants.map(async p => {
                try {
                    const url = await this.generateQRDataURL(p.qrId, 300);
                    return { participant: p, dataURL: url };
                } catch {
                    return { participant: p, dataURL: null };
                }
            })
        );

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            UI.toast('Pop-up blocked. Please allow pop-ups to print passes.', 'warning');
            return;
        }

        const cards = qrImages.map(({ participant: p, dataURL }) => `
          <div class="print-card">
            <div class="print-event">${Utils.escapeHtml(App.state.settings.hackathonName)}</div>
            ${dataURL ? `<img src="${dataURL}" alt="QR Code" class="print-qr"/>` : `<div class="print-qr-placeholder">QR: ${Utils.escapeHtml(p.qrId)}</div>`}
            <div class="print-name">${Utils.escapeHtml(p.name)}</div>
            <div class="print-team">${Utils.escapeHtml(team.teamName)} · ${Utils.escapeHtml(team.teamId)}</div>
            <div class="print-roll">${Utils.escapeHtml(p.rollNo || '')}</div>
            <div class="print-qr-text">${Utils.escapeHtml(p.qrId)}</div>
          </div>`).join('');

        printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QR Passes — ${Utils.escapeHtml(team.teamName)}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 16px; background: #fff; color: #111; }
    h1 { font-size: 1.1rem; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .print-card {
      border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      page-break-inside: avoid; text-align: center;
    }
    .print-event { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; color: #6b7280; text-transform: uppercase; }
    .print-qr { width: 140px; height: 140px; object-fit: contain; }
    .print-qr-placeholder { width: 140px; height: 140px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #6b7280; border-radius: 6px; }
    .print-name { font-size: 0.95rem; font-weight: 700; color: #111; margin-top: 4px; }
    .print-team { font-size: 0.75rem; color: #2563EB; font-weight: 600; }
    .print-roll { font-size: 0.7rem; color: #6b7280; }
    .print-qr-text { font-size: 0.62rem; font-family: monospace; color: #4b5563; background: #f3f4f6; padding: 3px 6px; border-radius: 4px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>⚡ ${Utils.escapeHtml(App.state.settings.hackathonName)} — Check-in QR Passes: ${Utils.escapeHtml(team.teamName)}</h1>
  <div class="grid">${cards}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 350);<\/script>
</body>
</html>`);
        printWindow.document.close();
    },
};
