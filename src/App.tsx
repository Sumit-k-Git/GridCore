import { useEffect, useState } from 'react';
import Editor from './components/Editor';
type View = 'home' | 'grid' | 'scroll';
export default function App() {
  const [view, setView] = useState<View>('home');
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  return (
    <>
      <header className="bar">
        <button className="logo" onClick={() => setView('home')}>◧ GridMaker</button>
        <nav>
          <button className={view === 'grid' ? 'tab on' : 'tab'} onClick={() => setView('grid')}>Grid</button>
          <button className={view === 'scroll' ? 'tab on' : 'tab'} onClick={() => setView('scroll')}>Scroll</button>
          <button className="tab" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? '☀' : '☾'}</button>
        </nav>
      </header>
      <main>
        {view === 'home' && (
          <section className="hero">
            <h1>One image. Seamless Instagram.</h1>
            <p>Split a picture into a perfectly aligned profile grid or a panoramic carousel. Thumbnail-ratio aware, and everything stays in your browser.</p>
            <div className="row center">
              <button className="btn primary" onClick={() => setView('grid')}>Create Grid</button>
              <button className="btn" onClick={() => setView('scroll')}>Create Scroll Post</button>
            </div>
            <ol className="how">
              <li><b>1. Upload</b> an image.</li>
              <li><b>2. Adjust</b> zoom and position against the live preview.</li>
              <li><b>3. Download</b> the tiles and post them in the numbered order.</li>
            </ol>
            <p className="muted">No servers, no accounts, no tracking. Your images never leave your device.</p>
          </section>
        )}
        {view === 'grid' && <Editor key="grid" mode="grid" />}
        {view === 'scroll' && <Editor key="scroll" mode="scroll" />}
      </main>
    </>
  );
}
