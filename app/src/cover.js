// Draws the cover: the photos in their panels, the colour grade, and the
// bold caption. One function, drawCover, paints any state at any pixel size,
// so the on-screen preview and the exported PNG are the same drawing — the
// preview canvas is small, the export canvas is the full post size.
//
// The look is a multi-panel poster: photos in a grid with dark gutters and a
// thin pale frame line, a sunset or neon grade washed over everything, and a
// heavy outlined caption sitting on a dark scrim so it reads on any photo.

import { SIZES, panelRects } from './state.js';

/** The accent colours each grade paints with, and how hard it paints them.
 * top/bottom are the duotone ends, accent is the slash and badge colour,
 * sat/contrast boost the photo first, and alpha is how strong the duotone
 * wash lands. Round 2 grades are deliberately punchy: the wash is obvious
 * at a glance, not a whisper. */
const GRADE_DEFS = {
  sunset: { top: '#ff9a3d', bottom: '#e53888', accent: '#ffd23e', sat: 1.5, contrast: 1.1, alpha: 0.52 },
  neon: { top: '#22d3ee', bottom: '#d946ef', accent: '#37e6ff', sat: 1.55, contrast: 1.12, alpha: 0.55 },
  pink: { top: '#ff5da2', bottom: '#7c3aed', accent: '#ff8fd1', sat: 1.5, contrast: 1.1, alpha: 0.52 },
  ocean: { top: '#2dd4bf', bottom: '#f97316', accent: '#fde047', sat: 1.55, contrast: 1.1, alpha: 0.55 },
  hotline: { top: '#ff2e88', bottom: '#00e5ff', accent: '#ffe600', sat: 1.6, contrast: 1.12, alpha: 0.58 },
  midnight: { top: '#7c3aed', bottom: '#2563eb', accent: '#a78bfa', sat: 1.45, contrast: 1.1, alpha: 0.55 },
  gold: { top: '#fbbf24', bottom: '#dc2626', accent: '#fde68a', sat: 1.55, contrast: 1.1, alpha: 0.55 },
  none: { top: null, bottom: null, accent: null, sat: 1, contrast: 1, alpha: 0 },
};

/**
 * Paints `state` onto the canvas's 2D context at the canvas's own size.
 * Photos are HTMLImageElements (or null); a panel with no photo gets a deep
 * violet gradient so an unfinished cover still looks deliberate.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  // Crisp scaling: the preview canvas is already full post size, and the
  // export is the same drawing, so photos and lettering stay sharp.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
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

  paintVignette(ctx, w, h);
  paintSlash(ctx, state.grade, w, h);
  paintCaption(ctx, state, w, h);

  // The outer frame line, so the cover holds together as a poster.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(2, w / 960);
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
}

/** One photo panel: the photo cover-fitted with its zoom and pan, graded hard
 * in the panel's own grade (or the cover's grade when the panel has none),
 * or a gradient when the panel is empty. */
function drawPanel(ctx, state, index, x, y, pw, ph) {
  const crop = state.panels[index];
  const grade = (crop && crop.grade) || state.grade;
  const def = GRADE_DEFS[grade] || GRADE_DEFS.none;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();

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
    // Saturate and add contrast first, so the duotone has vivid colour to bite.
    ctx.filter = `saturate(${def.sat}) contrast(${def.contrast})`;
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, pw, ph);
  }

  // The duotone: a strong two-stop wash in 'overlay', then a 'color' pass
  // that pushes the hues further without flattening the photo's light.
  if (grade !== 'none') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = def.alpha;
    const wash = ctx.createLinearGradient(x, y, x + pw * 0.4, y + ph);
    wash.addColorStop(0, def.top);
    wash.addColorStop(1, def.bottom);
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, pw, ph);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.28;
    const hue = ctx.createLinearGradient(x, y, x, y + ph);
    hue.addColorStop(0, def.top);
    hue.addColorStop(1, def.bottom);
    ctx.fillStyle = hue;
    ctx.fillRect(x, y, pw, ph);
    ctx.restore();
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

/** Vignette only: dark corners pull the eye to the middle. The colour work
 * now lives in each panel (drawPanel), so the grade is strong panel by panel
 * instead of one weak wash over the whole cover. */
function paintVignette(ctx, w, h) {
  ctx.save();
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
  const accent = GRADE_DEFS[grade].accent;
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
  const hasBadge = Boolean((state.badge || '').trim());
  if (!title && !subtitle && !hasBadge) return;

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
    const style = state.titleStyle || 'solid';
    const def = GRADE_DEFS[state.grade] || GRADE_DEFS.none;
    const ink = state.titleColor || '#ffffff';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    if (style === 'gradient') {
      // The title fades through the grade's colours, left to right.
      const grad = ctx.createLinearGradient(cx - w * 0.3, 0, cx + w * 0.3, 0);
      if (state.grade === 'none') {
        grad.addColorStop(0, ink);
        grad.addColorStop(0.5, '#ffd23e');
        grad.addColorStop(1, ink);
      } else {
        grad.addColorStop(0, def.top);
        grad.addColorStop(0.5, def.accent);
        grad.addColorStop(1, def.bottom);
      }
      ctx.strokeStyle = 'rgba(16, 6, 26, 0.9)';
      ctx.lineWidth = Math.max(3, size * 0.08);
      ctx.strokeText(title, cx, ty);
      ctx.fillStyle = grad;
      ctx.fillText(title, cx, ty);
    } else if (style === 'outline') {
      // Hollow letters: a dark fill under a thick coloured edge, so the
      // outline reads on any photo behind it.
      ctx.fillStyle = 'rgba(16, 6, 26, 0.45)';
      ctx.fillText(title, cx, ty);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(3, size * 0.07);
      ctx.strokeText(title, cx, ty);
      ctx.strokeStyle = 'rgba(16, 6, 26, 0.85)';
      ctx.lineWidth = Math.max(1.5, size * 0.02);
      ctx.strokeText(title, cx, ty);
    } else {
      ctx.strokeStyle = 'rgba(16, 6, 26, 0.9)';
      ctx.lineWidth = Math.max(3, size * 0.1);
      ctx.strokeText(title, cx, ty);
      ctx.fillStyle = ink;
      ctx.fillText(title, cx, ty);
    }
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

  // The badge: a small sticker pill in the grade's accent colour, above the
  // title at the bottom or below the subtitle at the top.
  const badge = (state.badge || '').trim().toUpperCase();
  if (badge) {
    const def = GRADE_DEFS[state.grade] || GRADE_DEFS.none;
    const bSize = Math.max(12, h * 0.026 * (state.titleSize || 1));
    ctx.font = `700 ${bSize}px "Cover Bold", "Noto Sans", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(bSize * 0.28)}px`; } catch { /* ignore */ }
    const tw = ctx.measureText(badge).width;
    const padX = bSize * 0.9;
    const padY = bSize * 0.55;
    const bw = tw + padX * 2;
    const bh = bSize + padY * 2;
    const bx = cx - bw / 2;
    const by = atTop
      ? h * 0.16 + base * 0.72 + Math.max(12, h * 0.032) * 1.7
      : h - h * 0.1 - base * 1.05 - bh;
    ctx.fillStyle = def.accent || '#ffd23e';
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#1d1b22';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, cx, by + bh / 2 + bSize * 0.04);
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

/** A rounded rectangle path, without relying on ctx.roundRect. */
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** The pixel size a state exports at. */
export function exportSize(state) {
  return SIZES[state.size];
}
