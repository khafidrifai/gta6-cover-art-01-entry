// The cover's state: which post size, which panel layout, which colour grade,
// the caption words and where they sit, the photos, and one crop per panel.
//
// A panel's crop is a photo index plus a zoom and a pan. Zoom 1 fills the
// panel edge to edge; zooming in leaves spare photo to pan across, and ox/oy
// (each -1..1) say how far across that spare strip the photo sits. The
// editor drags a panel's photo to change its pan, and a slider changes zoom.

export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Landscape · 1920 × 1080', w: 1920, h: 1080 },
};

export const LAYOUTS = {
  solo: { label: 'Solo — one full photo', panels: 1 },
  'duo-v': { label: 'Duo — side by side', panels: 2 },
  'duo-h': { label: 'Duo — stacked', panels: 2 },
  trio: { label: 'Trio — big left, two right', panels: 3 },
  'trio-w': { label: 'Trio — big top, two below', panels: 3 },
  quad: { label: 'Quad — four squares', panels: 4 },
  'big-center': { label: 'Big Centre — tall middle, two each side', panels: 5 },
  strip: { label: 'Film Strip — big top, three below', panels: 4 },
  five: { label: 'Five — big left, four right', panels: 5 },
};

export const GRADES = {
  sunset: { label: 'Sunset', hint: 'Warm orange into pink' },
  neon: { label: 'Neon Nights', hint: 'Cyan and magenta glow' },
  pink: { label: 'Vice Pink', hint: 'Pink and violet haze' },
  ocean: { label: 'Ocean Drive', hint: 'Teal sea into hot orange' },
  hotline: { label: 'Hotline', hint: 'Hot pink and electric cyan' },
  midnight: { label: 'Midnight', hint: 'Deep violet into electric blue' },
  gold: { label: 'Gold Rush', hint: 'Gold into burning red' },
  none: { label: 'Original', hint: 'No colour grade' },
};

export const TITLE_COLORS = ['#ffffff', '#ffd23e', '#ff5da2', '#37e6ff', '#ff6b35', '#a3e635', '#1d1b22'];

export const TITLE_STYLES = {
  solid: { label: 'Solid', hint: 'One flat colour' },
  gradient: { label: 'Gradient', hint: 'Title fades through the grade colours' },
  outline: { label: 'Outline', hint: 'Hollow letters, thick coloured edge' },
};

/** The title fonts, all bundled under app/fonts/ under the SIL Open Font
 * License — no Rockstar font anywhere. Each entry tunes how the face is set:
 * `family` is the @font-face name, `weight` the weight the file carries,
 * `track` the letter-spacing as a fraction of the title size (condensed
 * faces want air, wide faces want none), `skew` a slight forward lean for
 * speed (radians, applied as a shear), and `scale` a size correction — a
 * face that draws small at the same point size gets scaled up. The subtitle
 * follows the title's font, at its own size and tracking. */
export const TITLE_FONTS = {
  anton: { label: 'Anton', family: 'Title Anton', weight: 400, track: 0.01, skew: -0.06, scale: 1.0, hint: 'Heavy condensed poster caps' },
  bebas: { label: 'Bebas Neue', family: 'Title Bebas', weight: 400, track: 0.05, skew: -0.04, scale: 1.14, hint: 'Tall condensed caps' },
  monoton: { label: 'Monoton', family: 'Title Monoton', weight: 400, track: 0.02, skew: 0, scale: 0.94, hint: 'Neon-tube lettering' },
  alfa: { label: 'Alfa Slab', family: 'Title Alfa', weight: 400, track: 0.0, skew: 0, scale: 0.96, hint: 'Bold slab serif' },
  bungee: { label: 'Bungee', family: 'Title Bungee', weight: 400, track: 0.0, skew: 0, scale: 0.9, hint: 'Chunky stacked display' },
  archivo: { label: 'Archivo Black', family: 'Title Archivo', weight: 400, track: 0.0, skew: 0, scale: 0.96, hint: 'Extra-heavy grotesque' },
  noto: { label: 'Noto Black', family: 'Cover Black', weight: 900, track: 0.03, skew: 0, scale: 1.0, hint: 'Clean heavy sans' },
};

/** A fresh cover: the two sample photos already loaded, trio layout, sunset grade.
 * A panel's `grade` is its own colour grade, or null to follow the cover's
 * grade: the same photo in two panels with different crops and different
 * grades looks like two different shots. */
