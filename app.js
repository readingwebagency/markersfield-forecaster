// State
let state = { prior: null, current: null, log: [], pendingAlpha: 0.7, pendingReasoning: '' };
let chart = null;

// Storage helpers (uses localStorage since this is a standalone file)
function loadState() {
  try {
    const raw = localStorage.getItem('makerfield-state');
    if (raw) state = JSON.parse(raw);
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem('makerfield-state', JSON.stringify(state));
  } catch(e) {}
}

// Maths helpers
function norm(l, r, rb) {
  const s = l + r + rb;
  if (s === 0) return [33.3, 33.3, 33.4];
  return [l/s*100, r/s*100, rb/s*100];
}

function decimalToImplied(d) {
  return 1 / d;
}

// UI helpers
function updateHeader(l, r, rb) {
  document.getElementById('cur-l').textContent  = l.toFixed(1) + '%';
  document.getElementById('cur-r').textContent  = r.toFixed(1) + '%';
  document.getElementById('cur-rb').textContent = rb.toFixed(1) + '%';
  document.getElementById('bar-l').style.width  = l + '%';
  document.getElementById('bar-r').style.width  = r + '%';
  document.getElementById('bar-rb').style.width = rb + '%';
}

function checkSum() {
  const s = (parseFloat(document.getElementById('prior-l').value)  || 0)
          + (parseFloat(document.getElementById('prior-r').value)  || 0)
          + (parseFloat(document.getElementById('prior-rb').value) || 0);
  document.getElementById('prior-sum-note').textContent =
    Math.abs(s - 100) > 0.5
      ? `Sum: ${s.toFixed(1)}% (must be 100%)`
      : `Sum: ${s.toFixed(1)}% ✓`;
}

// Step interactions
function selectDay(suggested) {
  document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('alpha-slider').value = suggested;
  document.getElementById('alpha-val').textContent = suggested.toFixed(2);
}

function goStep2() {
  const reasoning = document.getElementById('reasoning').value.trim();
  if (!reasoning) { alert('Please enter your reasoning before proceeding.'); return; }
  state.pendingAlpha     = parseFloat(document.getElementById('alpha-slider').value);
  state.pendingReasoning = reasoning;
  document.getElementById('reasoning').disabled    = true;
  document.getElementById('alpha-slider').disabled = true;
  document.querySelectorAll('.tag').forEach(t => t.style.pointerEvents = 'none');
  document.getElementById('step2').classList.remove('disabled');
  document.getElementById('step2').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function computeUpdate() {
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

  const [knl, knr, knrb] = norm(kl, kr, krb);
  const [bnl, bnr, bnrb] = norm(
    decimalToImplied(bl),
    decimalToImplied(br),
    decimalToImplied(brb)
  );

  const sigL  = (knl + bnl) / 2;
  const sigR  = (knr + bnr) / 2;
  const sigRB = (knrb + bnrb) / 2;

  const a = state.pendingAlpha;
  const [cl, cr, crb] = state.current;
  const [nl, nr, nrb] = norm(
    a*cl  + (1-a)*sigL,
    a*cr  + (1-a)*sigR,
    a*crb + (1-a)*sigRB
  );

  state._pending = { nl, nr, nrb };

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
          <span class="pill pill-l">${sigL.toFixed(1)}%</span>
          <span class="pill pill-r">${sigR.toFixed(1)}%</span>
          <span class="pill pill-rb">${sigRB.toFixed(1)}%</span>
        </div>
      </div>
    </div>
    <div style="font-size:13px;color:#5f5e5a;margin-bottom:0.75rem;">α = ${a.toFixed(2)} → new estimates (renormalised)</div>
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

  document.getElementById('step3').classList.remove('disabled');
  document.getElementById('step3').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function confirmUpdate() {
  const { nl, nr, nrb } = state._pending;
  const today = new Date().toISOString().slice(0, 10);
  state.log.push({
    date: today,
    alpha: state.pendingAlpha,
    reasoning: state.pendingReasoning,
    l: nl, r: nr, rb: nrb
  });
  state.current = [nl, nr, nrb];
  saveState();
  updateHeader(nl, nr, nrb);
  renderLog();
  renderChart();
  resetUpdatePanel();
}

function resetUpdatePanel() {
  document.getElementById('reasoning').value    = '';
  document.getElementById('reasoning').disabled = false;
  document.getElementById('alpha-slider').disabled = false;
  document.querySelectorAll('.tag').forEach(t => {
    t.classList.remove('active');
    t.style.pointerEvents = '';
  });
  document.getElementById('alpha-slider').value    = 0.7;
  document.getElementById('alpha-val').textContent = '0.70';
  ['k-l','k-r','k-rb','b-l','b-r','b-rb'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('update-results').innerHTML = '';
  document.getElementById('step2').classList.add('disabled');
  document.getElementById('step3').classList.add('disabled');
}

// Render log
function renderLog() {
  const body = document.getElementById('log-body');
  if (!state.log.length) {
    body.innerHTML = '<div style="font-size:13px;color:#888780;padding:8px 0;">No entries yet.</div>';
    return;
  }
  body.innerHTML = [...state.log].reverse().map(e => `
    <div class="log-row">
      <span style="color:#5f5e5a;">${e.date}</span>
      <span>${parseFloat(e.alpha).toFixed(2)}</span>
      <span style="color:#5f5e5a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.reasoning}">${e.reasoning}</span>
      <span style="text-align:right;color:#185FA5;font-weight:500;">${parseFloat(e.l).toFixed(1)}%</span>
      <span style="text-align:right;color:#A32D2D;font-weight:500;">${parseFloat(e.r).toFixed(1)}%</span>
      <span style="text-align:right;color:#854F0B;font-weight:500;">${parseFloat(e.rb).toFixed(1)}%</span>
    </div>`).join('');
}

// Render chart
function renderChart() {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.log.map(e => e.date),
      datasets: [
        { label: 'Labour',          data: state.log.map(e => parseFloat(e.l).toFixed(1)),  borderColor: '#185FA5', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
        { label: 'Reform',          data: state.log.map(e => parseFloat(e.r).toFixed(1)),  borderColor: '#A32D2D', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 },
        { label: 'Restore Britain', data: state.log.map(e => parseFloat(e.rb).toFixed(1)), borderColor: '#854F0B', backgroundColor: 'transparent', tension: 0.3, pointRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { font: { size: 12 } } } },
      scales: {
        y: { min: 0, max: 100, ticks: { font: { size: 11 }, callback: v => v + '%' } },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

// Start app from setup screen
function startApp() {
  const l  = parseFloat(document.getElementById('prior-l').value)  || 0;
  const r  = parseFloat(document.getElementById('prior-r').value)  || 0;
  const rb = parseFloat(document.getElementById('prior-rb').value) || 0;
  const s  = l + r + rb;
  if (Math.abs(s - 100) > 1) {
    document.getElementById('prior-sum-note').textContent = `Sum is ${s.toFixed(1)}% — must equal 100%.`;
    return;
  }
  const [nl, nr, nrb] = norm(l, r, rb);
  state.prior   = [nl, nr, nrb];
  state.current = [nl, nr, nrb];
  saveState();
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
  updateHeader(nl, nr, nrb);
  renderLog();
  renderChart();
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  if (state.current) {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    const [l, r, rb] = state.current;
    updateHeader(l, r, rb);
    renderLog();
    setTimeout(renderChart, 100);
  }
  document.getElementById('prior-l').addEventListener('input', checkSum);
  document.getElementById('prior-r').addEventListener('input', checkSum);
  document.getElementById('prior-rb').addEventListener('input', checkSum);
});
