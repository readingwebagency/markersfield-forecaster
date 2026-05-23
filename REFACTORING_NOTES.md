# Makerfield — refactored source

## File structure

```
src/
├── maths.js      Pure maths helpers (no DOM, no state)
├── state.js      Single source of truth + localStorage persistence
├── render.js     All DOM writes
├── workflow.js   Multi-step update panel logic
└── main.js       Boot, screen switching, event wiring
```

## Key changes from the original

### `maths.js` — new pure functions
- `kalshiSignal()` and `betfairSignal()` extracted so each market's
  normalisation is explicit and testable in isolation.
- `averageSignals()` extracted from the middle of `computeUpdate()`.
- `bayesianBlend()` extracted — was previously three anonymous lines
  buried inside `computeUpdate()`.

### `state.js` — mutations centralised
- `state._pending` is gone. Transient UI state (the computed update
  between step 2 and step 3) now lives as a module-local variable in
  `workflow.js`, where it belongs.
- All writes to `state` go through `initialisePrior()` or
  `commitUpdate()`, making data flow traceable.

### `render.js` — accepts data, writes DOM
- `renderUpdateResults()` now takes a plain data object; it no longer
  needs to know anything about state or how the numbers were computed.
- `updateHeader()` renamed to `renderHeader()` for consistency.

### `workflow.js` — orchestration only
- `computeUpdate()` now does compute-only; rendering is delegated to
  `renderUpdateResults()`.
- `selectDay()` no longer uses the implicit `event` global — the clicked
  element is passed in explicitly from the listener in `main.js`.
- `setStepVisible()` helper replaces the repeated
  `classList.remove('disabled') + scrollIntoView` pattern.

### `main.js` — wiring and boot
- All `addEventListener` calls live here; no inline `onclick` attributes
  needed in the HTML.
- `startApp()` and the boot block are unified — both call `initialisePrior`
  + the same three render functions.
- `checkSum` renamed to `updatePriorSumNote` (describes what it does).

## HTML changes required
The HTML needs two small updates to work with the refactored JS:

1. Load as a module:
   ```html
   <script type="module" src="src/main.js"></script>
   ```

2. Add `data-alpha` attributes to time-horizon tags so `main.js` can
   read the suggested alpha without inline `onclick`:
   ```html
   <button class="tag" data-alpha="0.9">Day before</button>
   <button class="tag" data-alpha="0.7">Few days out</button>
   <button class="tag" data-alpha="0.5">Week out</button>
   ```

3. Add `id` attributes to the step buttons if not already present:
   `btn-step2`, `btn-compute`, `btn-confirm`, `btn-reset`.
