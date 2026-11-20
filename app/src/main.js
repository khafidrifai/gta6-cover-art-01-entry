// Wires the editor: photos in, panels picked and panned, caption typed,
// grade and size picked, and one button exports the cover as a PNG at the
// exact post size. A `?shot=` query instead sets up a fixed scene for a
// screenshot (see shots.js), so the screenshots show the app as it really is.
//
// The preview canvas is the same drawing as the export, at a smaller size:
// drawCover paints any state at any pixel size, so what you see is what the
// PNG holds.
import { drawCover, exportSize } from './cover.js';
import { defaultState, panelCount, panelRects, SIZES, LAYOUTS, GRADES, TITLE_COLORS } from './state.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const { w, h } = exportSize(state);
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  updatePanelButtons();
}

/** Sizes the preview canvas to the chosen post size, then paints. */
function fitPreview() {
  redraw();
}

/** Rebuilds the photo strip thumbnails from state.photos. */
function renderStrip() {
  const strip = document.getElementById('strip');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (state.activePhoto === i ? ' active' : '');
    btn.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.name;
    btn.append(img);
    btn.addEventListener('click', () => {
      state.activePhoto = i;
      renderStrip();
    });
    btn.addEventListener('dblclick', () => assignPhoto(i));
    strip.append(btn);
  });
}

/** Puts photo `i` into the selected panel. */
function assignPhoto(i) {
  const crop = state.panels[state.selected];
  crop.photo = i;
  crop.zoom = 1;
  crop.ox = 0;
  crop.oy = 0;
  state.activePhoto = i;
  redraw();
  renderStrip();
}

/** Marks which panel is selected, in the panel buttons and on the canvas. */
function updatePanelButtons() {
  document.querySelectorAll('#panels [data-panel]').forEach((btn) => {
    const i = Number(btn.dataset.panel);
    btn.classList.toggle('active', i === state.selected);
    btn.disabled = i >= panelCount(state);
    const crop = state.panels[i];
    const photo = crop && crop.photo >= 0 ? state.photos[crop.photo] : null;
    btn.textContent = `Panel ${i + 1}${photo ? ' · ' + photo.name : ' · empty'}`;
  });
  const zoom = document.getElementById('zoom');
  zoom.value = state.panels[state.selected].zoom;
  document.getElementById('zoomOut').textContent =
    `Zoom ${state.panels[state.selected].zoom.toFixed(2)}×`;
}

