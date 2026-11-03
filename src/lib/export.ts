import JSZip from 'jszip';
import { Layout, Placement, renderTile, Tile } from './engine';
export function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Export failed'))), 'image/png'));
}
export function saveBlob(b: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const pad = (n: number) => String(n).padStart(2, '0');
export function tileName(mode: 'grid' | 'scroll', t: Tile) {
  return mode === 'grid' ? `post-${pad(t.order)}.png` : `slide-${pad(t.index + 1)}.png`;
}
export async function downloadTile(img: HTMLImageElement, L: Layout, p: Placement, mode: 'grid' | 'scroll', t: Tile) {
  saveBlob(await toBlob(renderTile(img, L, p, t.col, t.row, 1)), tileName(mode, t));
}
export async function downloadZip(img: HTMLImageElement, L: Layout, p: Placement, mode: 'grid' | 'scroll', list: Tile[]) {
  const zip = new JSZip();
  const ordered = mode === 'grid' ? [...list].sort((a, b) => a.order - b.order) : list;
  for (const t of ordered) zip.file(tileName(mode, t), await toBlob(renderTile(img, L, p, t.col, t.row, 1)));
  saveBlob(await zip.generateAsync({ type: 'blob' }), mode === 'grid' ? 'instagram-grid.zip' : 'instagram-scroll.zip');
}
