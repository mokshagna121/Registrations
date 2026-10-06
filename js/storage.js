/**
 * HACKCHECK - Storage Module
 * Manages all LocalStorage operations with versioning and backup/restore.
 */

const STORAGE_KEY = 'hackathonAttendanceApp';
const SCHEMA_VERSION = '1.0.0';

const DEFAULT_STATE = {
    schemaVersion: SCHEMA_VERSION,
    settings: {
        hackathonName: 'HACKATHON 2026',
        deskName: 'Registration Desk',
        autoReturnDelay: 3,
        soundEnabled: true,
        successSound: true,
        errorSound: true,
        confirmBeforeDelete: true,
        emailjsServiceId: '',
        emailjsTemplateId: '',
        emailjsPublicKey: '',
        autoSendQROnAdd: true,
    },
    teams: [],
    lastModified: null,
};

const Storage = {
    /**
     * Load the full application state from LocalStorage.
     * Returns default state if nothing is stored or data is corrupted.
     */
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
            const parsed = JSON.parse(raw);
            // Merge with defaults to handle missing keys from older versions
            const merged = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
            return merged;
        } catch (e) {
            console.error('Storage: Failed to load state. Returning default.', e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    },

    /**
     * Save the full application state to LocalStorage.
     */
    save(state) {
        try {
            state.lastModified = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Storage: Failed to save state.', e);
            return false;
        }
    },

    /**
     * Reset all event data (teams) but preserve settings.
     */
    resetEventData(state) {
        state.teams = [];
        state.lastModified = new Date().toISOString();
        return this.save(state);
    },

    /**
     * Export the current state as a JSON backup string.
     */
    exportBackup(state) {
        return JSON.stringify(state, null, 2);
    },

    /**
     * Import a JSON backup string and validate its structure.
     * Returns { success: boolean, state: object|null, error: string|null }
     */
    importBackup(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.schemaVersion || !Array.isArray(data.teams)) {
                return { success: false, state: null, error: 'Invalid backup file: missing required fields.' };
            }
            const merged = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), data);
            return { success: true, state: merged, error: null };
        } catch (e) {
            return { success: false, state: null, error: 'Invalid backup file: could not parse JSON.' };
        }
    },

    /**
     * Nuke everything from LocalStorage.
     */
    clearAll() {
        localStorage.removeItem(STORAGE_KEY);
    },

    // --- Helpers ---

    _deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    },
};
