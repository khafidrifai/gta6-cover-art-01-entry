// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// full viewport, ?shot=editor shows the editor with photos loaded.
// Query knobs: layout, grade, size, photo1, photo2, title, subtitle,
// color, pos. window.__shotReady is set once the scene is painted, so a
// screenshot script knows when to shoot.
//
// The cover scenes paint the app's own drawing at the viewport size — the
// same drawing the Export button writes as a PNG, only scaled to fit.
import { panelCount } from './state.js';

export async function runShot(shot, query, state, hooks) {
  const { redraw, renderStrip, loadImage } = hooks;

  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('title') !== null) state.title = query.get('title');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('color')) state.titleColor = query.get('color');
  if (query.get('pos')) state.captionPos = query.get('pos');
  if (query.get('titleSize')) state.titleSize = Number(query.get('titleSize'));

  // The scene's photos, in panel order: photo1, photo2, then photo1 again.
  const picks = [query.get('photo1') ?? 'pier', query.get('photo2') ?? 'boulevard'];
  for (const name of picks) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      state.photos.push({ img, name, thumb: `samples/${name}.jpg` });
    } catch {
      // A missing sample leaves its panel on the gradient.
    }
  }
  for (let i = 0; i < panelCount(state); i++) {
    state.panels[i].photo = state.photos.length > 1 ? i % state.photos.length : 0;
    if (state.photos.length === 0) state.panels[i].photo = -1;
  }
  state.selected = 0;

  // Mirror the scene into the visible controls, so the editor shot is honest.
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  syncPicker('layouts', state.layout);
  syncPicker('sizes', state.size);
  syncPicker('grades', state.grade);
  syncSwatches(state.titleColor);
  document.querySelectorAll('[name=captionPos]').forEach((r) => {
    r.checked = r.value === state.captionPos;
  });
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.value = state.panels[0].zoom;
  const size = document.getElementById('titleSize');
  if (size) size.value = state.titleSize;

  if (shot === 'cover') document.body.classList.add('shot-cover');
  renderStrip();
  if (document.fonts) {
    await document.fonts.load('900 100px "Cover Black"').catch(() => {});
    await document.fonts.load('700 40px "Cover Bold"').catch(() => {});
    await document.fonts.ready.catch(() => {});
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

/** Marks the active button in a picker row by matching its data key. */
function syncPicker(id, key) {
  const box = document.getElementById(id);
  if (!box) return;
  const buttons = [...box.querySelectorAll('.pick')];
  buttons.forEach((b, i) => b.classList.toggle('active', Object.keys(pickerKeys(id))[i] === key));
}

/** The keys of a picker row, in the order its buttons were built. */
function pickerKeys(id) {
  if (id === 'layouts') return { solo: 1, 'duo-v': 1, 'duo-h': 1, trio: 1, 'trio-w': 1, quad: 1 };
  if (id === 'sizes') return { square: 1, portrait: 1, wide: 1 };
  return { sunset: 1, neon: 1, pink: 1, none: 1 };
}

function syncSwatches(color) {
  document.querySelectorAll('#swatches .swatch').forEach((b) => {
    b.classList.toggle('active', b.style.background === color || rgbToHex(b.style.background) === color);
  });
}

function rgbToHex(rgb) {
  const m = rgb.match(/\d+/g);
  if (!m) return rgb;
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}
