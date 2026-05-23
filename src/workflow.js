/**
 * workflow.js — multi-step update panel logic.
 * Orchestrates maths + state + render; handles all user interactions
 * in the update panel (steps 1–3).
 *
 * Note: `pendingUpdate` is kept local to this module rather than on state,
 * because it is transient UI state that is never persisted or needed elsewhere.
 */

import { norm, kalshiSignal, betfairSignal, averageSignals, bayesianBlend } from './maths.js';
import { state, commitUpdate }                                               from './state.js';
import { renderHeader, renderUpdateResults, renderLog, renderChart }         from './render.js';

// Transient: holds the computed new estimates between computeUpdate() and confirmUpdate()
let pendingUpdate = null; // { newEsts, alpha, reasoning }

// ─── Step 1 ──────────────────────────────────────────────────────────────────

/** Called when user clicks a time-horizon tag. */
export function selectDay(suggestedAlpha, clickedTag) {
  document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
  clickedTag.classList.add('active');
  document.getElementById('alpha-slider').value       = suggestedAlpha;
  document.getElementById('alpha-val').textContent    = suggestedAlpha.toFixed(2);
}

/** Called when user clicks "Continue to step 2". */
export function goStep2() {
  const reasoning = document.getElementById('reasoning').value.trim();
  if (!reasoning) {
    alert('Please enter your reasoning before proceeding.');
    return;
  }

  // Snapshot step-1 inputs so they can't be changed mid-flow
  pendingUpdate = {
    alpha:     parseFloat(document.getElementById('alpha-slider').value),
    reasoning,
    newEsts:   null, // filled in by computeUpdate
  };

  // Lock step-1 controls
  document.getElementById('reasoning').disabled    = true;
  document.getElementById('alpha-slider').disabled = true;
  document.querySelectorAll('.tag').forEach(t => t.style.pointerEvents = 'none');

  // Reveal step 2
  setStepVisible('step2', true);
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

/** Called when user clicks "Compute update". */
export function computeUpdate() {
  const kl  = parseFloat(document.getElementById('k-l').value);
  const kr  = parseFloat(document.getElementById('k-r').value);
  const krb = parseFloat(document.getElementById('k-rb').value);
  const bl  = parseFloat(document.getElementById('b-l').value);
  const br  = parseFloat(document.getElementById('b-r').value);
  const brb = parseFloat(document.getElementById('b-rb').value);

  if ([kl, kr, krb, bl, br, brb].some(isNaN)) {
    alert('Please fill in all market prices.');
    return;
  }

  const kalshi   = kalshiSignal(kl, kr, krb);
  const betfair  = betfairSignal(bl, br, brb);
  const combined = averageSignals(kalshi, betfair);
  const { alpha } = pendingUpdate;
  const newEsts  = bayesianBlend(state.current, combined, alpha);

  pendingUpdate.newEsts = newEsts;

  renderUpdateResults({
    kalshi,
    betfair,
    combined,
    alpha,
    newEsts,
    oldEsts: state.current,
  });

  setStepVisible('step3', true);
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────

/** Called when user clicks "Confirm & save". */
export function confirmUpdate() {
  const { newEsts, alpha, reasoning } = pendingUpdate;
  commitUpdate(newEsts, alpha, reasoning);
  const [l, r, rb] = newEsts;
  renderHeader(l, r, rb);
  renderLog();
  renderChart();
  resetUpdatePanel();
}

// ─── Reset ───────────────────────────────────────────────────────────────────

export function resetUpdatePanel() {
  pendingUpdate = null;

  document.getElementById('reasoning').value       = '';
  document.getElementById('reasoning').disabled    = false;
  document.getElementById('alpha-slider').value    = 0.7;
  document.getElementById('alpha-val').textContent = '0.70';
  document.getElementById('alpha-slider').disabled = false;

  document.querySelectorAll('.tag').forEach(t => {
    t.classList.remove('active');
    t.style.pointerEvents = '';
  });

  ['k-l', 'k-r', 'k-rb', 'b-l', 'b-r', 'b-rb'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('update-results').innerHTML = '';

  setStepVisible('step2', false);
  setStepVisible('step3', false);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setStepVisible(stepId, visible) {
  const el = document.getElementById(stepId);
  el.classList.toggle('disabled', !visible);
  if (visible) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
