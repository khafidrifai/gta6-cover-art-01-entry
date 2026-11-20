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
};

export const GRADES = {
  sunset: { label: 'Sunset', hint: 'Warm orange into pink' },
  neon: { label: 'Neon Nights', hint: 'Cyan and magenta glow' },
  pink: { label: 'Vice Pink', hint: 'Pink and violet haze' },
  none: { label: 'Original', hint: 'No colour grade' },
};

export const TITLE_COLORS = ['#ffffff', '#ffd23e', '#ff5da2', '#37e6ff', '#1d1b22'];

/** A fresh cover: the two sample photos already loaded, trio layout, sunset grade. */
export function defaultState() {
  return {
    size: 'wide',
    layout: 'trio',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'LEONIDA NIGHTS',
    titleSize: 1,
    titleColor: '#ffffff',
    captionPos: 'bottom',
    photos: [],
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
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
    default:
      return [[0, 0, 1, 1]];
  }
}
