/**
 * HACKCHECK - Pages Module
 * Each function renders a page into #main-content.
 */

const Pages = {

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    dashboard() {
        const stats = App.getStats();
        const recentCheckIns = App.getRecentCheckIns(8);
        const settings = App.state.settings;

        // Build team-wise summary (top 5)
        const teamSummary = App.state.teams.slice(0, 8).map(team => {
            const total = team.participants.length;
            const present = team.participants.filter(p => p.attendance.status === 'PRESENT').length;
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
            return { team, total, present, pct };
        });

        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">${Utils.escapeHtml(settings.hackathonName)}</h1>
      <p class="page-sub">${Utils.escapeHtml(settings.deskName)} · ${Utils.escapeHtml(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-accent" onclick="App.navigateTo('scanner')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
        Scan QR
      </button>
    </div>
  </div>

  <!-- Stat Cards -->
  <div class="stats-grid">
    ${UI.statCard({ label: 'Total Teams', value: stats.totalTeams, icon: '🏆' })}
    ${UI.statCard({ label: 'Total Participants', value: stats.totalParticipants, icon: '👥' })}
    ${UI.statCard({ label: 'Checked In', value: stats.checkedIn, icon: '✅', color: '#22C55E' })}
    ${UI.statCard({ label: 'Pending', value: stats.pending, icon: '⏳', color: '#F59E0B' })}
    ${UI.statCard({ label: 'Attendance', value: `${stats.percentage}%`, icon: '📊', accent: true, color: '#2563EB' })}
  </div>

  <!-- Progress Bar -->
  <div class="card mb-24">
    <div class="card-header">
      <span class="card-title">Overall Attendance Progress</span>
      <span class="badge badge-accent">${stats.percentage}%</span>
    </div>
    <div class="progress-bar-wrap">
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${stats.percentage}%"></div>
      </div>
      <div class="progress-labels">
        <span style="color:#22C55E">${stats.checkedIn} Present</span>
        <span style="color:#F59E0B">${stats.pending} Pending</span>
      </div>
    </div>
  </div>

  <div class="two-col-grid">
    <!-- Recent Check-ins -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Recent Check-ins</span>
        <span class="badge">${recentCheckIns.length}</span>
      </div>
      ${recentCheckIns.length === 0 ? `
        <div class="empty-mini">
          <span>No check-ins yet</span>
        </div>` : `
        <ul class="checkin-list">
          ${recentCheckIns.map(ci => `
            <li class="checkin-item">
              <div class="checkin-avatar">${Utils.escapeHtml(ci.participant.name.charAt(0))}</div>
              <div class="checkin-info">
                <div class="checkin-name">${Utils.escapeHtml(ci.participant.name)}</div>
                <div class="checkin-team">${Utils.escapeHtml(ci.team.teamName)} · ${Utils.escapeHtml(ci.team.teamId)}</div>
              </div>
              <div class="checkin-time">${Utils.formatTime(ci.checkInTime)}</div>
            </li>`).join('')}
        </ul>`}
    </div>

    <!-- Team Summary -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Team Attendance</span>
        <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('teams')">View All →</button>
      </div>
      ${teamSummary.length === 0 ? `
        <div class="empty-mini"><span>No teams imported yet</span></div>` : `
        <ul class="team-summary-list">
          ${teamSummary.map(({ team, total, present, pct }) => `
            <li class="team-summary-item">
              <div class="team-summary-info">
                <div class="team-summary-name">${Utils.escapeHtml(team.teamName)}</div>
                <div class="team-summary-id">${Utils.escapeHtml(team.teamId)} · ${Utils.escapeHtml(team.college)}</div>
              </div>
              <div class="team-summary-right">
                <span class="team-summary-count">${present}/${total}</span>
                <div class="mini-progress">
                  <div class="mini-progress-fill" style="width:${pct}%"></div>
                </div>
              </div>
            </li>`).join('')}
        </ul>`}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="card mt-24">
    <div class="card-header"><span class="card-title">Quick Actions</span></div>
    <div class="quick-actions">
      <button class="quick-action-btn" onclick="App.navigateTo('scanner')">
        <span class="quick-action-icon">📷</span>
        <span>Scan QR</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigateTo('importCSV')">
        <span class="quick-action-icon">📂</span>
        <span>Import CSV</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigateTo('teams')">
        <span class="quick-action-icon">👥</span>
        <span>Manage Teams</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigateTo('exportCSV')">
        <span class="quick-action-icon">📤</span>
        <span>Export</span>
      </button>
    </div>
  </div>
</div>`;
        App.updateHeaderStats();
    },

    // =========================================================================
    // QR SCANNER
    // =========================================================================
    scanner() {
        const settings = App.state.settings;
        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">QR Scanner</h1>
      <p class="page-sub">Scan participant QR codes to mark attendance</p>
    </div>
  </div>

  <div class="scanner-layout">
    <!-- Camera Scanner -->
    <div class="card scanner-card">
      <div class="scanner-label">SCAN PARTICIPANT</div>
      <div class="scanner-viewport-wrap">
        <div id="scanner-viewport" class="scanner-viewport">
          <div class="scanner-frame">
            <div class="scanner-corner tl"></div>
            <div class="scanner-corner tr"></div>
            <div class="scanner-corner bl"></div>
            <div class="scanner-corner br"></div>
            <div class="scanner-line"></div>
          </div>
        </div>
        <div id="scanner-status" class="scanner-status-overlay">
          <div class="scanner-idle-text">Camera not started</div>
        </div>
      </div>
      <p class="scanner-hint">Point the QR code inside the frame</p>

      <div class="scanner-controls">
        <button id="btn-start-scan" class="btn btn-accent btn-lg" onclick="Scanner.start()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          Start Camera
        </button>
        <button id="btn-stop-scan" class="btn btn-ghost btn-lg hidden" onclick="Scanner.stop()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6"/>
          </svg>
          Stop Camera
        </button>
      </div>
    </div>

    <!-- Manual + Result Panel -->
    <div class="scanner-right-panel">
      <!-- Manual Input -->
      <div class="card">
        <div class="card-header"><span class="card-title">Manual / USB Scanner Input</span></div>
        <p class="card-desc">USB/Bluetooth barcode scanners work automatically here.</p>
        <div class="manual-input-group">
          <input type="text" id="manual-qr-input" class="form-input manual-input"
            placeholder="Enter or scan QR ID..." autocomplete="off" spellcheck="false"
            aria-label="QR Code manual input"/>
          <button class="btn btn-accent" onclick="Scanner.processManual()" id="btn-manual-submit">Submit</button>
        </div>
      </div>

      <!-- Result -->
      <div id="scan-result-panel" class="scan-result-panel hidden">
        <!-- Filled by Scanner.showResult() -->
      </div>
    </div>
  </div>
</div>`;

        Scanner.init(settings);
    },

    // =========================================================================
    // TEAMS
    // =========================================================================
    teams({ search = '' } = {}) {
        const results = App.searchTeams(search);

        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Teams</h1>
      <p class="page-sub">${App.state.teams.length} team(s) · ${App.state.teams.reduce((s, t) => s + t.participants.length, 0)} participant(s)</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-accent" onclick="Pages.addTeamModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Team
      </button>
    </div>
  </div>

  <!-- Search -->
  <div class="card mb-24">
    <div class="search-row">
      <div class="search-input-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" id="team-search" class="form-input search-input" placeholder="Search by team name, ID, college, participant..." 
          value="${Utils.escapeHtml(search)}" autocomplete="off" aria-label="Search teams"/>
      </div>
      <button class="btn btn-ghost" onclick="Pages.teams({ search: '' })">Clear</button>
    </div>
  </div>

  ${results.length === 0 ? (App.state.teams.length === 0 ?
            UI.emptyState('👥', 'No teams yet', 'Import a CSV or add a team manually.',
                `<div class="mt-16 flex gap-12">
            <button class="btn btn-accent" onclick="App.navigateTo('importCSV')">Import CSV</button>
            <button class="btn btn-ghost" onclick="Pages.addTeamModal()">Add Team</button>
          </div>`) :
            UI.emptyState('🔍', 'No results', `No teams match "${Utils.escapeHtml(search)}"`, '')) :
            `<div class="table-wrap">
      <table class="data-table" role="table">
        <thead>
          <tr>
            <th>Team ID</th><th>Team Name</th><th>College</th>
            <th class="text-center">Total</th><th class="text-center">Present</th>
            <th class="text-center">Pending</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(team => {
                const total = team.participants.length;
                const present = team.participants.filter(p => p.attendance.status === 'PRESENT').length;
                const pending = total - present;
                return `
            <tr>
              <td><span class="badge">${Utils.escapeHtml(team.teamId)}</span></td>
              <td class="fw-500">${Utils.escapeHtml(team.teamName)}</td>
              <td class="text-secondary">${Utils.escapeHtml(team.college)}</td>
              <td class="text-center">${total}</td>
              <td class="text-center" style="color:#22C55E">${present}</td>
              <td class="text-center" style="color:#F59E0B">${pending}</td>
              <td>
                <div class="action-row">
                  <button class="btn btn-ghost btn-sm" onclick="Pages.viewTeam('${Utils.escapeHtml(team.teamId)}')" aria-label="View team ${Utils.escapeHtml(team.teamName)}">View</button>
                  <button class="btn btn-ghost btn-sm" onclick="QREmail.showTeamQRModal(App.getTeam('${Utils.escapeHtml(team.teamId)}'), App.state.settings)" title="View QR Passes & Send Emails">📱 QR / Mail</button>
                  <button class="btn btn-ghost btn-sm" onclick="Pages.editTeam('${Utils.escapeHtml(team.teamId)}')" aria-label="Edit team ${Utils.escapeHtml(team.teamName)}">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="Pages.deleteTeam('${Utils.escapeHtml(team.teamId)}')" aria-label="Delete team ${Utils.escapeHtml(team.teamName)}">Delete</button>
                </div>
              </td>
            </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>`}
</div>`;

        // Live search
        const searchInput = document.getElementById('team-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(e => {
                Pages.teams({ search: e.target.value });
            }, 250));
        }
    },

    // =========================================================================
    // VIEW TEAM
    // =========================================================================
    viewTeam(teamId) {
        const team = App.getTeam(teamId);
        if (!team) { UI.toast('Team not found.', 'error'); return; }

        const total = team.participants.length;
        const present = team.participants.filter(p => p.attendance.status === 'PRESENT').length;
        const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

        UI.showModal({
            title: `${team.teamName} · ${team.teamId}`,
            size: 'lg',
            body: `
              <div class="view-team-header">
                <span class="text-secondary">${Utils.escapeHtml(team.college)}</span>
                <span class="view-team-stat">${present}/${total} Present · ${pct}% Attendance</span>
              </div>
              <div class="progress-bar-track mb-16">
                <div class="progress-bar-fill" style="width:${pct}%"></div>
              </div>
              <ul class="participant-list">
                ${team.participants.map(p => `
                  <li class="participant-item ${p.attendance.status === 'PRESENT' ? 'present' : 'pending'}">
                    <div class="p-status-dot ${p.attendance.status === 'PRESENT' ? 'dot-present' : 'dot-pending'}"></div>
                    <div class="p-info">
                      <div class="p-name">${Utils.escapeHtml(p.name)}</div>
                      <div class="p-meta">${Utils.escapeHtml(p.rollNo)} · ${Utils.escapeHtml(p.email)}</div>
                      <div class="p-qr">QR: <code>${Utils.escapeHtml(p.qrId)}</code></div>
                    </div>
                    <div class="p-right">
                      <span class="status-badge ${p.attendance.status === 'PRESENT' ? 'status-present' : 'status-pending'}">
                        ${p.attendance.status === 'PRESENT' ? '✓ PRESENT' : '✕ PENDING'}
                      </span>
                      ${p.attendance.status === 'PRESENT' ? `<div class="p-time">${Utils.formatTime(p.attendance.checkInTime)}</div>` : ''}
                    </div>
                  </li>`).join('')}
              </ul>`,
            actions: [
                { label: '📱 QR Codes & Email', class: 'btn-accent', id: 'qr-email', handler: () => { UI.closeModal(); QREmail.showTeamQRModal(team, App.state.settings); } },
                { label: 'Edit Team', class: 'btn-ghost', id: 'edit', handler: () => { UI.closeModal(); Pages.editTeam(teamId); } },
                { label: 'Close', class: 'btn-ghost', id: 'close', handler: () => UI.closeModal() },
            ],
        });
    },

    // =========================================================================
    // ADD TEAM MODAL
    // =========================================================================
    addTeamModal() {
        UI.showModal({
            title: 'Add New Team',
            size: 'lg',
            body: `
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="at-teamid">Team ID <span class="required">*</span></label>
                  <input type="text" id="at-teamid" class="form-input" placeholder="e.g. T006" autocomplete="off"/>
                </div>
                <div class="form-group">
                  <label class="form-label" for="at-teamname">Team Name <span class="required">*</span></label>
                  <input type="text" id="at-teamname" class="form-input" placeholder="e.g. Code Warriors" autocomplete="off"/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="at-college">College / Institution</label>
                <input type="text" id="at-college" class="form-input" placeholder="e.g. VIT University" autocomplete="off"/>
              </div>

              <div class="section-divider">Participants</div>
              <div id="at-participants-list"></div>
              <button class="btn btn-ghost btn-sm mt-8" onclick="Pages._addParticipantRow('at-participants-list')">
                + Add Participant
              </button>
              <div id="at-error" class="form-error hidden"></div>`,
            actions: [
                { label: 'Cancel', class: 'btn-ghost', id: 'cancel', handler: () => UI.closeModal() },
                { label: 'Create Team', class: 'btn-accent', id: 'save', handler: () => Pages._saveAddTeam() },
            ],
        });
        Pages._addParticipantRow('at-participants-list');
    },

    _addParticipantRow(containerId, pData = {}) {
        const container = document.getElementById(containerId);
        const idx = container.children.length;
        const div = document.createElement('div');
        div.className = 'participant-form-row';
        div.dataset.idx = idx;
        div.innerHTML = `
          <div class="participant-form-grid">
            <div class="form-group">
              <label class="form-label">Name <span class="required">*</span></label>
              <input type="text" class="form-input pf-name" placeholder="Full Name" value="${Utils.escapeHtml(pData.name || '')}" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input type="text" class="form-input pf-roll" placeholder="Roll No." value="${Utils.escapeHtml(pData.rollNo || '')}" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input pf-email" placeholder="email@example.com" value="${Utils.escapeHtml(pData.email || '')}" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input pf-phone" placeholder="Phone" value="${Utils.escapeHtml(pData.phone || '')}" autocomplete="off"/>
            </div>
          </div>
          <button class="btn btn-danger btn-sm btn-remove-p" onclick="this.closest('.participant-form-row').remove()" aria-label="Remove participant">✕ Remove</button>
          <hr class="row-divider"/>`;
        container.appendChild(div);
    },

    _saveAddTeam() {
        const teamId = document.getElementById('at-teamid').value.trim();
        const teamName = document.getElementById('at-teamname').value.trim();
        const college = document.getElementById('at-college').value.trim();
        const errEl = document.getElementById('at-error');

        const pRows = document.querySelectorAll('#at-participants-list .participant-form-row');
        const participants = [];
        for (const row of pRows) {
            const name = row.querySelector('.pf-name').value.trim();
            if (!name) continue;
            participants.push({
                name,
                rollNo: row.querySelector('.pf-roll').value.trim(),
                email: row.querySelector('.pf-email').value.trim(),
                phone: row.querySelector('.pf-phone').value.trim(),
            });
        }

        const result = App.addTeam({ teamId, teamName, college, participants });
        if (!result.success) {
            errEl.textContent = result.error;
            errEl.classList.remove('hidden');
            return;
        }
        UI.closeModal();
        UI.toast(`Team "${teamName}" created successfully!`, 'success');
        Pages.teams();

        // Immediately open the QR Codes & Email dispatch modal
        setTimeout(() => {
            if (typeof QREmail !== 'undefined' && result.team) {
                QREmail.showTeamQRModal(result.team, App.state.settings);

                // Auto-send if enabled and EmailJS credentials configured
                if (App.state.settings.autoSendQROnAdd && QREmail.isEmailConfigured(App.state.settings)) {
                    setTimeout(() => {
                        QREmail._sendAllEmails(result.team.teamId);
                    }, 400);
                }
            }
        }, 150);
    },

    // =========================================================================
    // EDIT TEAM
    // =========================================================================
    editTeam(teamId) {
        const team = App.getTeam(teamId);
        if (!team) { UI.toast('Team not found.', 'error'); return; }

        UI.showModal({
            title: `Edit Team: ${team.teamName}`,
            size: 'xl',
            body: `
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label" for="et-teamid">Team ID <span class="required">*</span></label>
                  <input type="text" id="et-teamid" class="form-input" value="${Utils.escapeHtml(team.teamId)}" autocomplete="off"/>
                </div>
                <div class="form-group">
                  <label class="form-label" for="et-teamname">Team Name <span class="required">*</span></label>
                  <input type="text" id="et-teamname" class="form-input" value="${Utils.escapeHtml(team.teamName)}" autocomplete="off"/>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="et-college">College</label>
                <input type="text" id="et-college" class="form-input" value="${Utils.escapeHtml(team.college)}" autocomplete="off"/>
              </div>

              <div class="section-divider">Participants</div>
              <div id="et-participants-list">
                ${team.participants.map(p => Pages._editParticipantRowHTML(p)).join('')}
              </div>
              <button class="btn btn-ghost btn-sm mt-8" onclick="Pages._addEditParticipantRow()">
                + Add Participant
              </button>
              <div id="et-error" class="form-error hidden"></div>`,
            actions: [
                { label: 'Cancel', class: 'btn-ghost', id: 'cancel', handler: () => UI.closeModal() },
                { label: 'Save Changes', class: 'btn-accent', id: 'save', handler: () => Pages._saveEditTeam(teamId) },
            ],
        });
    },

    _editParticipantRowHTML(p) {
        const statusBadge = p.attendance.status === 'PRESENT'
            ? `<span class="status-badge status-present">✓ PRESENT · ${Utils.formatTime(p.attendance.checkInTime)}</span>`
            : `<span class="status-badge status-pending">✕ PENDING</span>`;
        return `
          <div class="participant-form-row" data-pid="${Utils.escapeHtml(p.participantId)}">
            <div class="participant-form-grid">
              <input type="hidden" class="pf-pid" value="${Utils.escapeHtml(p.participantId)}"/>
              <div class="form-group">
                <label class="form-label">Name <span class="required">*</span></label>
                <input type="text" class="form-input pf-name" value="${Utils.escapeHtml(p.name)}" placeholder="Full Name" autocomplete="off"/>
              </div>
              <div class="form-group">
                <label class="form-label">Roll Number</label>
                <input type="text" class="form-input pf-roll" value="${Utils.escapeHtml(p.rollNo)}" placeholder="Roll No." autocomplete="off"/>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input pf-email" value="${Utils.escapeHtml(p.email)}" placeholder="email@example.com" autocomplete="off"/>
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" class="form-input pf-phone" value="${Utils.escapeHtml(p.phone)}" placeholder="Phone" autocomplete="off"/>
              </div>
            </div>
            <div class="p-edit-footer">
              ${statusBadge}
              <button class="btn btn-danger btn-sm" onclick="this.closest('.participant-form-row').remove()" aria-label="Remove participant">✕ Remove</button>
            </div>
            <hr class="row-divider"/>
          </div>`;
    },

    _addEditParticipantRow() {
        const container = document.getElementById('et-participants-list');
        const div = document.createElement('div');
        div.className = 'participant-form-row';
        div.innerHTML = `
          <div class="participant-form-grid">
            <input type="hidden" class="pf-pid" value=""/>
            <div class="form-group">
              <label class="form-label">Name <span class="required">*</span></label>
              <input type="text" class="form-input pf-name" placeholder="Full Name" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input type="text" class="form-input pf-roll" placeholder="Roll No." autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input pf-email" placeholder="email@example.com" autocomplete="off"/>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input pf-phone" placeholder="Phone" autocomplete="off"/>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="this.closest('.participant-form-row').remove()" aria-label="Remove participant">✕ Remove</button>
          <hr class="row-divider"/>`;
        container.appendChild(div);
        div.querySelector('.pf-name').focus();
    },

    _saveEditTeam(originalTeamId) {
        const teamId = document.getElementById('et-teamid').value.trim();
        const teamName = document.getElementById('et-teamname').value.trim();
        const college = document.getElementById('et-college').value.trim();
        const errEl = document.getElementById('et-error');

        if (!teamId || !teamName) {
            errEl.textContent = 'Team ID and Team Name are required.';
            errEl.classList.remove('hidden');
            return;
        }

        const pRows = document.querySelectorAll('#et-participants-list .participant-form-row');
        const participants = [];
        for (const row of pRows) {
            const name = row.querySelector('.pf-name').value.trim();
            if (!name) continue;
            participants.push({
                participantId: row.querySelector('.pf-pid').value.trim() || null,
                name,
                rollNo: row.querySelector('.pf-roll').value.trim(),
                email: row.querySelector('.pf-email').value.trim(),
                phone: row.querySelector('.pf-phone').value.trim(),
            });
        }

        const result = App.updateTeam(originalTeamId, { teamId, teamName, college, participants });
        if (!result.success) {
            errEl.textContent = result.error;
            errEl.classList.remove('hidden');
            return;
        }
        UI.closeModal();
        UI.toast('Team updated successfully.', 'success');
        Pages.teams();
    },

    // =========================================================================
    // DELETE TEAM
    // =========================================================================
    deleteTeam(teamId) {
        const team = App.getTeam(teamId);
        if (!team) return;

        const confirmDelete = () => {
            const result = App.deleteTeam(teamId);
            if (result.success) {
                UI.toast(`Team "${team.teamName}" deleted.`, 'success');
                Pages.teams();
            } else {
                UI.toast(result.error, 'error');
            }
        };

        if (App.state.settings.confirmBeforeDelete) {
            UI.confirm({
                title: 'Delete Team?',
                message: `This will permanently remove "${team.teamName}" (${team.teamId}) and all ${team.participants.length} participant record(s).`,
                confirmLabel: 'Delete Team',
                confirmClass: 'btn-danger',
                onConfirm: confirmDelete,
            });
        } else {
            confirmDelete();
        }
    },

    // =========================================================================
    // IMPORT CSV
    // =========================================================================
    importCSV() {
        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <h1 class="page-title">Import CSV</h1>
    <p class="page-sub">Import registered teams and participants from a CSV file</p>
  </div>

  <!-- Format Guide -->
  <div class="card mb-24">
    <div class="card-header"><span class="card-title">Expected CSV Format</span></div>
    <p class="card-desc mb-12">Your CSV should have these columns (header row optional):</p>
    <div class="csv-format-table">
      <table class="data-table">
        <thead><tr>
          <th>Team ID</th><th>Team Name</th><th>College</th>
          <th>Participant Name</th><th>Roll Number</th><th>Email</th><th>Phone</th>
        </tr></thead>
        <tbody><tr>
          <td>T001</td><td>Code Warriors</td><td>St. Peter's Engg.</td>
          <td>Bala Reddy</td><td>24BK1A05BK</td><td>bala@email.com</td><td>9876543210</td>
        </tr></tbody>
      </table>
    </div>
    <p class="card-desc mt-12" style="color: #F59E0B">⚠ Existing participant attendance will be preserved when re-importing.</p>
  </div>

  <!-- Drop Zone -->
  <div class="card">
    <div id="csv-drop-zone" class="drop-zone" tabindex="0" role="button" aria-label="Drop CSV file here or click to browse">
      <div class="drop-zone-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" class="drop-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p class="drop-text">Drop your CSV file here</p>
        <p class="drop-sub">or</p>
        <button class="btn btn-accent" onclick="document.getElementById('csv-file-input').click()">Browse Files</button>
        <input type="file" id="csv-file-input" accept=".csv,text/csv" class="hidden" aria-label="Select CSV file"/>
      </div>
    </div>

    <!-- Paste -->
    <div class="mt-16">
      <label class="form-label" for="csv-paste">Or paste CSV text directly:</label>
      <textarea id="csv-paste" class="form-input csv-textarea" rows="6"
        placeholder="Paste CSV content here..."></textarea>
    </div>

    <div class="mt-16 flex gap-12">
      <button class="btn btn-accent btn-lg" onclick="Pages._processImport()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Import CSV
      </button>
      <button class="btn btn-ghost" onclick="document.getElementById('csv-file-input').value=''; document.getElementById('csv-paste').value='';">Clear</button>
    </div>
  </div>

  <div id="import-result" class="mt-24 hidden"></div>
</div>`;

        // File input handler
        const fileInput = document.getElementById('csv-file-input');
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                document.getElementById('csv-paste').value = ev.target.result;
            };
            reader.readAsText(file);
        });

        // Drag & drop
        const dropZone = document.getElementById('csv-drop-zone');
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { document.getElementById('csv-paste').value = ev.target.result; };
            reader.readAsText(file);
        });
        dropZone.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') document.getElementById('csv-file-input').click();
        });
    },

    _processImport() {
        const csvText = document.getElementById('csv-paste')?.value?.trim();
        if (!csvText) {
            UI.toast('Please provide a CSV file or paste CSV content.', 'warning');
            return;
        }

        const result = App.importCSV(csvText);
        const resultEl = document.getElementById('import-result');

        if (!result.success) {
            resultEl.innerHTML = `
              <div class="card border-error">
                <div class="card-header"><span class="card-title" style="color:#EF4444">Import Failed</span></div>
                <p>${Utils.escapeHtml(result.error)}</p>
              </div>`;
            resultEl.classList.remove('hidden');
            return;
        }

        const { summary, errorRows } = result;
        resultEl.innerHTML = `
          <div class="card border-success">
            <div class="card-header">
              <span class="card-title" style="color:#22C55E">✓ Import Complete</span>
            </div>
            <div class="import-summary-grid">
              <div class="import-summary-item">
                <span class="import-summary-value">${summary.teamsImported}</span>
                <span class="import-summary-label">Teams</span>
              </div>
              <div class="import-summary-item">
                <span class="import-summary-value">${summary.participantsNew + summary.participantsUpdated}</span>
                <span class="import-summary-label">Total Participants</span>
              </div>
              <div class="import-summary-item">
                <span class="import-summary-value" style="color:#22C55E">${summary.participantsNew}</span>
                <span class="import-summary-label">New</span>
              </div>
              <div class="import-summary-item">
                <span class="import-summary-value" style="color:#2563EB">${summary.participantsUpdated}</span>
                <span class="import-summary-label">Updated</span>
              </div>
              <div class="import-summary-item">
                <span class="import-summary-value" style="color:${summary.errors > 0 ? '#EF4444' : '#A1A1AA'}">${summary.errors}</span>
                <span class="import-summary-label">Errors</span>
              </div>
            </div>
            <div class="mt-16 flex gap-12">
              <button class="btn btn-accent" onclick="App.navigateTo('teams')">View Teams →</button>
              <button class="btn btn-ghost" onclick="App.navigateTo('dashboard')">Dashboard</button>
            </div>
          </div>
          ${errorRows.length > 0 ? `
            <div class="card mt-16 border-error">
              <div class="card-header"><span class="card-title" style="color:#EF4444">⚠ ${errorRows.length} Row(s) Had Errors</span></div>
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr><th>Row #</th><th>Data</th><th>Reason</th></tr></thead>
                  <tbody>
                    ${errorRows.map(er => `
                      <tr>
                        <td>${er.row}</td>
                        <td><code style="font-size:0.75rem">${Utils.escapeHtml(er.data)}</code></td>
                        <td style="color:#EF4444">${Utils.escapeHtml(er.reason)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>` : ''}`;
        resultEl.classList.remove('hidden');
        resultEl.scrollIntoView({ behavior: 'smooth' });
        UI.toast(`Import complete: ${summary.participantsNew} new, ${summary.participantsUpdated} updated.`, 'success');
    },

    // =========================================================================
    // EXPORT CSV
    // =========================================================================
    exportCSV() {
        const stats = App.getStats();
        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <h1 class="page-title">Export CSV</h1>
    <p class="page-sub">Download attendance data in various formats</p>
  </div>

  <div class="export-grid">
    <div class="card export-card">
      <div class="export-icon">📋</div>
      <div class="export-title">Complete Attendance</div>
      <div class="export-desc">All participants with attendance status and check-in times</div>
      <div class="export-meta">${stats.totalParticipants} rows</div>
      <button class="btn btn-accent mt-auto" onclick="Pages._exportComplete()" ${stats.totalParticipants === 0 ? 'disabled' : ''}>
        Download CSV
      </button>
    </div>

    <div class="card export-card">
      <div class="export-icon" style="color:#22C55E">✅</div>
      <div class="export-title">Present Participants</div>
      <div class="export-desc">Only participants who have checked in</div>
      <div class="export-meta" style="color:#22C55E">${stats.checkedIn} rows</div>
      <button class="btn btn-accent mt-auto" onclick="Pages._exportPresent()" ${stats.checkedIn === 0 ? 'disabled' : ''}>
        Download CSV
      </button>
    </div>

    <div class="card export-card">
      <div class="export-icon" style="color:#F59E0B">⏳</div>
      <div class="export-title">Pending Participants</div>
      <div class="export-desc">Participants who haven't checked in yet</div>
      <div class="export-meta" style="color:#F59E0B">${stats.pending} rows</div>
      <button class="btn btn-accent mt-auto" onclick="Pages._exportPending()" ${stats.pending === 0 ? 'disabled' : ''}>
        Download CSV
      </button>
    </div>

    <div class="card export-card">
      <div class="export-icon">🏆</div>
      <div class="export-title">Team Summary</div>
      <div class="export-desc">Per-team attendance summary with percentages</div>
      <div class="export-meta">${stats.totalTeams} teams</div>
      <button class="btn btn-accent mt-auto" onclick="Pages._exportSummary()" ${stats.totalTeams === 0 ? 'disabled' : ''}>
        Download CSV
      </button>
    </div>
  </div>

  ${stats.totalTeams === 0 ? `
    <div class="mt-24">
      ${UI.emptyState('📭', 'No data to export', 'Import participants first.',
            `<button class="btn btn-accent mt-16" onclick="App.navigateTo('importCSV')">Import CSV</button>`)}
    </div>` : ''}
</div>`;
    },

    _exportComplete() {
        const csv = CSV.exportComplete(App.state.teams);
        Utils.downloadFile(csv, `hackcheck-complete-${Utils.todayString()}.csv`);
        UI.toast('Complete attendance exported.', 'success');
    },
    _exportPresent() {
        const csv = CSV.exportPresent(App.state.teams);
        Utils.downloadFile(csv, `hackcheck-present-${Utils.todayString()}.csv`);
        UI.toast('Present participants exported.', 'success');
    },
    _exportPending() {
        const csv = CSV.exportPending(App.state.teams);
        Utils.downloadFile(csv, `hackcheck-pending-${Utils.todayString()}.csv`);
        UI.toast('Pending participants exported.', 'success');
    },
    _exportSummary() {
        const csv = CSV.exportTeamSummary(App.state.teams);
        Utils.downloadFile(csv, `hackcheck-team-summary-${Utils.todayString()}.csv`);
        UI.toast('Team summary exported.', 'success');
    },

    // =========================================================================
    // SETTINGS
    // =========================================================================
    settings() {
        const s = App.state.settings;
        document.getElementById('main-content').innerHTML = `
<div class="page">
  <div class="page-header">
    <h1 class="page-title">Settings</h1>
    <p class="page-sub">Configure HACKCHECK for your event</p>
  </div>

  <!-- Event Settings -->
  <div class="card mb-24">
    <div class="card-header"><span class="card-title">Event Configuration</span></div>
    <div class="settings-form">
      <div class="form-group">
        <label class="form-label" for="s-event-name">Hackathon Name</label>
        <input type="text" id="s-event-name" class="form-input" value="${Utils.escapeHtml(s.hackathonName)}" placeholder="My Hackathon 2026"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-desk-name">Registration Desk Name</label>
        <input type="text" id="s-desk-name" class="form-input" value="${Utils.escapeHtml(s.deskName)}" placeholder="Registration Desk"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-auto-delay">Auto-return Scanner Delay (seconds)</label>
        <input type="number" id="s-auto-delay" class="form-input" value="${s.autoReturnDelay}" min="1" max="30" style="max-width:120px"/>
      </div>
    </div>
    <button class="btn btn-accent mt-16" onclick="Pages._saveGeneralSettings()">Save Settings</button>
  </div>

  <!-- Email & QR Dispatch (EmailJS) -->
  <div class="card mb-24">
    <div class="card-header">
      <span class="card-title">✉ Email & QR Dispatch (EmailJS)</span>
      <span class="badge ${QREmail.isEmailConfigured(s) ? 'badge-accent' : ''}">${QREmail.isEmailConfigured(s) ? '✓ Connected' : 'Not Configured'}</span>
    </div>
    <p class="card-desc mb-16">
      Send QR check-in passes directly to participant emails from the browser using EmailJS (free, no backend needed).
    </p>

    <div class="settings-form">
      <div class="form-group">
        <label class="form-label" for="s-emailjs-service">Service ID</label>
        <input type="text" id="s-emailjs-service" class="form-input" value="${Utils.escapeHtml(s.emailjsServiceId || '')}" placeholder="e.g. service_xxxxxxx"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-emailjs-template">Template ID</label>
        <input type="text" id="s-emailjs-template" class="form-input" value="${Utils.escapeHtml(s.emailjsTemplateId || '')}" placeholder="e.g. template_xxxxxxx"/>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-emailjs-publickey">Public Key (User ID)</label>
        <input type="text" id="s-emailjs-publickey" class="form-input" value="${Utils.escapeHtml(s.emailjsPublicKey || '')}" placeholder="e.g. user_xxxxxxxxxxxxxx"/>
      </div>
    </div>

    <div class="settings-toggles mt-16">
      <label class="toggle-item" for="s-auto-send-qr">
        <div class="toggle-info">
          <span class="toggle-label">Auto-send QR Emails</span>
          <span class="toggle-desc">Automatically trigger email dispatch when a new team is added</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="s-auto-send-qr" class="toggle-checkbox" ${s.autoSendQROnAdd ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </div>
      </label>
    </div>

    <div class="flex gap-12 mt-16 flex-wrap">
      <button class="btn btn-accent" onclick="Pages._saveEmailSettings()">Save Email Config</button>
      <button class="btn btn-ghost" onclick="Pages._toggleEmailGuide()">📖 2-Minute Setup Guide</button>
    </div>

    <!-- Test Email Section -->
    <div class="test-email-box mt-16" style="padding-top:16px; border-top:1px solid var(--border);">
      <div class="form-label mb-8" style="font-weight:600;">Test Email Sending</div>
      <div class="flex gap-8 flex-wrap">
        <input type="email" id="s-test-email" class="form-input" placeholder="Enter your email to test" style="max-width:320px"/>
        <button class="btn btn-ghost" onclick="Pages._sendTestEmail()" id="btn-test-email">⚡ Send Test</button>
      </div>
      <div id="test-email-status" class="mt-8"></div>
    </div>

    <!-- Collapsible Setup Guide -->
    <div id="email-setup-guide" class="email-guide-box mt-16 hidden">
      <div style="font-weight:700; color:var(--text-1); margin-bottom:8px;">🚀 How to get free EmailJS keys in 2 minutes:</div>
      <ol style="margin-left:20px; line-height:1.7; font-size:0.85rem; color:var(--text-2);">
        <li>Sign up for a free account at <a href="https://www.emailjs.com" target="_blank" style="color:var(--accent); text-decoration:underline;">emailjs.com</a> (free tier has 200 emails/month).</li>
        <li>Go to <strong>Email Services</strong> → click <strong>Add Service</strong> → connect Gmail, Outlook, or SMTP → copy your <code>Service ID</code>.</li>
        <li>Go to <strong>Email Templates</strong> → click <strong>Create New Template</strong>.
          <br/>In your template body, you can use:
          <br/><code>{{to_name}}</code>, <code>{{team_name}}</code>, <code>{{team_id}}</code>, <code>{{qr_id}}</code>, and for the QR code: <code>&lt;img src="{{qr_image}}" width="200"/&gt;</code>.
          <br/>Save and copy your <code>Template ID</code>.
        </li>
        <li>Go to <strong>Account Settings</strong> → <strong>API Keys</strong> → copy your <code>Public Key</code>.</li>
        <li>Paste the 3 keys above, click <strong>Save Email Config</strong>, and test with the test button!</li>
      </ol>
      <p style="color:var(--text-3); font-size:0.78rem; margin-top:8px;">💡 <em>Even without EmailJS configured, clicking "Mail Client" in any team modal opens your default email app with pre-filled QR text!</em></p>
    </div>
  </div>

  <!-- Scanner Settings -->
  <div class="card mb-24">
    <div class="card-header"><span class="card-title">Scanner Options</span></div>
    <div class="settings-toggles">
      <label class="toggle-item" for="s-sound">
        <div class="toggle-info">
          <span class="toggle-label">Sound Feedback</span>
          <span class="toggle-desc">Play audio on scan events</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="s-sound" class="toggle-checkbox" ${s.soundEnabled ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </div>
      </label>
      <label class="toggle-item" for="s-success-sound">
        <div class="toggle-info">
          <span class="toggle-label">Success Sound</span>
          <span class="toggle-desc">Beep on successful check-in</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="s-success-sound" class="toggle-checkbox" ${s.successSound ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </div>
      </label>
      <label class="toggle-item" for="s-error-sound">
        <div class="toggle-info">
          <span class="toggle-label">Error / Warning Sound</span>
          <span class="toggle-desc">Beep on invalid or duplicate scans</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="s-error-sound" class="toggle-checkbox" ${s.errorSound ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </div>
      </label>
      <label class="toggle-item" for="s-confirm-delete">
        <div class="toggle-info">
          <span class="toggle-label">Confirm Before Delete</span>
          <span class="toggle-desc">Show confirmation dialog when deleting teams</span>
        </div>
        <div class="toggle-wrap">
          <input type="checkbox" id="s-confirm-delete" class="toggle-checkbox" ${s.confirmBeforeDelete ? 'checked' : ''}/>
          <span class="toggle-slider"></span>
        </div>
      </label>
    </div>
    <button class="btn btn-accent mt-16" onclick="Pages._saveScannerSettings()">Save Settings</button>
  </div>

  <!-- Demo Data -->
  <div class="card mb-24">
    <div class="card-header"><span class="card-title">Demo Data</span></div>
    <p class="card-desc mb-16">Load sample teams and participants to test the system without importing a CSV.</p>
    <button class="btn btn-accent" onclick="Pages._loadDemo()">Load Demo Data</button>
  </div>

  <!-- Backup / Restore -->
  <div class="card mb-24">
    <div class="card-header"><span class="card-title">Backup & Restore</span></div>
    <p class="card-desc mb-16">Export all event data as a JSON backup. Restore from a previous backup file.</p>
    <div class="flex gap-12 flex-wrap">
      <button class="btn btn-accent" onclick="Pages._exportBackup()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export Backup
      </button>
      <button class="btn btn-ghost" onclick="document.getElementById('backup-file-input').click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Import Backup
      </button>
      <input type="file" id="backup-file-input" accept=".json" class="hidden" aria-label="Select backup file"/>
    </div>
  </div>

  <!-- Reset -->
  <div class="card border-error">
    <div class="card-header"><span class="card-title" style="color:#EF4444">⚠ Danger Zone</span></div>
    <p class="card-desc mb-16">Permanently remove all teams, participants, and attendance data. This cannot be undone.</p>
    <button class="btn btn-danger" onclick="Pages._resetData()">Reset Event Data</button>
  </div>
</div>`;

        // Toggle listeners — auto-save on toggle
        ['s-sound', 's-success-sound', 's-error-sound', 's-confirm-delete'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => Pages._saveScannerSettings());
        });

        // Backup restore
        const backupInput = document.getElementById('backup-file-input');
        backupInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                UI.confirm({
                    title: 'Restore Backup?',
                    message: `This will replace all current data with the backup from "${file.name}". Are you sure?`,
                    confirmLabel: 'Restore',
                    confirmClass: 'btn-danger',
                    onConfirm: () => {
                        const result = App.importBackup(ev.target.result);
                        if (result.success) {
                            UI.toast('Backup restored successfully.', 'success');
                            Pages.settings();
                        } else {
                            UI.toast(result.error, 'error');
                        }
                    },
                });
            };
            reader.readAsText(file);
        });
    },

    _saveGeneralSettings() {
        App.updateSettings({
            hackathonName: document.getElementById('s-event-name').value.trim() || 'HACKATHON 2026',
            deskName: document.getElementById('s-desk-name').value.trim() || 'Registration Desk',
            autoReturnDelay: parseInt(document.getElementById('s-auto-delay').value) || 3,
        });
        UI.toast('Settings saved.', 'success');
    },

    _saveScannerSettings() {
        App.updateSettings({
            soundEnabled: document.getElementById('s-sound').checked,
            successSound: document.getElementById('s-success-sound').checked,
            errorSound: document.getElementById('s-error-sound').checked,
            confirmBeforeDelete: document.getElementById('s-confirm-delete').checked,
        });
    },

    _saveEmailSettings() {
        App.updateSettings({
            emailjsServiceId: document.getElementById('s-emailjs-service')?.value?.trim() || '',
            emailjsTemplateId: document.getElementById('s-emailjs-template')?.value?.trim() || '',
            emailjsPublicKey: document.getElementById('s-emailjs-publickey')?.value?.trim() || '',
            autoSendQROnAdd: !!document.getElementById('s-auto-send-qr')?.checked,
        });
        UI.toast('Email configuration saved.', 'success');
        Pages.settings();
    },

    _toggleEmailGuide() {
        const guide = document.getElementById('email-setup-guide');
        if (guide) guide.classList.toggle('hidden');
    },

    async _sendTestEmail() {
        const toEmail = document.getElementById('s-test-email')?.value?.trim();
        const statusEl = document.getElementById('test-email-status');
        const btn = document.getElementById('btn-test-email');
        if (!toEmail) {
            UI.toast('Please enter a test recipient email address.', 'warning');
            return;
        }

        const settings = {
            emailjsServiceId: document.getElementById('s-emailjs-service')?.value?.trim(),
            emailjsTemplateId: document.getElementById('s-emailjs-template')?.value?.trim(),
            emailjsPublicKey: document.getElementById('s-emailjs-publickey')?.value?.trim(),
            hackathonName: App.state.settings.hackathonName,
        };

        if (!QREmail.isEmailConfigured(settings)) {
            UI.toast('Please enter Service ID, Template ID, and Public Key first.', 'warning');
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--text-2)">Sending test email via EmailJS…</span>';

        const res = await QREmail.sendTestEmail(toEmail, settings);

        if (btn) { btn.disabled = false; btn.textContent = '⚡ Send Test'; }
        if (res.success) {
            if (statusEl) statusEl.innerHTML = '<span style="color:#22C55E">✓ Test email sent successfully! Please check your inbox.</span>';
            UI.toast('Test email sent!', 'success');
        } else {
            if (statusEl) statusEl.innerHTML = `<span style="color:#EF4444">✕ ${Utils.escapeHtml(res.error)}</span>`;
            UI.toast(`Error: ${res.error}`, 'error');
        }
    },

    _loadDemo() {
        UI.confirm({
            title: 'Load Demo Data?',
            message: 'This will replace existing teams with demo data. Continue?',
            confirmLabel: 'Load Demo',
            confirmClass: 'btn-accent',
            onConfirm: () => {
                App.loadDemoData();
                UI.toast('Demo data loaded: 5 teams, ~20 participants.', 'success');
                App.navigateTo('dashboard');
            },
        });
    },

    _exportBackup() {
        const json = App.exportBackup();
        Utils.downloadFile(json, `hackcheck-backup-${Utils.todayString()}.json`, 'application/json');
        UI.toast('Backup exported.', 'success');
    },

    _resetData() {
        UI.confirm({
            title: 'Reset Event Data',
            message: 'This will permanently remove ALL teams, participants, and attendance data. This cannot be undone.',
            confirmLabel: 'Reset Event',
            confirmClass: 'btn-danger',
            requireType: 'RESET',
            onConfirm: () => {
                App.resetEventData();
                UI.toast('Event data reset.', 'warning');
                App.navigateTo('dashboard');
            },
        });
    },
};
