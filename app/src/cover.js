// Draws the cover: the photos in their panels, the colour grade, and the
// bold caption. One function, drawCover, paints any state at any pixel size,
// so the on-screen preview and the exported PNG are the same drawing — the
// preview canvas is small, the export canvas is the full post size.
//
// The look is a multi-panel poster: photos in a grid with dark gutters and a
// thin pale frame line, a sunset or neon grade washed over everything, and a
// heavy outlined caption sitting on a dark scrim so it reads on any photo.

import { SIZES, panelRects } from './state.js';

/** The accent colours each grade paints with: [top, bottom, slash]. */
const GRADE_COLORS = {
  sunset: ['#ff9a3d', '#e53888', '#ffd23e'],
  neon: ['#22d3ee', '#d946ef', '#37e6ff'],
  pink: ['#ff5da2', '#7c3aed', '#ff8fd1'],
  none: [null, null, null],
};

/**
 * Paints `state` onto the canvas's 2D context at the canvas's own size.
 * Photos are HTMLImageElements (or null); a panel with no photo gets a deep
 * violet gradient so an unfinished cover still looks deliberate.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  // Gutter and frame stay 10 and 14 pixels at the 1080 reference size, so a
  // cover looks the same in every post size.
  const unit = Math.min(w, h) / 1080;
  const gutterPx = 10 * unit;
  const frame = 14 * unit;

  // The dark board the panels sit on.
  ctx.fillStyle = '#140a1e';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, gutterPx / w, gutterPx / h);
  const n = rects.length;
  for (let i = 0; i < n; i++) {
    const [fx, fy, fw, fh] = rects[i];
    const x = frame + fx * (w - 2 * frame);
    const y = frame + fy * (h - 2 * frame);
    const pw = fw * (w - 2 * frame);
    const ph = fh * (h - 2 * frame);
    drawPanel(ctx, state, i, x, y, pw, ph);
  }

  paintGrade(ctx, state.grade, w, h, frame);
  paintSlash(ctx, state.grade, w, h);
  paintCaption(ctx, state, w, h);

  // The outer frame line, so the cover holds together as a poster.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(2, w / 960);
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
}

/** One photo panel: the photo cover-fitted with its zoom and pan, or a gradient. */
function drawPanel(ctx, state, index, x, y, pw, ph) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();

  const crop = state.panels[index];
  const entry = crop && crop.photo >= 0 ? state.photos[crop.photo] : null;
  const photo = entry ? entry.img : null;
  if (photo) {
    const zoom = crop.zoom || 1;
    const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * zoom;
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    // Pan across the spare photo the zoom leaves: ox/oy run -1..1.
    const dx = x + (pw - dw) / 2 + (crop.ox || 0) * ((dw - pw) / 2);
    const dy = y + (ph - dh) / 2 + (crop.oy || 0) * ((dh - ph) / 2);
    ctx.drawImage(photo, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, pw, ph);
  }

  // A whisper of shade at the panel's foot, so panels read as separate shots.
  const shade = ctx.createLinearGradient(0, y + ph * 0.6, 0, y + ph);
  shade.addColorStop(0, 'rgba(10, 4, 18, 0)');
  shade.addColorStop(1, 'rgba(10, 4, 18, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, pw, ph);
  ctx.restore();

  // The pale frame line around the panel.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(1.5, pw / 540);
  ctx.strokeRect(x, y, pw, ph);
}

/** Washes the grade over the whole cover: a tint, then a glow, then a vignette. */
function paintGrade(ctx, grade, w, h, frame) {
  if (grade === 'none') return;
  const [top, bottom] = GRADE_COLORS[grade];
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, w * 0.4, h);
  wash.addColorStop(0, top);
  wash.addColorStop(1, bottom);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.16;
  const tint = ctx.createLinearGradient(0, 0, 0, h);
  tint.addColorStop(0, top);
  tint.addColorStop(1, bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  // Vignette: dark corners pull the eye to the middle.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10, 4, 18, 0)');
  vig.addColorStop(1, 'rgba(10, 4, 18, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A diagonal slash of the grade's accent colour across the top corner. */
function paintSlash(ctx, grade, w, h) {
  if (grade === 'none') return;
  const accent = GRADE_COLORS[grade][2];
  ctx.save();
  ctx.translate(w, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-h * 0.12, -w * 0.028, h * 0.24, w * 0.02);
  ctx.globalAlpha = 0.55;
  ctx.fillRect(-h * 0.12, -w * 0.008, h * 0.24, w * 0.008);
  ctx.restore();
}

/** The caption: a dark scrim, then the heavy title and the spaced subtitle. */
function paintCaption(ctx, state, w, h) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (!title && !subtitle) return;

  const atTop = state.captionPos === 'top';
  const bandH = h * 0.3;
  const scrim = ctx.createLinearGradient(0, atTop ? 0 : h - bandH, 0, atTop ? bandH : h);
  scrim.addColorStop(0, atTop ? 'rgba(10, 4, 18, 0.72)' : 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(1, atTop ? 'rgba(10, 4, 18, 0)' : 'rgba(10, 4, 18, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, atTop ? 0 : h - bandH, w, bandH);

  const cx = w / 2;
  const base = h * 0.115 * (state.titleSize || 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (title) {
    let size = base;
    ctx.font = `900 ${size}px "Cover Black", "Noto Sans", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.03)}px`; } catch { /* older canvas: no letter spacing */ }
    while (ctx.measureText(title).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `900 ${size}px "Cover Black", "Noto Sans", sans-serif`;
      try { ctx.letterSpacing = `${Math.round(size * 0.03)}px`; } catch { /* ignore */ }
    }
    const ty = atTop ? h * 0.16 : h - h * 0.1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 6, 26, 0.9)';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeText(title, cx, ty);
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.fillText(title, cx, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (subtitle) {
    const subSize = Math.max(12, h * 0.032 * (state.titleSize || 1));
    ctx.font = `700 ${subSize}px "Cover Bold", "Noto Sans", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.42)}px`; } catch { /* ignore */ }
    const sy = atTop
      ? h * 0.16 + base * 0.72
      : h - h * 0.1 + subSize * 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(subtitle, cx, sy);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

/** The pixel size a state exports at. */
export function exportSize(state) {
  return SIZES[state.size];
}
