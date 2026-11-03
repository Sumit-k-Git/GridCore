import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONFIG, RATIO_PRESETS, Placement, clampPlacement, gridLayout, imageRect, renderTile, scrollLayout, tiles, Tile, Layout } from '../lib/engine';
import { downloadTile, downloadZip } from '../lib/export';

type Mode = 'grid' | 'scroll';

function TileThumb({ img, L, p, t, mode }: { img: HTMLImageElement; L: Layout; p: Placement; t: Tile; mode: Mode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = renderTile(img, L, p, t.col, t.row, 0.2), cv = ref.current!;
    cv.width = c.width; cv.height = c.height; cv.getContext('2d')!.drawImage(c, 0, 0);
  }, [img, L, p, t]);
  return (
    <div className="tile">
      <canvas ref={ref} />
      <span className="badge">{mode === 'grid' ? `Post ${t.order}` : `Slide ${t.index + 1}`}</span>
      <button className="btn small" onClick={() => downloadTile(img, L, p, mode, t)}>Download</button>
    </div>
  );
}

export default function Editor({ mode }: { mode: Mode }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [count, setCount] = useState(mode === 'grid' ? 9 : 3);
  const [ratio, setRatio] = useState(DEFAULT_CONFIG.thumbRatio);
  const [p, setP] = useState<Placement>({ zoom: 1, panX: 0, panY: 0 });
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const prev = useRef<HTMLCanvasElement>(null), prof = useRef<HTMLCanvasElement>(null), car = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; p: Placement } | null>(null);

  const L = useMemo(() => {
    const cfg = { ...DEFAULT_CONFIG, thumbRatio: ratio };
    return mode === 'grid' ? gridLayout(count, cfg) : scrollLayout(count, cfg);
  }, [mode, count, ratio]);
  const pc = useMemo(() => (img ? clampPlacement(img.naturalWidth, img.naturalHeight, L, p) : p), [img, L, p]);
  const list = useMemo(() => tiles(L), [L]);
  const sl = Math.min(slide, L.cols - 1);

  function load(f?: File) {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); setErr(''); setP({ zoom: 1, panX: 0, panY: 0 }); setSlide(0); setImg(im); };
    im.onerror = () => { URL.revokeObjectURL(url); setErr('Could not read that image.'); };
    im.src = url;
  }

  useEffect(() => {
    if (!img || !prev.current) return;
    const k = Math.min(1, 900 / L.vw), cv = prev.current;
    cv.width = Math.round(L.vw * k); cv.height = Math.round(L.vh * k);
    const ctx = cv.getContext('2d')!, r = imageRect(img.naturalWidth, img.naturalHeight, L, pc);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, r.x * k, r.y * k, r.w * k, r.h * k);
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
    ctx.beginPath();
    for (let c = 1; c < L.cols; c++) { ctx.moveTo(c * L.visW * k, 0); ctx.lineTo(c * L.visW * k, cv.height); }
    for (let r2 = 1; r2 < L.rows; r2++) { ctx.moveTo(0, r2 * L.visH * k); ctx.lineTo(cv.width, r2 * L.visH * k); }
    ctx.stroke();
  }, [img, L, pc]);

  useEffect(() => {
    if (mode !== 'grid' || !img || !prof.current) return;
    const k = Math.min(1, 540 / L.vw), g = 2, cv = prof.current;
    cv.width = Math.round(L.vw * k) + g * (L.cols - 1); cv.height = Math.round(L.vh * k) + g * (L.rows - 1);
    const ctx = cv.getContext('2d')!, r = imageRect(img.naturalWidth, img.naturalHeight, L, pc);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingQuality = 'high';
    for (let row = 0; row < L.rows; row++) for (let col = 0; col < L.cols; col++) {
      const ox = col * (L.visW * k + g), oy = row * (L.visH * k + g);
      ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, L.visW * k, L.visH * k); ctx.clip();
      ctx.drawImage(img, ox + r.x * k - col * L.visW * k, oy + r.y * k - row * L.visH * k, r.w * k, r.h * k);
      ctx.restore();
    }
  }, [mode, img, L, pc]);

  useEffect(() => {
    if (mode !== 'scroll' || !img || !car.current) return;
    const c = renderTile(img, L, pc, sl, 0, 0.35), cv = car.current;
    cv.width = c.width; cv.height = c.height; cv.getContext('2d')!.drawImage(c, 0, 0);
  }, [mode, img, L, pc, sl]);

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, p: pc };
  }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current; if (!d || !img) return;
    const f = L.vw / e.currentTarget.clientWidth;
    setP(clampPlacement(img.naturalWidth, img.naturalHeight, L, { ...d.p, panX: d.p.panX + (e.clientX - d.x) * f, panY: d.p.panY + (e.clientY - d.y) * f }));
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'Export failed'); }
    setBusy(false);
  }

  return (
    <div className="editor">
      <h2>{mode === 'grid' ? 'Grid Post Maker' : 'Scroll Post Maker'}</h2>
      <div className={'drop'} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); load(e.dataTransfer.files[0]); }}>
        <label>
          <input type="file" accept="image/*" hidden onChange={e => { load(e.target.files?.[0]); e.target.value = ''; }} />
          <span className="btn primary">{img ? 'Replace image' : 'Choose image'}</span> <span className="muted">or drag &amp; drop here</span>
        </label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="controls">
        {mode === 'grid' ? (
          <div className="seg">{[3, 6, 9].map(n => <button key={n} className={count === n ? 'tab on' : 'tab'} onClick={() => setCount(n)}>{n} posts</button>)}</div>
        ) : (
          <label>Slides: <b>{count}</b> <input type="range" min={2} max={10} value={count} onChange={e => setCount(+e.target.value)} /></label>
        )}
        {mode === 'grid' && (
          <label>Thumbnail ratio{' '}
            <select value={ratio} onChange={e => setRatio(+e.target.value)}>
              {RATIO_PRESETS.map(r => <option key={r.label} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        )}
        <label>Zoom: <b>{pc.zoom.toFixed(2)}×</b>{' '}
          <input type="range" min={1} max={5} step={0.01} value={pc.zoom} disabled={!img}
            onChange={e => img && setP(clampPlacement(img.naturalWidth, img.naturalHeight, L, { ...pc, zoom: +e.target.value }))} />
        </label>
        <button className="btn" disabled={!img} onClick={() => setP({ zoom: 1, panX: 0, panY: 0 })}>Reset</button>
      </div>

      {!img ? <p className="muted">Upload an image to begin.</p> : (
        <>
          <h3>Position <span className="muted">(drag to move)</span></h3>
          <canvas ref={prev} className="stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} />

          {mode === 'grid' && (<>
            <h3>Profile preview</h3>
            <canvas ref={prof} className="profile" />
          </>)}
          {mode === 'scroll' && (<>
            <h3>Carousel preview</h3>
            <div className="row center">
              <button className="btn" disabled={sl === 0} onClick={() => setSlide(sl - 1)}>‹</button>
              <canvas ref={car} className="slide" />
              <button className="btn" disabled={sl === L.cols - 1} onClick={() => setSlide(sl + 1)}>›</button>
            </div>
            <p className="muted center">Slide {sl + 1} of {L.cols}</p>
          </>)}

          <h3>Tiles</h3>
          <div className="tiles" style={{ gridTemplateColumns: `repeat(${mode === 'grid' ? 3 : Math.min(L.cols, 5)}, minmax(0,1fr))` }}>
            {list.map(t => <TileThumb key={t.index} img={img} L={L} p={pc} t={t} mode={mode} />)}
          </div>
          <button className="btn primary" disabled={busy} onClick={() => run(() => downloadZip(img, L, pc, mode, list))}>{busy ? 'Working…' : 'Download all (ZIP)'}</button>

          <h3>How to publish</h3>
          {mode === 'grid' ? (
            <ol className="how">
              <li>Instagram shows the newest post first, so publish in numeric order: <b>Post 1 first, Post {list.length} last</b>.</li>
              <li>Post 1 is the <b>bottom-right</b> tile; Post {list.length} is the <b>top-left</b>.</li>
              <li>Upload each file at full size without cropping or filters. Files are 1080×1350; Instagram centre-crops them to the grid ratio.</li>
              <li>Archive or delete old posts if you want the grid to start clean.</li>
            </ol>
          ) : (
            <ol className="how">
              <li>Create one carousel post and add the slides in order: Slide 1 to Slide {L.cols}.</li>
              <li>Do not crop on upload; every slide is 1080×1350.</li>
            </ol>
          )}
        </>
      )}
    </div>
  );
}
