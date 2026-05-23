/**
 * render.js — all DOM writes live here.
 * Accepts plain data; knows nothing about state or business logic.
 */

import { state } from './state.js';

let chart = null;

// ─── Header bar ──────────────────────────────────────────────────────────────

/**
 * Update the three probability pills and the coloured bar.
 * @param {number} l   Labour %
 * @param {number} r   Reform %
 * @param {number} rb  Restore Britain %
 */
export function renderHeader(l, r, rb) {
  document.getElementById('cur-l').textContent  = l.toFixed(1) + '%';
  document.getElementById('cur-r').textContent  = r.toFixed(1) + '%';
  document.getElementById('cur-rb').textContent = rb.toFixed(1) + '%';
  document.getElementById('bar-l').style.width  = l + '%';
  document.getElementById('bar-r').style.width  = r + '%';
  document.getElementById('bar-rb').style.width = rb + '%';
}

// ─── Update-panel results ────────────────────────────────────────────────────

/**
 * Render the computed signals + new estimates into #update-results.
 *
 * @param {{ kalshi, betfair, combined, alpha, newEsts, oldEsts }} data
 *   kalshi    [l, r, rb] normalised
 *   betfair   [l, r, rb] normalised
 *   combined  [l, r, rb] averaged
 *   alpha     number
 *   newEsts   [l, r, rb] after blend
 *   oldEsts   [l, r, rb] before blend
 */
export function renderUpdateResults({ kalshi, betfair, combined, alpha, newEsts, oldEsts }) {
  const [knl, knr, knrb] = kalshi;
  const [bnl, bnr, bnrb] = betfair;
  const [snl, snr, snrb] = combined;
  const [nl,  nr,  nrb]  = newEsts;
  const [cl,  cr,  crb]  = oldEsts;

  document.getElementById('update-results').innerHTML = `
    <div class="row3" style="margin-bottom:1rem;">
      <div>
        <div class="metric-label" style="font-size:12px;">Kalshi signal</div>
        <div style="font-size:13px;margin-top:4px;">
          <span class="pill pill-l">${knl.toFixed(1)}%</span>
          <span class="pill pill-r">${knr.toFixed(1)}%</span>
          <span class="pill pill-rb">${knrb.toFixed(1)}%</span>
        </div>
      </div>
      <div>
        <div class="metric-label" style="font-size:12px;">Betfair (normalised)</div>
        <div style="font-size:13px;margin-top:4px;">
          <span class="pill pill-l">${bnl.toFixed(1)}%</span>
          <span class="pill pill-r">${bnr.toFixed(1)}%</span>
          <span class="pill pill-rb">${bnrb.toFixed(1)}%</span>
        </div>
      </div>
      <div>
        <div class="metric-label" style="font-size:12px;">Combined signal</div>
        <div style="font-size:13px;margin-top:4px;">
          <span class="pill pill-l">${snl.toFixed(1)}%</span>
          <span class="pill pill-r">${snr.toFixed(1)}%</span>
          <span class="pill pill-rb">${snrb.toFixed(1)}%</span>
        </div>
      </div>
    </div>
    <div style="font-size:13px;color:#5f5e5a;margin-bottom:0.75rem;">
      α = ${alpha.toFixed(2)} → new estimates (renormalised)
    </div>
    <div class="row3">
      <div class="metric">
        <div class="metric-label">Labour</div>
        <div class="metric-val" style="color:#185FA5;">${nl.toFixed(1)}%</div>
        <div style="font-size:11px;color:#888780;">was ${cl.toFixed(1)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Reform</div>
        <div class="metric-val" style="color:#A32D2D;">${nr.toFixed(1)}%</div>
        <div style="font-size:11px;color:#888780;">was ${cr.toFixed(1)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Restore Britain</div>
        <div class="metric-val" style="color:#854F0B;">${nrb.toFixed(1)}%</div>
        <div style="font-size:11px;color:#888780;">was ${crb.toFixed(1)}%</div>
      </div>
    </div>`;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

export function renderLog() {
  const body = document.getElementById('log-body');
  if (!state.log.length) {
    body.innerHTML = '<div style="font-size:13px;color:#888780;padding:8px 0;">No entries yet.</div>';
    return;
  }
  body.innerHTML = [...state.log].reverse().map(e => `
    <div class="log-row">
      <span style="color:#5f5e5a;">${e.date}</span>
      <span>${parseFloat(e.alpha).toFixed(2)}</span>
      <span style="color:#5f5e5a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${e.reasoning}">${e.reasoning}</span>
      <span style="text-align:right;color:#185FA5;font-weight:500;">${parseFloat(e.l).toFixed(1)}%</span>
      <span style="text-align:right;color:#A32D2D;font-weight:500;">${parseFloat(e.r).toFixed(1)}%</span>
      <span style="text-align:right;color:#854F0B;font-weight:500;">${parseFloat(e.rb).toFixed(1)}%</span>
    </div>`).join('');
}

// ─── Chart ───────────────────────────────────────────────────────────────────

export function renderChart() {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.log.map(e => e.date),
      datasets: [
        { label: 'Labour',          data: state.log.map(e => parseFloat(e.l).toFixed(1)),  borderColor: '#185FA5', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
        { label: 'Reform',          data: state.log.map(e => parseFloat(e.r).toFixed(1)),  borderColor: '#A32D2D', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
        { label: 'Restore Britain', data: state.log.map(e => parseFloat(e.rb).toFixed(1)), borderColor: '#854F0B', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { font: { size: 12 } } } },
      scales: {
        y: { min: 0, max: 100, ticks: { font: { size: 11 }, callback: v => v + '%' } },
        x: { ticks: { font: { size: 11 } } },
      },
    },
  });
}
