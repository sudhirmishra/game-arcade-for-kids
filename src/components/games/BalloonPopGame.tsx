import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { sound } from '../../sound/soundEffects';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Flame,
  Award,
  Play,
  Lightbulb,
} from 'lucide-react';

interface BalloonPopProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

interface BalloonItem {
  id: number;
  container: Container;
  bodyGfx: Graphics;
  numberText: Text;
  x: number;
  y: number;
  baseX: number;
  speed: number;
  swaySpeed: number;
  swayOffset: number;
  number: number;
  color: number;
  isWobbling: boolean;
  wobbleTimer: number;
  isPopping: boolean;
  active: boolean;
}

interface PopParticle {
  container: Container;
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  active: boolean;
}

// 8 Vibrant Kid-Friendly Balloon Colors
const BALLOON_COLORS = [
  0xff4757, // Crimson Coral
  0x2ed573, // Lime Emerald
  0x1e90ff, // Azure Blue
  0xffa502, // Sunny Amber
  0x9b59b6, // Purple Orchid
  0xff6b81, // Bubblegum Pink
  0x00d2d3, // Cyan Turquoise
  0xff7f50, // Coral Peach
];

const DIFFICULTY_MODES = [
  { id: 'easy', label: '1 - 10 (Easy)', min: 1, max: 10 },
  { id: 'medium', label: '1 - 20 (Medium)', min: 1, max: 20 },
  { id: 'challenge', label: '10 - 50 (Tens)', min: 10, max: 50 },
];

