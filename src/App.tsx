import React, { useState, useEffect, useCallback } from 'react';
import { GameId, ARCADE_GAMES, INITIAL_STICKERS, StickerAchievement } from './types/game';
import { TicTacToeGame } from './components/games/TicTacToeGame';
import { MemoryGame } from './components/games/MemoryGame';
import { FallingBlocksGame } from './components/games/FallingBlocksGame';
import { JellyBounceLabGame } from './components/games/JellyBounceLabGame';
import { ChameleonColorDashGame } from './components/games/ChameleonColorDashGame';
import { ShapeMatchGame } from './components/games/ShapeMatchGame';
import { BalloonPopGame } from './components/games/BalloonPopGame';
import { DesertDiveGame } from './components/games/DesertDiveGame';
import { GameCard } from './components/GameCard';
import { StickerModal } from './components/StickerModal';
import { AudioControls } from './components/AudioControls';
import { sound } from './sound/soundEffects';
import {
  Gamepad2,
  Sparkles,
  ArrowLeft,
  Award,
  Users,
  Brain,
  Layers,
  Heart,
  ChevronRight,
  Shuffle,
} from 'lucide-react';

export default function App() {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState<boolean>(false);
  const [stickers, setStickers] = useState<StickerAchievement[]>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_stickers');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_STICKERS;
  });

  const [playedGames, setPlayedGames] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_played_games');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save stickers to localStorage
  const unlockSticker = useCallback((stickerId: string) => {
    setStickers((prev) => {
      const target = prev.find((s) => s.id === stickerId);
      if (!target || target.unlocked) return prev; // Do not trigger state update if already unlocked
      sound.playWin();
      const updated = prev.map((s) => {
        if (s.id === stickerId) {
          return { ...s, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return s;
      });
      try {
        localStorage.setItem('wonderpix_stickers', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Track gameplay for sticker achievements
  const handleGamePlay = useCallback((gameId: GameId) => {
    unlockSticker('first_play');
    setPlayedGames((prev) => {
      if (prev.has(gameId)) return prev; // Do not trigger state update if already played
      const next = new Set(prev);
      next.add(gameId);
      try {
        localStorage.setItem('wonderpix_played_games', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      if (next.size >= 3) {
        unlockSticker('curious_explorer');
      }
      return next;
    });
  }, [unlockSticker]);

  const handleGameWin = useCallback((gameId: GameId) => {
    if (gameId === 'shapematch') {
      unlockSticker('shape_wizard');
    } else if (gameId === 'balloonpop') {
      unlockSticker('balloon_master');
    } else if (gameId === 'colordash') {
      unlockSticker('curious_explorer');
    } else if (gameId === 'jellybounce') {
      unlockSticker('stack_master');
    } else if (gameId === 'tictactoe') {
      unlockSticker('tic_win');
    } else if (gameId === 'memory') {
      unlockSticker('memory_ace');
    } else if (gameId === 'fallingblocks') {
      unlockSticker('combo_king');
    }
  }, [unlockSticker]);

  const selectGame = (id: GameId | null) => {
    sound.playTap(520);
    setActiveGameId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pickRandomGame = () => {
    sound.playTap(640);
    const options: GameId[] = [
      'shapematch',
      'balloonpop',
      'colordash',
      'jellybounce',
      'tictactoe',
      'memory',
      'fallingblocks',
    ];
    const chosen = options[Math.floor(Math.random() * options.length)];
    setActiveGameId(chosen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeGameMeta = ARCADE_GAMES.find((g) => g.id === activeGameId);
  const unlockedStickerCount = stickers.filter((s) => s.unlocked).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 
        Top Bar Contract:
        [Brand title, one line] — [4-5 nav links, 1-2 word labels, single-line] — [1 primary action]
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand title wordmark, single element, no descriptor tags */}
          <button
            onClick={() => selectGame(null)}
            className="text-xl font-extrabold tracking-tight text-slate-900 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shadow-xs">
              🎮
            </div>
            <span>WonderPix Arcade</span>
          </button>

          {/* Zone 2: 4-5 concise single-line text links */}
          <nav className="hidden lg:flex items-center gap-4 text-xs xl:text-sm font-semibold text-slate-600">
            <button
              onClick={() => selectGame(null)}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === null ? 'text-blue-600 font-bold' : ''
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => selectGame('shapematch')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'shapematch' ? 'text-purple-600 font-bold' : ''
              }`}
            >
              Shape Match
            </button>
            <button
              onClick={() => selectGame('balloonpop')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'balloonpop' ? 'text-rose-600 font-bold' : ''
              }`}
            >
              Balloon Pop
            </button>
            <button
              onClick={() => selectGame('colordash')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'colordash' ? 'text-emerald-600 font-bold' : ''
              }`}
            >
              Color Dash
            </button>
            <button
              onClick={() => selectGame('jellybounce')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'jellybounce' ? 'text-pink-600 font-bold' : ''
              }`}
            >
              Jelly Bounce
            </button>
            <button
              onClick={() => selectGame('tictactoe')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'tictactoe' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Tic Tac Toe
            </button>
            <button
              onClick={() => selectGame('memory')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'memory' ? 'text-emerald-600 font-bold' : ''
              }`}
            >
              Memory Match
            </button>
            <button
              onClick={() => selectGame('fallingblocks')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeGameId === 'fallingblocks' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              Critter Drop
            </button>
            <button
              onClick={() => {
                sound.playTap(440);
                setIsStickerModalOpen(true);
              }}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>Stickers</span>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                {unlockedStickerCount}/8
              </span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <AudioControls />
            <button
              onClick={pickRandomGame}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random Game</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeGameId && activeGameMeta ? (
          /* ACTIVE GAME VIEW */
          <div className="flex flex-col">
            {/* Game Navigation Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <button
                onClick={() => selectGame(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Games</span>
              </button>

              {/* Game switcher quick tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                {ARCADE_GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGame(g.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      g.id === activeGameId
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Title Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-1">
                <span>{activeGameMeta.playerMode}</span>
                <span aria-hidden="true">·</span>
                <span>{activeGameMeta.targetAge}</span>
                <span aria-hidden="true">·</span>
                <span>PixiJS 2D Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {activeGameMeta.title}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-xl mx-auto">
                {activeGameMeta.description}
              </p>
            </div>

            {/* Active Game Canvas Component */}
            <div className="w-full">
              {activeGameId === 'desertdive' && (
                <DesertDiveGame
                  onGamePlay={() => handleGamePlay('desertdive')}
                  onGameWin={() => handleGameWin('desertdive')}
                />
              )}
              {activeGameId === 'shapematch' && (
                <ShapeMatchGame
                  onGamePlay={() => handleGamePlay('shapematch')}
                  onGameWin={() => handleGameWin('shapematch')}
                />
              )}
              {activeGameId === 'balloonpop' && (
                <BalloonPopGame
                  onGamePlay={() => handleGamePlay('balloonpop')}
                  onGameWin={() => handleGameWin('balloonpop')}
                />
              )}
              {activeGameId === 'colordash' && (
                <ChameleonColorDashGame
                  onGamePlay={() => handleGamePlay('colordash')}
                  onGameWin={() => handleGameWin('colordash')}
                />
              )}
              {activeGameId === 'jellybounce' && (
                <JellyBounceLabGame
                  onGamePlay={() => handleGamePlay('jellybounce')}
                  onGameWin={() => handleGameWin('jellybounce')}
                />
              )}
              {activeGameId === 'tictactoe' && (
                <TicTacToeGame
                  onGamePlay={() => handleGamePlay('tictactoe')}
                  onGameWin={() => handleGameWin('tictactoe')}
                />
              )}
              {activeGameId === 'memory' && (
                <MemoryGame
                  onGamePlay={() => handleGamePlay('memory')}
                  onGameWin={() => handleGameWin('memory')}
                />
              )}
              {activeGameId === 'fallingblocks' && (
                <FallingBlocksGame
                  onGamePlay={() => handleGamePlay('fallingblocks')}
                  onGameWin={() => handleGameWin('fallingblocks')}
                />
              )}
            </div>
          </div>
        ) : (
          /* ARCADE INDEX / CATALOG VIEW */
          <div className="flex flex-col gap-12">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-md">
              {/* Background decorative circles */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative max-w-2xl">
                <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Browser-Based 2D Arcade for Kids</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                  Delightful 2D Games to Play, Think, and Smile.
                </h1>

                <p className="text-base sm:text-lg text-blue-100 font-normal leading-relaxed mb-6">
                  Powered by <strong>PixiJS v8</strong> graphics and 2D physics. Match vibrant shapes into shadows, pop spoken number balloons, dash with color-mixing chameleons, draw bouncy trampolines, and tumble physics critters!
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => selectGame('shapematch')}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-xs active:scale-95"
                  >
                    <span>Play Shape Match</span>
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </button>
                  <button
                    onClick={() => selectGame('balloonpop')}
                    className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all shadow-xs active:scale-95"
                  >
                    <span>Balloon Number Pop</span>
                  </button>
                  <button
                    onClick={() => selectGame('colordash')}
                    className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all active:scale-95"
                  >
                    <span>Color Dash</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playTap(480);
                      setIsStickerModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all active:scale-95"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>Sticker Book ({unlockedStickerCount}/8)</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Game Catalog Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Featured 2D Games</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any game to begin instantly in your browser — zero downloads required.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ARCADE_GAMES.map((game) => (
                  <GameCard key={game.id} game={game} onSelect={selectGame} />
                ))}
              </div>
            </section>

            {/* Why Kids & Parents Love WonderPix Section */}
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <div className="text-center max-w-xl mx-auto mb-8">
                <h3 className="text-xl font-bold text-slate-900">Designed with Care for Young Minds</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gentle, wholesome gameplay focusing on spatial reasoning, social sharing, and playful physics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-3">
                    👥
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Local Pass-and-Play</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Play Tic Tac Toe side-by-side with siblings or parents on one device. No accounts, no lobby waits, just instant fun.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-3">
                    🧠
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Visual Recall & Logic</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memory Match helps develop focus, working memory, and pattern association across 3 themes and difficulty tiers.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mb-3">
                    ✨
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Realistic 2D Physics</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Matter.js physics powers bouncy, tumbling critters with googly eyes that react dynamically to gravity and impacts.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">WonderPix Arcade</span>
            <span aria-hidden="true">·</span>
            <span>Interactive 2D Games for Kids</span>
            <span aria-hidden="true">·</span>
            <span>Built with PixiJS & React</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                sound.playTap(500);
                setIsStickerModalOpen(true);
              }}
              className="hover:text-slate-800 font-medium transition-colors"
            >
              Stickers ({unlockedStickerCount}/8)
            </button>
            <span aria-hidden="true">·</span>
            <span>Local Single Window Play</span>
          </div>
        </div>
      </footer>

      {/* Collectible Sticker Book Modal */}
      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        stickers={stickers}
      />
    </div>
  );
}
