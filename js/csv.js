/**
 * HACKCHECK - CSV Module
 * Handles CSV import validation and export generation.
 */

const CSV = {
    /**
     * Required columns (flexible matching - case-insensitive, trims whitespace)
     * Expected CSV columns:
     * Team ID, Team Name, College, Participant Name, Roll Number, Email, Phone
     */
    EXPECTED_COLUMNS: ['teamid', 'teamname', 'college', 'participantname', 'rollnumber', 'email', 'phone'],

    /**
     * Parse and import a CSV file into the app state.
     * Returns:
     * {
     *   success: boolean,
     *   summary: { teamsImported, participantsNew, participantsUpdated, errors },
     *   errorRows: [ { row, reason } ],
     *   state: (updated teams array)
     * }
     */
    importCSV(csvText, existingTeams) {
        const allRows = Utils.parseCSV(csvText);
        if (allRows.length === 0) {
            return { success: false, error: 'CSV file is empty.' };
        }

        // Detect if first row is header
        const firstRow = allRows[0].map(c => c.toLowerCase().replace(/\s/g, ''));
        const hasHeader = this.EXPECTED_COLUMNS.every(col => firstRow.includes(col));

        let dataRows = hasHeader ? allRows.slice(1) : allRows;

        if (dataRows.length === 0) {
            return { success: false, error: 'CSV contains only a header row and no data.' };
        }

        // Build a map from existing teams for fast lookup
        const teamsMap = {};
        for (const team of existingTeams) {
            teamsMap[team.teamId] = JSON.parse(JSON.stringify(team)); // deep clone
        }

        const errorRows = [];
        let participantsNew = 0;
        let participantsUpdated = 0;

        // Process each data row
        dataRows.forEach((row, index) => {
            const rowNum = hasHeader ? index + 2 : index + 1;

            if (row.length < 7) {
                errorRows.push({ row: rowNum, data: row.join(','), reason: `Expected 7 columns, got ${row.length}.` });
                return;
            }

            const [rawTeamId, rawTeamName, rawCollege, rawName, rawRoll, rawEmail, rawPhone] = row;

            const teamId = rawTeamId.trim();
            const teamName = rawTeamName.trim();
            const college = rawCollege.trim();
            const name = rawName.trim();
            const rollNo = rawRoll.trim();
            const email = rawEmail.trim();
            const phone = rawPhone.trim();

            if (!teamId || !name) {
                errorRows.push({ row: rowNum, data: row.join(','), reason: 'Team ID and Participant Name are required.' });
                return;
            }

            // Find or create team
            if (!teamsMap[teamId]) {
                teamsMap[teamId] = {
                    teamId,
                    teamName: teamName || `Team ${teamId}`,
                    college: college || '',
                    participants: [],
                };
            } else {
                // Update team name / college if provided
                if (teamName) teamsMap[teamId].teamName = teamName;
                if (college) teamsMap[teamId].college = college;
            }

            // Check if participant already exists (match by rollNo if available, else by name)
            let existingP = null;
            if (rollNo) {
                existingP = teamsMap[teamId].participants.find(p => p.rollNo === rollNo);
            }
            if (!existingP && name) {
                existingP = teamsMap[teamId].participants.find(p => p.name.toLowerCase() === name.toLowerCase() && !existingP);
            }

            if (existingP) {
                // Update fields but preserve attendance
                existingP.name = name;
                existingP.rollNo = rollNo || existingP.rollNo;
                existingP.email = email || existingP.email;
                existingP.phone = phone || existingP.phone;
                participantsUpdated++;
            } else {
                // New participant
                const participantId = Utils.shortId('P');
                const qrId = Utils.generateQRId(teamId, participantId);
                teamsMap[teamId].participants.push({
                    participantId,
                    qrId,
                    name,
                    rollNo,
                    email,
                    phone,
                    attendance: { status: 'PENDING', checkInTime: null },
                });
                participantsNew++;
            }
        });

        const finalTeams = Object.values(teamsMap);
        const teamsImported = finalTeams.length;

        return {
            success: true,
            summary: {
                teamsImported,
                participantsNew,
                participantsUpdated,
                errors: errorRows.length,
            },
            errorRows,
            teams: finalTeams,
        };
    },

    /**
     * Export complete attendance CSV.
     */
    exportComplete(teams) {
        const headers = ['Team ID', 'Team Name', 'College', 'Participant ID', 'Participant Name', 'Roll Number', 'Email', 'Phone', 'Status', 'Check-in Time'];
        const rows = [];
        for (const team of teams) {
            for (const p of team.participants) {
                rows.push([
                    team.teamId,
                    team.teamName,
                    team.college,
                    p.participantId,
                    p.name,
                    p.rollNo,
                    p.email,
                    p.phone,
                    p.attendance.status,
                    p.attendance.checkInTime ? Utils.formatDateTime(p.attendance.checkInTime) : '',
                ]);
            }
        }
        return Utils.toCSV(headers, rows);
    },

    /**
     * Export only present participants.
     */
    exportPresent(teams) {
        const headers = ['Team ID', 'Team Name', 'College', 'Participant ID', 'Participant Name', 'Roll Number', 'Email', 'Phone', 'Check-in Time'];
        const rows = [];
        for (const team of teams) {
            for (const p of team.participants) {
                if (p.attendance.status === 'PRESENT') {
                    rows.push([
                        team.teamId, team.teamName, team.college,
                        p.participantId, p.name, p.rollNo, p.email, p.phone,
                        Utils.formatDateTime(p.attendance.checkInTime),
                    ]);
                }
            }
        }
        return Utils.toCSV(headers, rows);
    },

    /**
     * Export only pending participants.
     */
    exportPending(teams) {
        const headers = ['Team ID', 'Team Name', 'College', 'Participant ID', 'Participant Name', 'Roll Number', 'Email', 'Phone'];
        const rows = [];
        for (const team of teams) {
            for (const p of team.participants) {
                if (p.attendance.status === 'PENDING') {
                    rows.push([
                        team.teamId, team.teamName, team.college,
                        p.participantId, p.name, p.rollNo, p.email, p.phone,
                    ]);
                }
            }
        }
        return Utils.toCSV(headers, rows);
    },

    /**
     * Export team-wise summary.
     */
    exportTeamSummary(teams) {
        const headers = ['Team ID', 'Team Name', 'College', 'Total Participants', 'Present', 'Pending', 'Attendance %'];
        const rows = teams.map(team => {
            const total = team.participants.length;
            const present = team.participants.filter(p => p.attendance.status === 'PRESENT').length;
            const pending = total - present;
            const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            return [team.teamId, team.teamName, team.college, total, present, pending, `${pct}%`];
        });
        return Utils.toCSV(headers, rows);
    },
};
