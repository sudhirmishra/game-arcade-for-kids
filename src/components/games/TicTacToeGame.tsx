import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { sound } from '../../sound/soundEffects';
import { RotateCcw, Volume2, VolumeX, User, Users, Sparkles, Award } from 'lucide-react';

interface TicTacToeProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

type Player = 'X' | 'O';
type CellValue = Player | null;

interface ThemeOption {
  id: string;
  name: string;
  xLabel: string;
  oLabel: string;
  xEmoji: string;
  oEmoji: string;
  xColor: number;
  oColor: number;
}

const THEMES: ThemeOption[] = [
  {
    id: 'cosmic',
    name: 'Star & Rocket',
    xLabel: 'Star',
    oLabel: 'Rocket',
    xEmoji: '⭐',
    oEmoji: '🚀',
    xColor: 0xf59e0b, // Amber / Gold
    oColor: 0x3b82f6, // Blue
  },
  {
    id: 'pets',
    name: 'Puppy & Kitten',
    xLabel: 'Puppy',
    oLabel: 'Kitten',
    xEmoji: '🐶',
    oEmoji: '🐱',
    xColor: 0xf97316, // Orange
    oColor: 0xec4899, // Pink
  },
  {
    id: 'sweets',
    name: 'Donut & Cupcake',
    xLabel: 'Donut',
    oLabel: 'Cupcake',
    xEmoji: '🍩',
    oEmoji: '🧁',
    xColor: 0x8b5cf6, // Purple
    oColor: 0x10b981, // Emerald
  },
];

