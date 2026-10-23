import React, { useState } from 'react';
import { RotateCcw, Maximize2, ExternalLink } from 'lucide-react';

interface DesertDiveGameProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

export const DesertDiveGame: React.FC<DesertDiveGameProps> = ({
  onGameWin,
  onGamePlay,
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleRestart = () => {
    setIframeKey((prev) => prev + 1);
    if (onGamePlay) onGamePlay();
  };

  const handleFullscreenToggle = () => {
    const elem = document.getElementById('desert-dive-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Control Toolbar */}
      <div className="flex items-center justify-between w-full bg-slate-900 text-white px-4 py-3 rounded-t-2xl border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏜️</span>
          <div>
            <h3 className="text-sm font-bold leading-tight">Desert Dive</h3>
            <p className="text-[11px] text-amber-300">Click & drag Big Blue upward to launch into the oasis!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-lg text-white"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <button
            onClick={handleFullscreenToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-lg text-white"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <a
            href="./desert-dive/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-all"
            title="Open in standalone tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </a>
        </div>
      </div>

      {/* Game Iframe Container */}
      <div
        id="desert-dive-container"
        className="w-full bg-slate-950 rounded-b-2xl overflow-hidden shadow-xl border border-t-0 border-slate-200 relative flex justify-center items-center"
        style={{ minHeight: '520px', height: '65vh', maxHeight: '720px' }}
      >
        <iframe
          key={iframeKey}
          src="./desert-dive/index.html"
          title="Desert Dive"
          className="w-full h-full border-0"
          allow="autoplay"
          onLoad={() => {
            if (onGamePlay) onGamePlay();
          }}
        />
      </div>

      {/* Instructions & Mouse practice note */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4 text-xs text-slate-600">
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="font-bold text-slate-800">1. Click & Hold</span>
          <p className="text-slate-500 mt-0.5">Click directly on Big Blue to grab him.</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="font-bold text-slate-800">2. Pull Back</span>
          <p className="text-slate-500 mt-0.5">Drag upward to set the catapult trajectory.</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
          <span className="font-bold text-slate-800">3. Splashdown</span>
          <p className="text-slate-500 mt-0.5">Score 5 successful pool landings to win!</p>
        </div>
      </div>
    </div>
  );
};