export const BalloonPopGame: React.FC<BalloonPopProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Difficulty & Target states
  const [difficultyIdx, setDifficultyIdx] = useState<number>(0);
  const [targetNumber, setTargetNumber] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_balloon_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [balloonsPopped, setBalloonsPopped] = useState<number>(0);
  const [voiceSupported, setVoiceSupported] = useState<boolean>(true);
  const [recentCallout, setRecentCallout] = useState<string>('Pop number 3!');

  const currentMode = DIFFICULTY_MODES[difficultyIdx];

  // Speech Synthesis Prompt Helper
  const speakTarget = useCallback(
    (num: number, prefix = 'Pop the number') => {
      const phrase = `${prefix} ${num}!`;
      setRecentCallout(phrase);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(phrase);
          utter.rate = 0.92; // Slightly slower, very clear for children
          utter.pitch = 1.25; // Joyful cheerful pitch
          utter.lang = 'en-US';
          window.speechSynthesis.speak(utter);
        } catch {
          // ignore speech synthesis errors
        }
      }
    },
    []
  );

  // References for live game simulation loop
  const balloonsRef = useRef<BalloonItem[]>([]);
  const particlesRef = useRef<PopParticle[]>([]);
  const targetNumberRef = useRef<number>(3);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(1);
  const poppedCountRef = useRef<number>(0);
  const difficultyRef = useRef(currentMode);

  useEffect(() => {
    targetNumberRef.current = targetNumber;
  }, [targetNumber]);

  useEffect(() => {
    difficultyRef.current = currentMode;
  }, [currentMode]);

  // Generate a new random target number within current mode bounds
  const pickNewTarget = useCallback(() => {
    const min = difficultyRef.current.min;
    const max = difficultyRef.current.max;
    let next = min + Math.floor(Math.random() * (max - min + 1));
    // Avoid exact duplicate if possible
    if (next === targetNumberRef.current && max > min) {
      next = next === max ? min : next + 1;
    }
    targetNumberRef.current = next;
    setTargetNumber(next);
    speakTarget(next);

    // Ensure at least one on-screen balloon has the target number
    const activeBalloons = balloonsRef.current.filter((b) => b.active);
    const hasTarget = activeBalloons.some((b) => b.number === next);
    if (!hasTarget && activeBalloons.length > 0) {
      // Repurpose one balloon to show the target
      const targetB = activeBalloons[Math.floor(Math.random() * activeBalloons.length)];
      targetB.number = next;
      targetB.numberText.text = String(next);
    }
  }, [speakTarget]);

  // Reset Game
  const resetGame = () => {
    sound.playTap(480);
    scoreRef.current = 0;
    setScore(0);
    comboRef.current = 1;
    setCombo(1);
    poppedCountRef.current = 0;
    setBalloonsPopped(0);

    // Reset balloons to bottom
    balloonsRef.current.forEach((b, i) => {
      b.active = true;
      b.isPopping = false;
      b.isWobbling = false;
      b.container.visible = true;
      b.container.scale.set(1.0);
      b.container.rotation = 0;
      b.y = 560 + i * 90;
      b.container.y = b.y;
    });

    pickNewTarget();
  };

  // Switch difficulty
  const changeDifficulty = (idx: number) => {
    sound.playTap(550);
    setDifficultyIdx(idx);
    difficultyRef.current = DIFFICULTY_MODES[idx];
    resetGame();
  };

  // Main PixiJS v8 Game Loop & Canvas Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    const stageWidth = 800;
    const stageHeight = 540;

    const app = new Application();
    appRef.current = app;

    app
      .init({
        width: stageWidth,
        height: stageHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0x0f2b48, // Deep sky blue
        antialias: true,
      })
      .then(() => {
        if (isDestroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.eventMode = 'static';
        stage.hitArea = app.screen;

        // 1. Sky & Fluffy Cloud Background
        const skyGfx = new Graphics();
        // Sky gradient simulation with stacked transparent bands
        skyGfx
          .rect(0, 0, stageWidth, stageHeight)
          .fill({ color: 0x1a4b75 });
        skyGfx
          .rect(0, stageHeight * 0.4, stageWidth, stageHeight * 0.6)
          .fill({ color: 0x3882b8, alpha: 0.4 });
        skyGfx
          .rect(0, stageHeight * 0.7, stageWidth, stageHeight * 0.3)
          .fill({ color: 0x70b4e0, alpha: 0.35 });

        // Decorative background clouds
        const drawCloud = (x: number, y: number, scale = 1) => {
          skyGfx
            .circle(x, y, 32 * scale).fill({ color: 0xffffff, alpha: 0.22 })
            .circle(x + 36 * scale, y - 8 * scale, 42 * scale).fill({ color: 0xffffff, alpha: 0.25 })
            .circle(x + 80 * scale, y, 36 * scale).fill({ color: 0xffffff, alpha: 0.22 })
            .roundRect(x - 20 * scale, y + 6 * scale, 120 * scale, 24 * scale, 12 * scale)
            .fill({ color: 0xffffff, alpha: 0.24 });
        };

        drawCloud(80, 100, 1.2);
        drawCloud(480, 160, 0.9);
        drawCloud(320, 360, 1.1);
        drawCloud(680, 420, 0.8);

        stage.addChild(skyGfx);

        // 2. Balloons Container
        const balloonsContainer = new Container();
        stage.addChild(balloonsContainer);

        // 3. Pop Particles Pool
        const particlesContainer = new Container();
        stage.addChild(particlesContainer);

        particlesRef.current = [];
        for (let i = 0; i < 60; i++) {
          const pG = new Graphics();
          pG.circle(0, 0, 5).fill({ color: 0xffffff });
          const pCont = new Container();
          pCont.addChild(pG);
          pCont.visible = false;
          particlesContainer.addChild(pCont);

          particlesRef.current.push({
            container: pCont,
            gfx: pG,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            alpha: 1,
            active: false,
          });
        }

        // Particle explosion trigger
        const spawnBalloonParticles = (x: number, y: number, color: number) => {
          let count = 0;
          particlesRef.current.forEach((p) => {
            if (!p.active && count < 18) {
              p.active = true;
              p.x = x;
              p.y = y;
              const angle = Math.random() * Math.PI * 2;
              const spd = 3 + Math.random() * 6;
              p.vx = Math.cos(angle) * spd;
              p.vy = Math.sin(angle) * spd;
              p.alpha = 1.0;
              p.gfx.tint = color;
              p.container.visible = true;
              count++;
            }
          });
        };

        // 4. Create 7 Floating Balloons
        balloonsRef.current = [];
        const numBalloons = 7;

        for (let i = 0; i < numBalloons; i++) {
          const bCont = new Container();
          bCont.eventMode = 'static';
          bCont.cursor = 'pointer';

          const color = BALLOON_COLORS[i % BALLOON_COLORS.length];

          // Balloon Graphics (Glossy Body, Knot, and String)
          const bGfx = new Graphics();
          // Oval balloon body
          bGfx
            .ellipse(0, 0, 40, 50)
            .fill({ color: 0xffffff })
            .stroke({ width: 2.5, color: 0xffffff });
          // Specular light shine on top left
          bGfx
            .ellipse(-14, -18, 12, 16)
            .fill({ color: 0xffffff, alpha: 0.38 });
          // Bottom knot
          bGfx
            .poly([-6, 50, 6, 50, 0, 57])
            .fill({ color: 0xffffff });
          // Waving string
          bGfx
            .moveTo(0, 57)
            .bezierCurveTo(-8, 75, 8, 90, 0, 110)
            .stroke({ width: 2, color: 0xe2e8f0, alpha: 0.8 });

          bGfx.tint = color;

          // Number Text Label
          const numStyle = new TextStyle({
            fontFamily: 'Outfit, sans-serif',
            fontSize: 28,
            fontWeight: '900',
            fill: 0xffffff,
            dropShadow: {
              alpha: 0.45,
              blur: 3,
              distance: 2,
              color: 0x000000,
            },
          });

          const initialNum = i + 1;
          const numTxt = new Text({ text: String(initialNum), style: numStyle });
          numTxt.anchor.set(0.5);
          numTxt.y = 0;

          bCont.addChild(bGfx);
          bCont.addChild(numTxt);

          const spawnX = 90 + i * 95 + (Math.random() - 0.5) * 30;
          const spawnY = 560 + i * 70;

          bCont.x = spawnX;
          bCont.y = spawnY;

          const balloonItem: BalloonItem = {
            id: i,
            container: bCont,
            bodyGfx: bGfx,
            numberText: numTxt,
            x: spawnX,
            y: spawnY,
            baseX: spawnX,
            speed: 1.2 + Math.random() * 0.8,
            swaySpeed: 0.015 + Math.random() * 0.015,
            swayOffset: Math.random() * Math.PI * 2,
            number: initialNum,
            color,
            isWobbling: false,
            wobbleTimer: 0,
            isPopping: false,
            active: true,
          };

          // Tap / Click Interaction Handlers
          bCont.on('pointerdown', () => {
            if (!balloonItem.active || balloonItem.isPopping) return;
            onGamePlay?.();

            const isTarget = balloonItem.number === targetNumberRef.current;

            if (isTarget) {
              // ---------------------------------------------------------
              // CORRECT TARGET POPPED!
              // ---------------------------------------------------------
              balloonItem.isPopping = true;
              sound.playBubblePop();
              sound.playStarCollect(comboRef.current);

              // Burst particle explosion
              spawnBalloonParticles(bCont.x, bCont.y, balloonItem.color);

              // Scale pop animation
              let popScale = 1.0;
              const popAnim = (ticker: { deltaTime: number }) => {
                popScale += 0.25 * ticker.deltaTime;
                bCont.scale.set(popScale);
                bCont.alpha = Math.max(0, 1.8 - popScale);

                if (popScale >= 2.0) {
                  app.ticker.remove(popAnim);
                  bCont.visible = false;
                  balloonItem.active = false;
                  // Recycle balloon after brief delay
                  setTimeout(() => {
                    recycleBalloon(balloonItem);
                  }, 600);
                }
              };
              app.ticker.add(popAnim);

              // Update Score & Combos
              comboRef.current = Math.min(8, comboRef.current + 1);
              setCombo(comboRef.current);
              const pointsEarned = 100 * comboRef.current;
              scoreRef.current += pointsEarned;
              setScore(scoreRef.current);

              poppedCountRef.current += 1;
              setBalloonsPopped(poppedCountRef.current);

              if (scoreRef.current > highScore) {
                setHighScore(scoreRef.current);
                localStorage.setItem('wonderpix_balloon_highscore', String(scoreRef.current));
              }

              // Win achievement threshold
              if (poppedCountRef.current === 8) {
                onGameWin?.();
                confetti({
                  particleCount: 60,
                  spread: 60,
                  origin: { y: 0.6 },
                });
              }

              // Pick next number and speak instruction
              setTimeout(() => {
                pickNewTarget();
              }, 400);
            } else {
              // ---------------------------------------------------------
              // INCORRECT DISTRACTOR TAPPED: Wobble Shake
              // ---------------------------------------------------------
              sound.playBoing(0.8);
              balloonItem.isWobbling = true;
              balloonItem.wobbleTimer = 22; // ~0.35s
              comboRef.current = 1;
              setCombo(1);

              // Helpful vocal prompt reminder
              setRecentCallout(`That is ${balloonItem.number}! Find ${targetNumberRef.current}!`);
            }
          });

          balloonsContainer.addChild(bCont);
          balloonsRef.current.push(balloonItem);
        }

        // Helper to recycle a balloon back to the bottom with a randomized number
        const recycleBalloon = (b: BalloonItem) => {
          b.isPopping = false;
          b.isWobbling = false;
          b.container.visible = true;
          b.container.scale.set(1.0);
          b.container.rotation = 0;
          b.container.alpha = 1.0;
          b.active = true;

          const min = difficultyRef.current.min;
          const max = difficultyRef.current.max;

          // Occasionally ensure the target is respawned
          const currentTarget = targetNumberRef.current;
          const existingTargets = balloonsRef.current.filter((it) => it.active && it.number === currentTarget);
          if (existingTargets.length === 0 && Math.random() < 0.65) {
            b.number = currentTarget;
          } else {
            b.number = min + Math.floor(Math.random() * (max - min + 1));
          }

          b.numberText.text = String(b.number);

          // Randomize color and speed
          b.color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
          b.bodyGfx.tint = b.color;
          b.speed = 1.2 + Math.random() * 0.9;
          b.baseX = 80 + Math.random() * (stageWidth - 160);
          b.y = stageHeight + 80 + Math.random() * 80;
        };

        // 5. Main Simulation Ticker Update Loop
        app.ticker.add((ticker) => {
          const dt = Math.min(ticker.deltaTime, 2.0);

          // Update Balloons
          balloonsRef.current.forEach((b) => {
            if (!b.active || b.isPopping) return;

            // Float upward
            b.y -= b.speed * dt;
            b.container.y = b.y;

            // Gentle horizontal swaying
            const sway = Math.sin(Date.now() * b.swaySpeed * 0.1 + b.swayOffset) * 18;
            b.container.x = b.baseX + sway;

            // Wobble animation on mismatch
            if (b.isWobbling) {
              b.wobbleTimer -= dt;
              b.container.rotation = Math.sin(Date.now() * 0.04) * 0.25;
              if (b.wobbleTimer <= 0) {
                b.isWobbling = false;
                b.container.rotation = 0;
              }
            } else {
              b.container.rotation = Math.sin(Date.now() * b.swaySpeed * 0.08) * 0.06;
            }

            // Recycle balloon if it floats off top edge
            if (b.y < -130) {
              recycleBalloon(b);
            }
          });

          // Update Pop Particles
          particlesRef.current.forEach((p) => {
            if (p.active) {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += 0.15 * dt; // gravity
              p.alpha -= 0.025 * dt;

              p.container.x = p.x;
              p.container.y = p.y;
              p.container.alpha = Math.max(0, p.alpha);

              if (p.alpha <= 0) {
                p.active = false;
                p.container.visible = false;
              }
            }
          });
        });

        // Trigger first speech prompt
        setTimeout(() => {
          speakTarget(targetNumberRef.current);
        }, 300);
      });

    return () => {
      isDestroyed = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [speakTarget, onGamePlay, onGameWin, highScore]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Status & Controls Bar */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {DIFFICULTY_MODES.map((mode, idx) => (
            <button
              key={mode.id}
              onClick={() => changeDifficulty(idx)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                idx === difficultyIdx
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Score & Combo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Score:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums ml-1">{score}</span>
          </div>

          <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
            <Flame className="w-3.5 h-3.5" />
            <span>Streak:</span>
            <span className="font-mono font-bold tabular-nums ml-0.5">{combo}x</span>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Prominent Voice & Target Prompt Area */}
      <div className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 p-4 rounded-2xl shadow-md mb-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => speakTarget(targetNumber, 'Pop the number')}
            className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-transform active:scale-95 shadow-inner"
            title="Hear instruction again"
          >
            <Volume2 className="w-6 h-6 animate-pulse" />
          </button>
          <div>
            <div className="text-[11px] font-bold text-rose-100 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Voice Instruction:</span>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>{recentCallout}</span>
            </div>
          </div>
        </div>

        {/* Big Target Badge */}
        <div className="flex items-center gap-3 bg-white/15 px-4 py-2 rounded-xl border border-white/25">
          <span className="text-xs font-semibold text-rose-100">TARGET:</span>
          <div className="w-10 h-10 rounded-full bg-white text-rose-600 font-extrabold text-2xl flex items-center justify-center shadow-md">
            {targetNumber}
          </div>
        </div>
      </div>

      {/* Main PixiJS Viewport */}
      <div className="relative w-full flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-full max-w-[800px] aspect-[800/540] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-[#0f2b48] relative cursor-pointer"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Instructions & Audio Note */}
      <div className="w-full max-w-2xl mt-4 px-4 py-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div>
          <span className="font-bold text-slate-800">🎈 How to Play:</span>
          <span className="ml-1 text-slate-600">
            Listen to the friendly voice! Click or tap the floating balloon with the matching number to pop it for big combo points.
          </span>
        </div>
        <button
          onClick={() => speakTarget(targetNumber)}
          className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 shrink-0"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Repeat Audio</span>
        </button>
      </div>
    </div>
  );
};
