import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { sound } from '../../sound/soundEffects';
import { RotateCcw, Lightbulb, Trophy, Sparkles, Clock, Eye } from 'lucide-react';

interface MemoryGameProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

interface CardItem {
  id: number;
  pairId: number;
  label: string;
  emoji: string;
  color: number;
  isFlipped: boolean;
  isMatched: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const THEMES = [
  {
    id: 'animals',
    name: 'Zoo Pals',
    items: [
      { emoji: '🦁', label: 'Lion', color: 0xf59e0b },
      { emoji: '🐼', label: 'Panda', color: 0x10b981 },
      { emoji: '🦊', label: 'Fox', color: 0xf97316 },
      { emoji: '🐧', label: 'Penguin', color: 0x0ea5e9 },
      { emoji: '🐘', label: 'Elephant', color: 0x6366f1 },
      { emoji: '🐵', label: 'Monkey', color: 0x84cc16 },
      { emoji: '🐨', label: 'Koala', color: 0x14b8a6 },
      { emoji: '🐰', label: 'Bunny', color: 0xec4899 },
      { emoji: '🐸', label: 'Frog', color: 0x22c55e },
      { emoji: '🦉', label: 'Owl', color: 0xa855f7 },
    ],
  },
  {
    id: 'sweets',
    name: 'Sweet Treats',
    items: [
      { emoji: '🍦', label: 'Ice Cream', color: 0xec4899 },
      { emoji: '🍩', label: 'Donut', color: 0x8b5cf6 },
      { emoji: '🧁', label: 'Cupcake', color: 0x3b82f6 },
      { emoji: '🍪', label: 'Cookie', color: 0xd97706 },
      { emoji: '🍉', label: 'Watermelon', color: 0x10b981 },
      { emoji: '🍓', label: 'Strawberry', color: 0xef4444 },
      { emoji: '🍭', label: 'Lollipop', color: 0x06b6d4 },
      { emoji: '🍒', label: 'Cherries', color: 0xe11d48 },
      { emoji: '🥞', label: 'Pancakes', color: 0xf59e0b },
      { emoji: '🍿', label: 'Popcorn', color: 0xeab308 },
    ],
  },
  {
    id: 'space',
    name: 'Cosmic Quest',
    items: [
      { emoji: '🚀', label: 'Rocket', color: 0x3b82f6 },
      { emoji: '🪐', label: 'Saturn', color: 0xf59e0b },
      { emoji: '👽', label: 'Alien', color: 0x10b981 },
      { emoji: '⭐', label: 'Star', color: 0xeab308 },
      { emoji: '🛸', label: 'UFO', color: 0x8b5cf6 },
      { emoji: '🌕', label: 'Moon', color: 0x64748b },
      { emoji: '☄️', label: 'Comet', color: 0x06b6d4 },
      { emoji: '🌍', label: 'Earth', color: 0x0284c7 },
      { emoji: '👨‍🚀', label: 'Astronaut', color: 0xec4899 },
      { emoji: '☀️', label: 'Sun', color: 0xf97316 },
    ],
  },
];

export const MemoryGame: React.FC<MemoryGameProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matchedPairsCount, setMatchedPairsCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [hintsRemaining, setHintsRemaining] = useState<number>(2);