export const TicTacToeGame: React.FC<TicTacToeProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Game state
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'TIE' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isBotEnabled, setIsBotEnabled] = useState<boolean>(false);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(THEMES[0]);

  // Scoreboard
  const [scores, setScores] = useState<{ x: number; o: number; ties: number }>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_ttt_scores');
      return saved ? JSON.parse(saved) : { x: 0, o: 0, ties: 0 };
    } catch {
      return { x: 0, o: 0, ties: 0 };
    }
  });

  const checkWinner = (grid: CellValue[]): { winner: Player | 'TIE' | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return { winner: grid[a], line: [a, b, c] };
      }
    }

    if (grid.every((cell) => cell !== null)) {
      return { winner: 'TIE', line: null };
    }

    return { winner: null, line: null };
  };

  // Trigger move at cell index
  const makeMove = useCallback(
    (index: number) => {
      if (board[index] || winner || isBotThinking) return;

      onGamePlay?.();
      sound.playTap(currentPlayer === 'X' ? 580 : 440);

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result.winner) {
        setWinner(result.winner);
        setWinningLine(result.line);

        if (result.winner === 'TIE') {
          sound.playMismatch();
          setScores((prev) => {
            const next = { ...prev, ties: prev.ties + 1 };
            localStorage.setItem('wonderpix_ttt_scores', JSON.stringify(next));
            return next;
          });
        } else {
          sound.playWin();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
          onGameWin?.();
          setScores((prev) => {
            const next = {
              ...prev,
              [result.winner === 'X' ? 'x' : 'o']: prev[result.winner === 'X' ? 'x' : 'o'] + 1,
            };
            localStorage.setItem('wonderpix_ttt_scores', JSON.stringify(next));
            return next;
          });
        }
      } else {
        const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
        setCurrentPlayer(nextPlayer);

        // If Bot mode enabled and next player is O, schedule bot move
        if (isBotEnabled && nextPlayer === 'O') {
          setIsBotThinking(true);
          setTimeout(() => {
            // Find empty cells
            const emptyIndices = newBoard
              .map((val, idx) => (val === null ? idx : null))
              .filter((val): val is number => val !== null);

            if (emptyIndices.length > 0) {
              // Smart/friendly bot move: check if can win, then block player, else random
              let botChoice = emptyIndices[0];

              // Can bot win?
              for (const idx of emptyIndices) {
                const test = [...newBoard];
                test[idx] = 'O';
                if (checkWinner(test).winner === 'O') {
                  botChoice = idx;
                  break;
                }
              }

              // Can block player?
              if (botChoice === emptyIndices[0]) {
                for (const idx of emptyIndices) {
                  const test = [...newBoard];
                  test[idx] = 'X';
                  if (checkWinner(test).winner === 'X') {
                    botChoice = idx;
                    break;
                  }
                }
              }

              // Else choose center or random corner
              if (botChoice === emptyIndices[0] && emptyIndices.includes(4)) {
                botChoice = 4;
              } else if (botChoice === emptyIndices[0]) {
                botChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              }

              sound.playTap(440);
              const botBoard = [...newBoard];
              botBoard[botChoice] = 'O';
              setBoard(botBoard);
              setIsBotThinking(false);

              const botResult = checkWinner(botBoard);
              if (botResult.winner) {
                setWinner(botResult.winner);
                setWinningLine(botResult.line);
                if (botResult.winner === 'TIE') {
                  sound.playMismatch();
                  setScores((prev) => {
                    const next = { ...prev, ties: prev.ties + 1 };
                    localStorage.setItem('wonderpix_ttt_scores', JSON.stringify(next));
                    return next;
                  });
                } else {
                  sound.playWin();
                  setScores((prev) => {
                    const next = { ...prev, o: prev.o + 1 };
                    localStorage.setItem('wonderpix_ttt_scores', JSON.stringify(next));
                    return next;
                  });
                }
              } else {
                setCurrentPlayer('X');
              }
            } else {
              setIsBotThinking(false);
            }
          }, 600);
        }
      }
    },
    [board, currentPlayer, winner, isBotThinking, isBotEnabled, onGamePlay, onGameWin]
  );

  const resetGame = () => {
    sound.playTap(600);
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setIsBotThinking(false);
  };

  const clearScoreboard = () => {
    sound.playTap(400);
    const zero = { x: 0, o: 0, ties: 0 };
    setScores(zero);
    localStorage.setItem('wonderpix_ttt_scores', JSON.stringify(zero));
  };

  // PixiJS canvas initialization & rendering
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    const app = new Application();
    appRef.current = app;

    const boardSize = 480;
    const cellSize = (boardSize - 40) / 3; // 40px total padding & gaps

    app
      .init({
        width: boardSize,
        height: boardSize,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0xffffff,
        antialias: true,
      })
      .then(() => {
        if (destroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.removeChildren();

        // Background container
        const bg = new Graphics();
        bg.roundRect(0, 0, boardSize, boardSize, 28)
          .fill({ color: 0xf1f5f9 })
          .stroke({ width: 3, color: 0xe2e8f0 });
        stage.addChild(bg);

        // Cells container
        const gridContainer = new Container();
        gridContainer.x = 20;
        gridContainer.y = 20;
        stage.addChild(gridContainer);

        const gap = 10;
        const actualCellW = (boardSize - 40 - gap * 2) / 3;

        // Draw 9 cells
        for (let i = 0; i < 9; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const cellX = col * (actualCellW + gap);
          const cellY = row * (actualCellW + gap);

          const cellContainer = new Container();
          cellContainer.x = cellX;
          cellContainer.y = cellY;
          cellContainer.eventMode = 'static';
          cellContainer.cursor = board[i] === null && !winner ? 'pointer' : 'default';

          const cellBg = new Graphics();
          const isWinningCell = winningLine?.includes(i);

          if (isWinningCell) {
            cellBg
              .roundRect(0, 0, actualCellW, actualCellW, 18)
              .fill({ color: 0xfef08a }) // Soft celebratory yellow
              .stroke({ width: 4, color: 0xeab308 });
          } else {
            cellBg
              .roundRect(0, 0, actualCellW, actualCellW, 18)
              .fill({ color: 0xffffff })
              .stroke({ width: 2, color: 0xe2e8f0 });
          }

          cellContainer.addChild(cellBg);

          // Cell hover effect
          cellContainer.on('pointerover', () => {
            if (board[i] === null && !winner) {
              cellBg.clear();
              cellBg
                .roundRect(0, 0, actualCellW, actualCellW, 18)
                .fill({ color: 0xf8fafc })
                .stroke({ width: 3, color: 0x94a3b8 });
            }
          });

          cellContainer.on('pointerout', () => {
            if (!winningLine?.includes(i)) {
              cellBg.clear();
              cellBg
                .roundRect(0, 0, actualCellW, actualCellW, 18)
                .fill({ color: 0xffffff })
                .stroke({ width: 2, color: 0xe2e8f0 });
            }
          });

          cellContainer.on('pointerdown', () => {
            makeMove(i);
          });

          // Draw piece if occupied
          const val = board[i];
          if (val) {
            const pieceContainer = new Container();
            pieceContainer.x = actualCellW / 2;
            pieceContainer.y = actualCellW / 2;

            const emoji = val === 'X' ? currentTheme.xEmoji : currentTheme.oEmoji;
            const textStyle = new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: actualCellW * 0.46,
              align: 'center',
            });
            const text = new Text({ text: emoji, style: textStyle });
            text.anchor.set(0.5);
            pieceContainer.addChild(text);

            // Subtle bounce glow ring
            const ring = new Graphics();
            ring
              .circle(0, 0, actualCellW * 0.38)
              .stroke({ width: 3, color: val === 'X' ? currentTheme.xColor : currentTheme.oColor, alpha: 0.25 });
            pieceContainer.addChild(ring);

            cellContainer.addChild(pieceContainer);
          }

          gridContainer.addChild(cellContainer);
        }

        // Draw winning line if game over
        if (winningLine && winningLine.length === 3) {
          const lineGraphic = new Graphics();
          const startCol = winningLine[0] % 3;
          const startRow = Math.floor(winningLine[0] / 3);
          const endCol = winningLine[2] % 3;
          const endRow = Math.floor(winningLine[2] / 3);

          const x1 = startCol * (actualCellW + gap) + actualCellW / 2;
          const y1 = startRow * (actualCellW + gap) + actualCellW / 2;
          const x2 = endCol * (actualCellW + gap) + actualCellW / 2;
          const y2 = endRow * (actualCellW + gap) + actualCellW / 2;

          lineGraphic
            .moveTo(x1, y1)
            .lineTo(x2, y2)
            .stroke({ width: 8, color: 0xeab308, alpha: 0.85, cap: 'round' });

          gridContainer.addChild(lineGraphic);
        }
      });

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [board, winningLine, winner, currentTheme, makeMove]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Controls & Status Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTap();
              setIsBotEnabled(false);
              resetGame();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              !isBotEnabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2 Players (Same Screen)</span>
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setIsBotEnabled(true);
              resetGame();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              isBotEnabled ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Practice vs Friendly Bot</span>
          </button>
        </div>

        {/* Theme Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Pieces:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  sound.playTap();
                  setCurrentTheme(theme);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentTheme.id === theme.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {theme.xEmoji} {theme.oEmoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Playing Arena Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Player 1 Card */}
        <div
          className={`md:col-span-3 p-5 rounded-2xl border transition-all text-center ${
            currentPlayer === 'X' && !winner
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40 shadow-sm'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-4xl mb-2">{currentTheme.xEmoji}</div>
          <h3 className="font-bold text-slate-900">Player 1</h3>
          <p className="text-xs text-slate-500 mb-3">{currentTheme.xLabel}</p>
          <div className="bg-slate-50 rounded-xl py-2 px-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Wins</span>
            <span className="text-2xl font-bold font-mono text-slate-800 tabular-nums">{scores.x}</span>
          </div>
          {currentPlayer === 'X' && !winner && (
            <div className="mt-3 text-xs font-semibold text-amber-700 bg-amber-100/70 py-1 px-2 rounded-lg inline-block animate-pulse">
              Your Turn!
            </div>
          )}
        </div>

        {/* Center: PixiJS Canvas & Prompt */}
        <div className="md:col-span-6 flex flex-col items-center">
          {/* Status Message */}
          <div className="text-center mb-4 min-h-[48px] flex flex-col items-center justify-center">
            {winner === 'TIE' ? (
              <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
                <span>🤝 It's a Friendly Tie!</span>
              </div>
            ) : winner ? (
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xl animate-bounce">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>
                  {winner === 'X' ? 'Player 1' : isBotEnabled ? 'Friendly Bot' : 'Player 2'} Wins the Round!
                </span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
            ) : isBotThinking ? (
              <div className="text-slate-600 font-medium flex items-center gap-2">
                <span className="inline-block animate-spin">🤖</span>
                <span>Bot is thinking...</span>
              </div>
            ) : (
              <div className="text-slate-700 font-medium">
                {isBotEnabled ? (
                  <span>Your Turn! Tap any empty square</span>
                ) : (
                  <span>
                    {currentPlayer === 'X' ? 'Player 1' : 'Player 2'} ({currentPlayer === 'X' ? currentTheme.xEmoji : currentTheme.oEmoji}), tap a square!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pixi Canvas Mounting Point */}
          <div
            ref={containerRef}
            className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] flex items-center justify-center shadow-md rounded-3xl overflow-hidden bg-slate-100"
            style={{ touchAction: 'none' }}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{winner ? 'Play Again' : 'Restart Board'}</span>
            </button>
            <button
              onClick={clearScoreboard}
              className="text-xs text-slate-400 hover:text-slate-600 underline py-2"
            >
              Reset Scores
            </button>
          </div>
        </div>

        {/* Right Side: Player 2 / Bot Card */}
        <div
          className={`md:col-span-3 p-5 rounded-2xl border transition-all text-center ${
            currentPlayer === 'O' && !winner
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/40 shadow-sm'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-4xl mb-2">{isBotEnabled ? '🤖' : currentTheme.oEmoji}</div>
          <h3 className="font-bold text-slate-900">{isBotEnabled ? 'Friendly Bot' : 'Player 2'}</h3>
          <p className="text-xs text-slate-500 mb-3">{isBotEnabled ? 'Practice Partner' : currentTheme.oLabel}</p>
          <div className="bg-slate-50 rounded-xl py-2 px-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Wins</span>
            <span className="text-2xl font-bold font-mono text-slate-800 tabular-nums">{scores.o}</span>
          </div>
          {currentPlayer === 'O' && !winner && (
            <div className="mt-3 text-xs font-semibold text-blue-700 bg-blue-100/70 py-1 px-2 rounded-lg inline-block animate-pulse">
              {isBotEnabled ? 'Thinking...' : 'Your Turn!'}
            </div>
          )}
        </div>
      </div>

      {/* Helpful Pass-and-Play Guidance Note */}
      <div className="mt-8 text-center text-xs text-slate-500 max-w-md">
        💡 <strong>Multiplayer Tip:</strong> Place your device on a table or between you and your friend. Take turns tapping squares!
      </div>
    </div>
  );
};
