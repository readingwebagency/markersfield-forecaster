/**
 * state.js — single source of truth + localStorage persistence.
 * All mutations go through the functions here; nothing else writes state directly.
 */

const STORAGE_KEY = 'makerfield-state';

const DEFAULT_STATE = {
  prior:   null,   // [l, r, rb] set once at setup
  current: null,   // [l, r, rb] updated on each confirmed update
  log:     [],     // array of LogEntry objects
};

// In-memory state object — exported as a reference so other modules can read it.
// Treat it as read-only outside this module; mutate via the functions below.
export const state = { ...DEFAULT_STATE };

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch (e) {
    console.warn('makerfield: could not load saved state', e);
  }
}

export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('makerfield: could not save state', e);
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Initialise from the setup screen prior values.
 * @param {[number, number, number]} normalised - renormalised [l, r, rb]
 */
export function initialisePrior(normalised) {
  state.prior   = normalised;
  state.current = [...normalised];
  saveState();
}

/**
 * Commit a confirmed update to the log and advance current estimates.
 * @param {[number, number, number]} newEstimates - renormalised [l, r, rb]
 * @param {number}  alpha
 * @param {string}  reasoning
 */
export function commitUpdate(newEstimates, alpha, reasoning) {
  const [l, r, rb] = newEstimates;
  /** @type {LogEntry} */
  const entry = {
    date:      new Date().toISOString().slice(0, 10),
    alpha,
    reasoning,
    l, r, rb,
  };
  state.log.push(entry);
  state.current = [...newEstimates];
  saveState();
}

/**
 * @typedef {Object} LogEntry
 * @property {string} date
 * @property {number} alpha
 * @property {string} reasoning
 * @property {number} l
 * @property {number} r
 * @property {number} rb
 */
