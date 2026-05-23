/**
 * maths.js — pure, stateless helpers
 * No DOM access, no state imports. Safe to unit-test in isolation.
 */

/**
 * Normalise three raw values to percentages summing to 100.
 * If all inputs are zero, returns equal thirds.
 */
export function norm(l, r, rb) {
  const s = l + r + rb;
  if (s === 0) return [33.3, 33.3, 33.4];
  return [l / s * 100, r / s * 100, rb / s * 100];
}

/**
 * Convert a decimal (Betfair-style) odd to an implied probability (0–100).
 * e.g. 4.0 → 25
 */
export function decimalToImplied(decimal) {
  return (1 / decimal) * 100;
}

/**
 * Average two normalised signals element-wise.
 * Both inputs must already be normalised [l, r, rb] percentage arrays.
 */
export function averageSignals(a, b) {
  return [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  ];
}

/**
 * Bayesian-style blend of current beliefs with a market signal.
 * alpha close to 1 → trust your prior; close to 0 → defer to market.
 * Returns a renormalised [l, r, rb] array.
 */
export function bayesianBlend(current, signal, alpha) {
  const [cl, cr, crb] = current;
  const [sl, sr, srb] = signal;
  return norm(
    alpha * cl  + (1 - alpha) * sl,
    alpha * cr  + (1 - alpha) * sr,
    alpha * crb + (1 - alpha) * srb,
  );
}

/**
 * Build normalised Kalshi signal from raw implied-probability inputs.
 */
export function kalshiSignal(l, r, rb) {
  return norm(l, r, rb);
}

/**
 * Build normalised Betfair signal from decimal odds.
 */
export function betfairSignal(bl, br, brb) {
  return norm(
    decimalToImplied(bl),
    decimalToImplied(br),
    decimalToImplied(brb),
  );
}
