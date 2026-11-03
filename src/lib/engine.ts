export interface Config { postW: number; postH: number; thumbRatio: number }
export const DEFAULT_CONFIG: Config = { postW: 1080, postH: 1350, thumbRatio: 3 / 4 };
export const RATIO_PRESETS: { label: string; value: number }[] = [
  { label: '3:4 (current grid, recommended)', value: 3 / 4 },
  { label: '4:5', value: 4 / 5 },
  { label: '1:1 (legacy square grid)', value: 1 },
];
export interface Placement { zoom: number; panX: number; panY: number }
export interface Layout {
  cols: number; rows: number; visW: number; visH: number; mx: number; my: number;
  vw: number; vh: number; postW: number; postH: number;
}
export interface Rect { x: number; y: number; w: number; h: number }

function mk(cols: number, rows: number, visW: number, visH: number, c: Config): Layout {
  return {
    cols, rows, visW, visH,
    mx: Math.floor((c.postW - visW) / 2), my: Math.floor((c.postH - visH) / 2),
    vw: cols * visW, vh: rows * visH, postW: c.postW, postH: c.postH,
  };
}
export function gridLayout(count: number, c: Config): Layout {
  const rows = Math.max(1, Math.round(count / 3));
  let visW = c.postW, visH = c.postH;
  if (c.thumbRatio < c.postW / c.postH) visW = Math.round(c.postH * c.thumbRatio);
  else visH = Math.round(c.postW / c.thumbRatio);
  return mk(3, rows, visW, visH, c);
}
export function scrollLayout(n: number, c: Config): Layout { return mk(n, 1, c.postW, c.postH, c); }

export function imageRect(iw: number, ih: number, L: Layout, p: Placement): Rect {
  const s = Math.max(L.vw / iw, L.vh / ih) * p.zoom;
  const w = iw * s, h = ih * s;
  return { x: (L.vw - w) / 2 + p.panX, y: (L.vh - h) / 2 + p.panY, w, h };
}
export function clampPlacement(iw: number, ih: number, L: Layout, p: Placement): Placement {
  const zoom = Math.min(5, Math.max(1, p.zoom));
  const r = imageRect(iw, ih, L, { zoom, panX: 0, panY: 0 });
  const mx = Math.max(0, (r.w - L.vw) / 2), my = Math.max(0, (r.h - L.vh) / 2);
  return { zoom, panX: Math.min(mx, Math.max(-mx, p.panX)), panY: Math.min(my, Math.max(-my, p.panY)) };
}
export function renderTile(img: HTMLImageElement, L: Layout, p: Placement, col: number, row: number, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(L.postW * scale); c.height = Math.round(L.postH * scale);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);
  ctx.translate(L.mx - col * L.visW, L.my - row * L.visH);
  const r = imageRect(img.naturalWidth, img.naturalHeight, L, p);
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  return c;
}
export interface Tile { col: number; row: number; index: number; order: number }
export function tiles(L: Layout): Tile[] {
  const total = L.cols * L.rows, out: Tile[] = [];
  for (let row = 0; row < L.rows; row++) for (let col = 0; col < L.cols; col++) {
    const index = row * L.cols + col; out.push({ col, row, index, order: total - index });
  }
  return out;
}