/** Adds files as photos, then paints. */
async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    status.textContent = 'That was not an image file.';
    return;
  }
  for (const file of images) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    state.photos.push({ img, name: file.name.replace(/\.[^.]+$/, ''), thumb: url });
  }
  // A fresh photo goes into the first empty panel, or the selected one.
  const empty = state.panels.findIndex((p, i) => i < panelCount(state) && p.photo < 0);
  if (empty >= 0) {
    state.selected = empty;
    assignPhoto(state.photos.length - 1);
  }
  state.activePhoto = state.photos.length - 1;
  renderStrip();
  redraw();
  status.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} added.`;
}

/** Builds one row of picker buttons (layout, size, grade) from a definition. */
function buildPicker(id, items, current, onPick) {
  const box = document.getElementById(id);
  box.innerHTML = '';
  Object.entries(items).forEach(([key, def]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick' + (key === current ? ' active' : '');
    btn.textContent = def.label;
    if (def.hint) btn.title = def.hint;
    btn.addEventListener('click', () => {
      onPick(key);
      box.querySelectorAll('.pick').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    box.append(btn);
  });
}

/** Builds the caption colour swatches. */
function buildSwatches() {
  const box = document.getElementById('swatches');
  box.innerHTML = '';
  TITLE_COLORS.forEach((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch' + (color === state.titleColor ? ' active' : '');
    btn.style.background = color;
    btn.setAttribute('aria-label', `Caption colour ${color}`);
    btn.addEventListener('click', () => {
      state.titleColor = color;
      box.querySelectorAll('.swatch').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      redraw();
    });
    box.append(btn);
  });
}

/** Which panel, if any, sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  const { w, h } = exportSize(state);
  const unit = Math.min(w, h) / 1080;
  const rects = panelRects(state.layout, (10 * unit) / w, (10 * unit) / h);
  const frame = 14 * unit;
  for (let i = 0; i < panelCount(state); i++) {
    const [rx, ry, rw, rh] = rects[i];
    const x = (frame + rx * (w - 2 * frame)) / w;
    const y = (frame + ry * (h - 2 * frame)) / h;
    const pw = (rw * (w - 2 * frame)) / w;
    const ph = (rh * (h - 2 * frame)) / h;
    if (fx >= x && fx <= x + pw && fy >= y && fy <= y + ph) return i;
  }
  return -1;
}

/** Dragging on the preview pans the selected panel's photo. */
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  const crop = state.panels[i];
  drag = { x: e.clientX, y: e.clientY, ox: crop.ox, oy: crop.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
  updatePanelButtons();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const crop = state.panels[state.selected];
  const dx = (e.clientX - drag.x) / rect.width;
  const dy = (e.clientY - drag.y) / rect.height;
  // A full drag across the panel moves the pan end to end.
  crop.ox = clamp(drag.ox + dx * 2, -1, 1);
  crop.oy = clamp(drag.oy + dy * 2, -1, 1);
  drag.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Exports the cover at its exact post size and downloads the PNG. */
function exportPng() {
  const { w, h } = exportSize(state);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-city-cover-${w}x${h}.png (${w} × ${h}).`;
  }, 'image/png');
}

function wire() {
  buildPicker('layouts', LAYOUTS, state.layout, (key) => {
    state.layout = key;
    if (state.selected >= panelCount(state)) state.selected = 0;
    redraw();
  });
  buildPicker('sizes', SIZES, state.size, (key) => {
    state.size = key;
    fitPreview();
  });
  buildPicker('grades', GRADES, state.grade, (key) => {
    state.grade = key;
    redraw();
  });
  buildSwatches();

  const panelBox = document.getElementById('panels');
  for (let i = 0; i < 4; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.panel = String(i);
    btn.addEventListener('click', () => {
      state.selected = i;
      redraw();
    });
    panelBox.append(btn);
  }

  document.getElementById('addPhotos').addEventListener('change', (e) => addFiles(e.target.files));
  document.getElementById('usePhoto').addEventListener('click', () => assignPhoto(state.activePhoto));
  document.getElementById('fillAll').addEventListener('click', () => {
    for (let i = 0; i < panelCount(state); i++) {
      state.panels[i].photo = state.activePhoto;
      state.panels[i].zoom = 1;
      state.panels[i].ox = 0;
      state.panels[i].oy = 0;
    }
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('fitPhoto').addEventListener('click', () => {
    const crop = state.panels[state.selected];
    crop.zoom = 1;
    crop.ox = 0;
    crop.oy = 0;
    redraw();
  });

  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    redraw();
  });
  document.querySelectorAll('[name=captionPos]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.captionPos = radio.value;
      redraw();
    });
  });

  document.getElementById('export').addEventListener('click', exportPng);

  // Drag and drop anywhere on the preview.
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  });

  // The bundled poster fonts, then paint once they are ready.
  if (document.fonts) {
    document.fonts.load('900 100px "Cover Black"').catch(() => {});
    document.fonts.load('700 40px "Cover Bold"').catch(() => {});
    document.fonts.ready.then(() => redraw());
  }
}

/** Loads the two sample photos, then opens the editor on them. */
async function loadSamples() {
  for (const name of ['pier', 'boulevard']) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      state.photos.push({ img, name, thumb: `samples/${name}.jpg` });
    } catch {
      // A missing sample just leaves the panel empty.
    }
  }
  renderStrip();
  redraw();
}

wire();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, { redraw, renderStrip, loadImage });
} else {
  loadSamples();
}