export function defaultState() {
  return {
    size: 'wide',
    layout: 'trio',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'LEONIDA NIGHTS',
    titleSize: 1,
    titleFont: 'anton',
    titleColor: '#ffffff',
    titleStyle: 'solid',
    badge: '',
    captionPos: 'bottom',
    photos: [],
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0, grade: null },
      { photo: 1, zoom: 1, ox: 0, oy: 0, grade: null },
      { photo: 1, zoom: 1, ox: 0, oy: 0, grade: null },
      { photo: 0, zoom: 1, ox: 0, oy: 0, grade: null },
      { photo: 1, zoom: 1, ox: 0, oy: 0, grade: null },
    ],
    selected: 0,
    activePhoto: 0,
  };
}

/** How many panels the current layout shows. */
export function panelCount(state) {
  return LAYOUTS[state.layout].panels;
}

/** The panel rectangles for a layout, as fractions of the cover (x, y, w, h).
 * gx is the gutter as a fraction of the width, gy as a fraction of the height. */
export function panelRects(layout, gx, gy) {
  switch (layout) {
    case 'solo':
      return [[0, 0, 1, 1]];
    case 'duo-v':
      return [[0, 0, 0.5 - gx / 2, 1], [0.5 + gx / 2, 0, 0.5 - gx / 2, 1]];
    case 'duo-h':
      return [[0, 0, 1, 0.5 - gy / 2], [0, 0.5 + gy / 2, 1, 0.5 - gy / 2]];
    case 'trio':
      return [
        [0, 0, 0.62 - gx / 2, 1],
        [0.62 + gx / 2, 0, 0.38 - gx / 2, 0.5 - gy / 2],
        [0.62 + gx / 2, 0.5 + gy / 2, 0.38 - gx / 2, 0.5 - gy / 2],
      ];
    case 'trio-w':
      return [
        [0, 0, 1, 0.62 - gy / 2],
        [0, 0.62 + gy / 2, 0.5 - gx / 2, 0.38 - gy / 2],
        [0.5 + gx / 2, 0.62 + gy / 2, 0.5 - gx / 2, 0.38 - gy / 2],
      ];
    case 'quad':
      return [
        [0, 0, 0.5 - gx / 2, 0.5 - gy / 2],
        [0.5 + gx / 2, 0, 0.5 - gx / 2, 0.5 - gy / 2],
        [0, 0.5 + gy / 2, 0.5 - gx / 2, 0.5 - gy / 2],
        [0.5 + gx / 2, 0.5 + gy / 2, 0.5 - gx / 2, 0.5 - gy / 2],
      ];
    case 'big-center': {
      // Tall middle panel, two stacked panels on each side.
      const side = 0.25 - gx / 2;
      return [
        [0, 0, side, 0.5 - gy / 2],
        [0, 0.5 + gy / 2, side, 0.5 - gy / 2],
        [0.25 + gx / 2, 0, 0.5 - gx, 1],
        [0.75 + gx / 2, 0, side, 0.5 - gy / 2],
        [0.75 + gx / 2, 0.5 + gy / 2, side, 0.5 - gy / 2],
      ];
    }
    case 'strip': {
      // One big panel on top, three across the bottom — a film strip.
      const third = (1 - 2 * gx) / 3;
      return [
        [0, 0, 1, 0.62 - gy / 2],
        [0, 0.62 + gy / 2, third, 0.38 - gy / 2],
        [third + gx, 0.62 + gy / 2, third, 0.38 - gy / 2],
        [2 * third + 2 * gx, 0.62 + gy / 2, third, 0.38 - gy / 2],
      ];
    }
    case 'five': {
      // One big panel on the left, a 2×2 grid on the right.
      const col = 0.25 - (gx * 3) / 4;
      return [
        [0, 0, 0.5 - gx / 2, 1],
        [0.5 + gx / 2, 0, col, 0.5 - gy / 2],
        [0.75 + gx / 2, 0, col, 0.5 - gy / 2],
        [0.5 + gx / 2, 0.5 + gy / 2, col, 0.5 - gy / 2],
        [0.75 + gx / 2, 0.5 + gy / 2, col, 0.5 - gy / 2],
      ];
    }
    default:
      return [[0, 0, 1, 1]];
  }
}
