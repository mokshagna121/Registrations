/**
 * HACKCHECK - App State & Core Logic
 * Central state manager for the application.
 */

const App = {
    state: null,

    init() {
        this.state = Storage.load();
        UI.init();
        this.navigateTo('dashboard');
    },

    // -------------------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------------------
    navigateTo(page, params = {}) {
        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Render page
        const main = document.getElementById('main-content');
        main.classList.add('page-exit');
        setTimeout(() => {
            main.innerHTML = '';
            main.classList.remove('page-exit');
            main.classList.add('page-enter');
            Pages[page] ? Pages[page](params) : Pages.dashboard();
            main.classList.remove('page-enter');
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }, 80);
    },

    // -------------------------------------------------------------------------
    // SAVE
    // -------------------------------------------------------------------------
    save() {
        Storage.save(this.state);
        this.updateHeaderStats();
    },

    // -------------------------------------------------------------------------
    // STATS
    // -------------------------------------------------------------------------
    getStats() {
        const teams = this.state.teams;
        let totalParticipants = 0;
        let checkedIn = 0;

        for (const team of teams) {
            totalParticipants += team.participants.length;
            checkedIn += team.participants.filter(p => p.attendance.status === 'PRESENT').length;
        }

        return {
            totalTeams: teams.length,
            totalParticipants,
            checkedIn,
            pending: totalParticipants - checkedIn,
            percentage: totalParticipants > 0 ? ((checkedIn / totalParticipants) * 100).toFixed(1) : '0.0',
        };
    },

    updateHeaderStats() {
        const stats = this.getStats();
        const el = document.getElementById('header-stats');
        if (el) {
            el.textContent = `${stats.checkedIn}/${stats.totalParticipants} Checked In`;
        }
    },

    // -------------------------------------------------------------------------
    // PARTICIPANT LOOKUP
    // -------------------------------------------------------------------------
    findParticipantByQR(qrId) {
        for (const team of this.state.teams) {
            for (const p of team.participants) {
                if (p.qrId === qrId) {
                    return { team, participant: p };
                }
            }
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // ATTENDANCE
    // -------------------------------------------------------------------------
    checkIn(qrId) {
        const result = this.findParticipantByQR(qrId);
        if (!result) {
            return { status: 'INVALID', qrId };
        }
        const { team, participant } = result;
        if (participant.attendance.status === 'PRESENT') {
            return { status: 'DUPLICATE', team, participant };
        }
        participant.attendance.status = 'PRESENT';
        participant.attendance.checkInTime = Utils.now();
        this.save();
        return { status: 'SUCCESS', team, participant };
    },

    // -------------------------------------------------------------------------
    // TEAM CRUD
    // -------------------------------------------------------------------------
    addTeam(teamData) {
        // teamData: { teamId, teamName, college, participants: [{name, rollNo, email, phone}] }
        if (!teamData.teamId || !teamData.teamName) {
            return { success: false, error: 'Team ID and Team Name are required.' };
        }
        if (this.state.teams.find(t => t.teamId === teamData.teamId)) {
            return { success: false, error: `Team ID "${teamData.teamId}" already exists.` };
        }
        const participants = (teamData.participants || []).map(p => {
            const participantId = Utils.shortId('P');
            return {
                participantId,
                qrId: Utils.generateQRId(teamData.teamId, participantId),
                name: p.name || '',
                rollNo: p.rollNo || '',
                email: p.email || '',
                phone: p.phone || '',
                attendance: { status: 'PENDING', checkInTime: null },
            };
        });
        const newTeam = {
            teamId: teamData.teamId,
            teamName: teamData.teamName,
            college: teamData.college || '',
            participants,
        };
        this.state.teams.push(newTeam);
        this.save();
        return { success: true, team: newTeam };
    },

    updateTeam(teamId, updates) {
        const team = this.state.teams.find(t => t.teamId === teamId);
        if (!team) return { success: false, error: 'Team not found.' };

        // Update team-level fields
        if (updates.teamId && updates.teamId !== teamId) {
            if (this.state.teams.find(t => t.teamId === updates.teamId)) {
                return { success: false, error: `Team ID "${updates.teamId}" already exists.` };
            }
            // Update QR IDs of all participants
            team.participants.forEach(p => {
                p.qrId = Utils.generateQRId(updates.teamId, p.participantId);
            });
            team.teamId = updates.teamId;
        }
        if (updates.teamName !== undefined) team.teamName = updates.teamName;
        if (updates.college !== undefined) team.college = updates.college;

        // Update / add / remove participants
        if (updates.participants !== undefined) {
            // Match by participantId; if new (no id or id not found) → create
            const updatedParticipants = [];
            for (const pd of updates.participants) {
                const existing = pd.participantId
                    ? team.participants.find(p => p.participantId === pd.participantId)
                    : null;
                if (existing) {
                    // Preserve attendance — only update info fields
                    existing.name = pd.name !== undefined ? pd.name : existing.name;
                    existing.rollNo = pd.rollNo !== undefined ? pd.rollNo : existing.rollNo;
                    existing.email = pd.email !== undefined ? pd.email : existing.email;
                    existing.phone = pd.phone !== undefined ? pd.phone : existing.phone;
                    updatedParticipants.push(existing);
                } else {
                    // Brand new participant
                    const participantId = Utils.shortId('P');
                    updatedParticipants.push({
                        participantId,
                        qrId: Utils.generateQRId(team.teamId, participantId),
                        name: pd.name || '',
                        rollNo: pd.rollNo || '',
                        email: pd.email || '',
                        phone: pd.phone || '',
                        attendance: { status: 'PENDING', checkInTime: null },
                    });
                }
            }
            team.participants = updatedParticipants;
        }

        this.save();
        return { success: true };
    },

    deleteTeam(teamId) {
        const idx = this.state.teams.findIndex(t => t.teamId === teamId);
        if (idx === -1) return { success: false, error: 'Team not found.' };
        this.state.teams.splice(idx, 1);
        this.save();
        return { success: true };
    },

    getTeam(teamId) {
        return this.state.teams.find(t => t.teamId === teamId) || null;
    },

    // -------------------------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------------------------
    searchTeams(query) {
        if (!query) return this.state.teams;
        const q = query.toLowerCase();
        return this.state.teams.filter(team => {
            if (team.teamId.toLowerCase().includes(q)) return true;
            if (team.teamName.toLowerCase().includes(q)) return true;
            if (team.college.toLowerCase().includes(q)) return true;
            if (team.participants.some(p =>
                p.name.toLowerCase().includes(q) ||
                p.rollNo.toLowerCase().includes(q)
            )) return true;
            return false;
        });
    },

    // -------------------------------------------------------------------------
    // RECENT CHECK-INS
    // -------------------------------------------------------------------------
    getRecentCheckIns(limit = 10) {
        const all = [];
        for (const team of this.state.teams) {
            for (const p of team.participants) {
                if (p.attendance.status === 'PRESENT' && p.attendance.checkInTime) {
                    all.push({ team, participant: p, checkInTime: p.attendance.checkInTime });
                }
            }
        }
        return all
            .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
            .slice(0, limit);
    },

    // -------------------------------------------------------------------------
    // IMPORT
    // -------------------------------------------------------------------------
    importCSV(csvText) {
        const result = CSV.importCSV(csvText, this.state.teams);
        if (result.success) {
            this.state.teams = result.teams;
            this.save();
        }
        return result;
    },

    // -------------------------------------------------------------------------
    // BACKUP / RESTORE
    // -------------------------------------------------------------------------
    exportBackup() {
        return Storage.exportBackup(this.state);
    },

    importBackup(jsonString) {
        const result = Storage.importBackup(jsonString);
        if (result.success) {
            this.state = result.state;
            this.save();
        }
        return result;
    },

    resetEventData() {
        Storage.resetEventData(this.state);
        this.state.teams = [];
    },

    // -------------------------------------------------------------------------
    // DEMO DATA
    // -------------------------------------------------------------------------
    loadDemoData() {
        this.state.teams = Utils.generateDemoData();
        this.save();
        return this.state.teams;
    },

    // -------------------------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------------------------
    updateSettings(settings) {
        this.state.settings = { ...this.state.settings, ...settings };
        this.save();
    },
};