  // Best score storage
  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_memory_bests');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Calculate pairs needed based on difficulty
  const getPairCount = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return 6; // 12 cards (3 cols x 4 rows or 4x3)
      case 'medium':
        return 8; // 16 cards (4x4)
      case 'hard':
        return 10; // 20 cards (4x5)
    }
  };

  // Setup cards
  const initializeBoard = useCallback(() => {
    const pairCount = getPairCount(difficulty);
    const theme = THEMES[selectedThemeIndex];
    const pickedItems = theme.items.slice(0, pairCount);

    const deck: CardItem[] = [];
    pickedItems.forEach((item, pairIdx) => {
      deck.push({
        id: pairIdx * 2,
        pairId: pairIdx,
        label: item.label,
        emoji: item.emoji,
        color: item.color,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: pairIdx * 2 + 1,
        pairId: pairIdx,
        label: item.label,
        emoji: item.emoji,
        color: item.color,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairsCount(0);
    setTimerSeconds(0);
    setIsWon(false);
    setIsLocked(false);
    setIsGameActive(false);
    setHintsRemaining(2);
  }, [difficulty, selectedThemeIndex]);

  // Initial load
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Timer tick
  useEffect(() => {
    if (!isGameActive || isWon) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameActive, isWon]);

  // Handle Card Click
  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isMatched || card.isFlipped) return;

    // Start timer on first move
    if (!isGameActive) {
      setIsGameActive(true);
      onGamePlay?.();
    }

    sound.playFlip();

    const newCards = [...cards];
    newCards[index] = { ...card, isFlipped: true };
    setCards(newCards);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        setTimeout(() => {
          sound.playMatch();
          setCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c))
          );
          setFlippedIndices([]);

          const nextMatched = matchedPairsCount + 1;
          setMatchedPairsCount(nextMatched);

          const totalPairs = getPairCount(difficulty);
          if (nextMatched === totalPairs) {
            // VICTORY!
            setIsWon(true);
            sound.playWin();
            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.6 },
            });
            onGameWin?.();

            // Record best score
            const key = `${difficulty}_moves`;
            const currentBest = bestScores[key] || 999;
            const finalMoves = moves + 1;
            if (finalMoves < currentBest) {
              const updated = { ...bestScores, [key]: finalMoves };
              setBestScores(updated);
              localStorage.setItem('wonderpix_memory_bests', JSON.stringify(updated));
            }
          }
        }, 300);
      } else {
        // MISMATCH
        setIsLocked(true);
        setTimeout(() => {
          sound.playMismatch();
          setCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c))
          );
          setFlippedIndices([]);
          setIsLocked(false);
        }, 850);
      }
    }
  };

  // Hint feature: peek 1 unmatched pair briefly
  const useHint = () => {
    if (hintsRemaining <= 0 || isLocked || isWon) return;

    sound.playTap(700);
    setHintsRemaining((prev) => prev - 1);

    // Find first unmatched pair
    const unmatched = cards.filter((c) => !c.isMatched);
    if (unmatched.length < 2) return;

    const targetPairId = unmatched[0].pairId;
    const targetIndices = cards
      .map((c, idx) => (c.pairId === targetPairId && !c.isMatched ? idx : null))
      .filter((idx): idx is number => idx !== null);

    // Temporarily flip them
    setCards((prev) =>
      prev.map((c, idx) => (targetIndices.includes(idx) ? { ...c, isFlipped: true } : c))
    );

    setIsLocked(true);
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c, idx) => (targetIndices.includes(idx) ? { ...c, isFlipped: false } : c))
      );
      setIsLocked(false);
    }, 1200);
  };

  // PixiJS Canvas Rendering
  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;

    let destroyed = false;
    const app = new Application();
    appRef.current = app;

    const totalCards = cards.length;
    let cols = 4;
    let rows = 4;
    if (totalCards === 12) {
      cols = 4;
      rows = 3;
    } else if (totalCards === 20) {
      cols = 5;
      rows = 4;
    }

    const cardWidth = 86;
    const cardHeight = 98;
    const gap = 12;
    const boardPadding = 18;

    const totalWidth = cols * cardWidth + (cols - 1) * gap + boardPadding * 2;
    const totalHeight = rows * cardHeight + (rows - 1) * gap + boardPadding * 2;

    app
      .init({
        width: totalWidth,
        height: totalHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0xf8fafc,
        antialias: true,
      })
      .then(() => {
        if (destroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.removeChildren();

        // Background container rounded board
        const bg = new Graphics();
        bg.roundRect(0, 0, totalWidth, totalHeight, 24)
          .fill({ color: 0xffffff })
          .stroke({ width: 2, color: 0xe2e8f0 });
        stage.addChild(bg);

        // Render card nodes
        cards.forEach((card, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);

          const cardX = boardPadding + col * (cardWidth + gap);
          const cardY = boardPadding + row * (cardHeight + gap);

          const cardContainer = new Container();
          cardContainer.x = cardX;
          cardContainer.y = cardY;
          cardContainer.eventMode = 'static';
          cardContainer.cursor = !card.isMatched && !card.isFlipped && !isLocked ? 'pointer' : 'default';

          // Outer card shape
          const cardGraphic = new Graphics();

          if (card.isMatched) {
            // Matched State: Soft cheerful tinted card with gold outline
            cardGraphic
              .roundRect(0, 0, cardWidth, cardHeight, 16)
              .fill({ color: 0xf0fdf4 }) // soft emerald
              .stroke({ width: 3, color: 0x86efac });

            cardContainer.addChild(cardGraphic);

            // Emoji
            const emojiStyle = new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 38,
              align: 'center',
            });
            const emojiText = new Text({ text: card.emoji, style: emojiStyle });
            emojiText.anchor.set(0.5);
            emojiText.x = cardWidth / 2;
            emojiText.y = cardHeight / 2 - 8;
            cardContainer.addChild(emojiText);

            // Label text
            const labelStyle = new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              fontWeight: 'bold',
              fill: 0x15803d,
              align: 'center',
            });
            const labelText = new Text({ text: card.label, style: labelStyle });
            labelText.anchor.set(0.5);
            labelText.x = cardWidth / 2;
            labelText.y = cardHeight - 16;
            cardContainer.addChild(labelText);

            // Checkmark badge in corner
            const checkBg = new Graphics();
            checkBg.circle(cardWidth - 14, 14, 8).fill({ color: 0x22c55e });
            cardContainer.addChild(checkBg);
          } else if (card.isFlipped) {
            // Flipped Face Up: Active revealed card
            cardGraphic
              .roundRect(0, 0, cardWidth, cardHeight, 16)
              .fill({ color: 0xffffff })
              .stroke({ width: 3, color: card.color });

            cardContainer.addChild(cardGraphic);

            // Emoji
            const emojiStyle = new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 40,
              align: 'center',
            });
            const emojiText = new Text({ text: card.emoji, style: emojiStyle });
            emojiText.anchor.set(0.5);
            emojiText.x = cardWidth / 2;
            emojiText.y = cardHeight / 2 - 8;
            cardContainer.addChild(emojiText);

            // Label
            const labelStyle = new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 11,
              fontWeight: '600',
              fill: 0x334155,
              align: 'center',
            });
            const labelText = new Text({ text: card.label, style: labelStyle });
            labelText.anchor.set(0.5);
            labelText.x = cardWidth / 2;
            labelText.y = cardHeight - 16;
            cardContainer.addChild(labelText);
          } else {
            // Face Down Card: Playful patterned card back
            cardGraphic
              .roundRect(0, 0, cardWidth, cardHeight, 16)
              .fill({ color: 0x3b82f6 }) // energetic blue
              .stroke({ width: 2, color: 0x2563eb });

            // Inner card border pattern
            const innerBorder = new Graphics();
            innerBorder
              .roundRect(5, 5, cardWidth - 10, cardHeight - 10, 12)
              .stroke({ width: 1.5, color: 0x93c5fd, alpha: 0.6 });

            cardContainer.addChild(cardGraphic);
            cardContainer.addChild(innerBorder);

            // Center playful symbol (Sparkle star)
            const starText = new Text({
              text: '✨',
              style: new TextStyle({ fontSize: 24, align: 'center' }),
            });
            starText.anchor.set(0.5);
            starText.x = cardWidth / 2;
            starText.y = cardHeight / 2;
            cardContainer.addChild(starText);

            // Hover micro-scale feedback
            cardContainer.on('pointerover', () => {
              if (!isLocked) {
                cardGraphic.clear();
                cardGraphic
                  .roundRect(0, 0, cardWidth, cardHeight, 16)
                  .fill({ color: 0x2563eb })
                  .stroke({ width: 2.5, color: 0x60a5fa });
              }
            });

            cardContainer.on('pointerout', () => {
              cardGraphic.clear();
              cardGraphic
                .roundRect(0, 0, cardWidth, cardHeight, 16)
                .fill({ color: 0x3b82f6 })
                .stroke({ width: 2, color: 0x2563eb });
            });
          }

          cardContainer.on('pointerdown', () => {
            handleCardClick(idx);
          });

          stage.addChild(cardContainer);
        });
      });

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [cards, isLocked]);

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalPairs = getPairCount(difficulty);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Top Configuration & Control Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Difficulty Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  sound.playTap();
                  setDifficulty(d);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  difficulty === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d === 'easy' ? 'Easy (12)' : d === 'medium' ? 'Classic (16)' : 'Master (20)'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Theme:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {THEMES.map((th, idx) => (
              <button
                key={th.id}
                onClick={() => {
                  sound.playTap();
                  setSelectedThemeIndex(idx);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedThemeIndex === idx ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {th.items[0].emoji} {th.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hint & Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={useHint}
            disabled={hintsRemaining <= 0 || isWon || isLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              hintsRemaining > 0 && !isWon
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Peek Hint ({hintsRemaining})</span>
          </button>
          <button
            onClick={initializeBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Real-Time Status HUD */}
      <div className="w-full grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pairs Matched</span>
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {matchedPairsCount} / {totalPairs}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Turns Taken</span>
          </div>
          <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">{moves}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Time</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-800 tabular-nums">{formatTime(timerSeconds)}</span>
        </div>
      </div>

      {/* PixiJS Game Arena */}
      <div className="flex flex-col items-center">
        {isWon && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center max-w-md animate-bounce">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-lg mb-1">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <span>Splendid Memory! You Found All Pairs!</span>
            </div>
            <p className="text-xs text-emerald-700">
              Completed in {moves} moves and {formatTime(timerSeconds)}.
            </p>
          </div>
        )}

        <div
          ref={containerRef}
          className="flex items-center justify-center shadow-md rounded-3xl overflow-hidden bg-slate-50 border border-slate-200"
        />

        {isWon && (
          <div className="mt-6">
            <button
              onClick={initializeBoard}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Another Round</span>
            </button>
          </div>
        )}
      </div>

      {/* Helpful Kid Tip */}
      <div className="mt-6 text-center text-xs text-slate-400">
        💡 <strong>Memory Tip:</strong> Remember where cards are hiding even when they flip back over!
      </div>
    </div>
  );
};
