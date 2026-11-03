# Contributing
1. Fork and clone, then `npm install` and `npm run dev`.
2. Keep all processing client-side: no network calls, analytics or storage of user images.
3. Math lives in `src/lib/engine.ts`; keep it free of React. Run `npm run build` (type-checks) before opening a PR.
4. If Instagram changes its grid again, update `DEFAULT_CONFIG` / `RATIO_PRESETS` in `src/lib/engine.ts`.
