# Grid & Scroll Banner Maker for Instagram
Open-source, fully client-side tool that splits one image into seamless Instagram profile-grid posts (3, 6 or 9) or panoramic carousel slides.

## Privacy
No backend, accounts, analytics, cookies or storage. Images are read with the browser File API, processed on a Canvas and exported locally. They never leave your device. Works offline once loaded.

## Run
```
npm install
npm run dev      # local development
npm run build    # type-check + production build in dist/
npm run preview  # serve the build
```
## Deploy
Push to `main`; enable **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy.yml` builds and publishes. Any static host works (`base` is relative).

## How the splitting algorithm works
Posts are exported at `postW × postH` (default 1080×1350, 4:5). The profile grid shows each post centre-cropped to the thumbnail ratio (default 3:4, configurable).
1. Visible region per post: `visH = postH`, `visW = round(postH × ratio)` (or the reverse if the ratio is wider than the post). Margins: `mx = (postW − visW)/2`, `my` likewise.
2. A *virtual canvas* of `cols·visW × rows·visH` is built from the visible regions only. Your image is cover-fitted to it, then zoomed/panned.
3. Tile (col,row) is rendered by translating the virtual canvas by `(mx − col·visW, my − row·visH)` into a `postW × postH` canvas. The centre `visW × visH` area is exactly what Instagram shows, so adjacent thumbnails join without gaps; the hidden margins hold neighbouring image content.
4. Newest post appears first, so tile at reading index `i` of `N` is published as post `N − i` (post 1 = bottom-right).
Scroll posts use the same engine with `cols = slides`, `visW = postW` (no crop).

## Changing the ratio
Use the selector in the app, or edit `DEFAULT_CONFIG` / `RATIO_PRESETS` in `src/lib/engine.ts`.

## License
MIT
