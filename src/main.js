/**
 * main.js — application entry point.
 *
 * Responsibilities:
 *   1. Boot: load persisted state, decide which screen to show
 *   2. Setup screen: validate prior inputs, initialise state
 *   3. Wire DOM event listeners to workflow functions
 *
 * This file should contain NO business logic or maths — only orchestration.
 */

import { norm }                                  from './maths.js';
import { state, loadState, initialisePrior }     from './state.js';
import { renderHeader, renderLog, renderChart }  from './render.js';
import { selectDay, goStep2, computeUpdate,
         confirmUpdate, resetUpdatePanel }        from './workflow.js';

// ─── Boot ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  loadState();

  if (state.current) {
    showMainScreen();
    const [l, r, rb] = state.current;
    renderHeader(l, r, rb);
    renderLog();
    setTimeout(renderChart, 100); // allow canvas to paint first
  } else {
    showSetupScreen();
  }

  wireSetupListeners();
  wireUpdatePanelListeners();
});

// ─── Screen switching ────────────────────────────────────────────────────────

function showSetupScreen() {
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('main-screen').classList.add('hidden');
}

function showMainScreen() {
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function wireSetupListeners() {
  ['prior-l', 'prior-r', 'prior-rb'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePriorSumNote);
  });

  document.getElementById('start-btn').addEventListener('click', startApp);
}

function updatePriorSumNote() {
  const l  = parseFloat(document.getElementById('prior-l').value)  || 0;
  const r  = parseFloat(document.getElementById('prior-r').value)  || 0;
  const rb = parseFloat(document.getElementById('prior-rb').value) || 0;
  const s  = l + r + rb;
  const ok = Math.abs(s - 100) <= 0.5;
  document.getElementById('prior-sum-note').textContent = ok
    ? `Sum: ${s.toFixed(1)}% ✓`
    : `Sum: ${s.toFixed(1)}% (must be 100%)`;
}

function startApp() {
  const l  = parseFloat(document.getElementById('prior-l').value)  || 0;
  const r  = parseFloat(document.getElementById('prior-r').value)  || 0;
  const rb = parseFloat(document.getElementById('prior-rb').value) || 0;
  const s  = l + r + rb;

  if (Math.abs(s - 100) > 1) {
    document.getElementById('prior-sum-note').textContent =
      `Sum is ${s.toFixed(1)}% — must equal 100%.`;
    return;
  }

  const normalised = norm(l, r, rb);
  initialisePrior(normalised);
  showMainScreen();
  renderHeader(...normalised);
  renderLog();
  renderChart();
}

// ─── Update panel ─────────────────────────────────────────────────────────────

function wireUpdatePanelListeners() {
  // Alpha slider display
  document.getElementById('alpha-slider').addEventListener('input', e => {
    document.getElementById('alpha-val').textContent =
      parseFloat(e.target.value).toFixed(2);
  });

  // Time-horizon tags
  document.querySelectorAll('.tag[data-alpha]').forEach(tag => {
    tag.addEventListener('click', () => {
      const alpha = parseFloat(tag.dataset.alpha);
      selectDay(alpha, tag);
    });
  });

  // Step buttons
  document.getElementById('btn-step2').addEventListener('click', goStep2);
  document.getElementById('btn-compute').addEventListener('click', computeUpdate);
  document.getElementById('btn-confirm').addEventListener('click', confirmUpdate);
  document.getElementById('btn-reset').addEventListener('click', resetUpdatePanel);
}
