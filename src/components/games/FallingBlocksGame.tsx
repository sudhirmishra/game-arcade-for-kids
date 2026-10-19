import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';
import { sound } from '../../sound/soundEffects';
import { RotateCcw, Shuffle, Sparkles, Trophy, Zap, Layers, Play } from 'lucide-react';

interface FallingBlocksProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

type GameMode = 'match' | 'tower' | 'sandbox';

interface CritterType {
  id: string;
  name: string;
  color: number;
  shape: 'circle' | 'box' | 'star' | 'capsule';
  size: number;
  emoji: string;
  points: number;
  label: string;
}

const CRITTER_TYPES: CritterType[] = [
  { id: 'bubble', name: 'Jelly Pink', color: 0xf472b6, shape: 'circle', size: 28, emoji: '🌸', points: 50, label: 'Bouncy Pink' },
  { id: 'cubey', name: 'Cubey Sky', color: 0x38bdf8, shape: 'box', size: 48, emoji: '🧊', points: 60, label: 'Square Blue' },
  { id: 'starry', name: 'Starry Gold', color: 0xfacc15, shape: 'star', size: 30, emoji: '⭐', points: 80, label: 'Star Gold' },
  { id: 'melon', name: 'Melon Bean', color: 0x4ade80, shape: 'capsule', size: 44, emoji: '🍈', points: 70, label: 'Chonky Mint' },
  { id: 'berry', name: 'Berry Grape', color: 0xa855f7, shape: 'circle', size: 24, emoji: '🍇', points: 90, label: 'Mini Purple' },
];

export const FallingBlocksGame: React.FC<FallingBlocksProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const pedestalBodyRef = useRef<Matter.Body | null>(null);
  const pedestalGfxRef = useRef<Graphics | null>(null);

  // References to avoid recreating WebGL context
  const onGameWinRef = useRef(onGameWin);
  onGameWinRef.current = onGameWin;
  const onGamePlayRef = useRef(onGamePlay);
  onGamePlayRef.current = onGamePlay;

  // Maps Matter body ID to Pixi Container & metadata
  const critterMapRef = useRef<
    Map<
      number,
      {
        container: Container;
        body: Matter.Body;
        type: CritterType;
        pupils: Graphics[];
      }
    >
  >(new Map());

  // Dropper cursor X
  const dropperXRef = useRef<number>(240);
  const dropperGfxRef = useRef<Container | null>(null);

  // Game state
  const [mode, setMode] = useState<GameMode>('match');
  const modeRef = useRef<GameMode>(mode);
  modeRef.current = mode;

  const [score, setScore] = useState<number>(0);
  const [stackedCount, setStackedCount] = useState<number>(0);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [nextCritter, setNextCritter] = useState<CritterType>(CRITTER_TYPES[0]);
  const nextCritterRef = useRef<CritterType>(CRITTER_TYPES[0]);
  nextCritterRef.current = nextCritter;

  const [comboCount, setComboCount] = useState<number>(0);
  const [droppedTotal, setDroppedTotal] = useState<number>(0);

  // Highest records in localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_falling_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Pick random next critter
  const pickNextCritter = () => {
    const randomIdx = Math.floor(Math.random() * CRITTER_TYPES.length);
    const chosen = CRITTER_TYPES[randomIdx];
    setNextCritter(chosen);
    nextCritterRef.current = chosen;
  };

  // Create Matter.js body based on shape
  const createCritterBody = (x: number, y: number, critter: CritterType) => {
    let body: Matter.Body;

    if (critter.shape === 'circle') {
      body = Matter.Bodies.circle(x, y, critter.size, {
        restitution: 0.65,
        friction: 0.2,
        density: 0.002,
      });
    } else if (critter.shape === 'box') {
      body = Matter.Bodies.rectangle(x, y, critter.size, critter.size, {
        chamfer: { radius: 10 },
        restitution: 0.45,
        friction: 0.4,
        density: 0.003,
      });
    } else if (critter.shape === 'capsule') {
      body = Matter.Bodies.rectangle(x, y, critter.size * 1.3, critter.size * 0.7, {
        chamfer: { radius: 14 },
        restitution: 0.5,
        friction: 0.35,
        density: 0.0025,
      });
    } else {
      // Star polygon
      body = Matter.Bodies.polygon(x, y, 5, critter.size, {
        chamfer: { radius: 6 },
        restitution: 0.55,
        friction: 0.3,
        density: 0.0025,
      });
    }

    (body as unknown as { critterData: CritterType }).critterData = critter;
    return body;
  };

  // Create PixiJS visual representation with googly animated eyes
  const createCritterVisual = (critter: CritterType): { container: Container; pupils: Graphics[] } => {
    const container = new Container();

    const bodyGfx = new Graphics();
    const faceGfx = new Graphics();
    const eyeContainer = new Container();
    const pupils: Graphics[] = [];

    // Draw main body shape
    if (critter.shape === 'circle') {
      bodyGfx
        .circle(0, 0, critter.size)
        .fill({ color: critter.color })
        .stroke({ width: 3, color: 0xffffff });

      // Cheek blush
      bodyGfx
        .circle(-critter.size * 0.5, 6, 5)
        .fill({ color: 0xffffff, alpha: 0.4 })
        .circle(critter.size * 0.5, 6, 5)
        .fill({ color: 0xffffff, alpha: 0.4 });
    } else if (critter.shape === 'box') {
      bodyGfx
        .roundRect(-critter.size / 2, -critter.size / 2, critter.size, critter.size, 12)
        .fill({ color: critter.color })
        .stroke({ width: 3, color: 0xffffff });

      bodyGfx
        .circle(-critter.size * 0.3, 8, 4)
        .fill({ color: 0xffffff, alpha: 0.4 })
        .circle(critter.size * 0.3, 8, 4)
        .fill({ color: 0xffffff, alpha: 0.4 });
    } else if (critter.shape === 'capsule') {
      const w = critter.size * 1.3;
      const h = critter.size * 0.7;
      bodyGfx
        .roundRect(-w / 2, -h / 2, w, h, 14)
        .fill({ color: critter.color })
        .stroke({ width: 3, color: 0xffffff });
    } else {
      // Star polygon
      bodyGfx
        .poly([
          0, -critter.size,
          critter.size * 0.9, -critter.size * 0.3,
          critter.size * 0.6, critter.size * 0.9,
          -critter.size * 0.6, critter.size * 0.9,
          -critter.size * 0.9, -critter.size * 0.3,
        ])
        .fill({ color: critter.color })
        .stroke({ width: 3, color: 0xffffff });
    }

    // Googly Eyes
    const eyeSpacing = critter.size * 0.38;
    const eyeRadius = Math.max(5, critter.size * 0.22);
    const pupilRadius = Math.max(2.5, eyeRadius * 0.5);

    [-eyeSpacing, eyeSpacing].forEach((eyeX) => {
      // Eye white
      const eyeWhite = new Graphics();
      eyeWhite
        .circle(eyeX, -3, eyeRadius)
        .fill({ color: 0xffffff })
        .stroke({ width: 1.5, color: 0x334155 });
      eyeContainer.addChild(eyeWhite);

      // Pupil
      const pupil = new Graphics();
      pupil
        .circle(eyeX, -3, pupilRadius)
        .fill({ color: 0x1e293b });
      // Sparkle shine in pupil
      pupil
        .circle(eyeX - 1, -4.5, 1)
        .fill({ color: 0xffffff });

      eyeContainer.addChild(pupil);
      pupils.push(pupil);
    });

    // Friendly smiling mouth
    faceGfx
      .arc(0, 5, critter.size * 0.2, 0.1 * Math.PI, 0.9 * Math.PI, false)
      .stroke({ width: 2, color: 0x1e293b, cap: 'round' });

    container.addChild(bodyGfx);
    container.addChild(eyeContainer);
    container.addChild(faceGfx);

    container.eventMode = 'static';
    container.cursor = 'pointer';

    return { container, pupils };
  };

  // Pop matching critters connected together
  const handleCritterTap = (bodyId: number) => {
    if (!engineRef.current || !appRef.current) return;

    const clicked = critterMapRef.current.get(bodyId);
    if (!clicked) return;

    // In Match Mode: find adjacent/touching critters of same type
    const toPop: number[] = [bodyId];
    const targetType = clicked.type.id;

    // Check distance with other bodies
    const allBodies = Array.from(critterMapRef.current.values());
    allBodies.forEach(({ body, type }) => {
      if (body.id !== bodyId && type.id === targetType) {
        const dx = body.position.x - clicked.body.position.x;
        const dy = body.position.y - clicked.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < clicked.type.size + type.size + 15) {
          toPop.push(body.id);
        }
      }
    });

    if (toPop.length >= 2 || modeRef.current === 'sandbox') {
      sound.playPop();

      // Burst points
      const pointsEarned = toPop.length * clicked.type.points * (toPop.length > 2 ? 2 : 1);
      setScore((s) => {
        const newScore = s + pointsEarned;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('wonderpix_falling_score', String(newScore));
        }
        return newScore;
      });

      setComboCount((c) => c + 1);

      if (toPop.length >= 3) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            x: clicked.body.position.x / 480,
            y: clicked.body.position.y / 560,
          },
        });
        onGameWinRef.current?.();
      }

      // Remove popped critters from world and stage
      toPop.forEach((id) => {
        const item = critterMapRef.current.get(id);
        if (item) {
          Matter.Composite.remove(engineRef.current!.world, item.body);
          appRef.current!.stage.removeChild(item.container);
          critterMapRef.current.delete(id);
        }
      });
    } else {
      // Gentle tickle wobble if only 1
      sound.playBounce(0.5);
      Matter.Body.applyForce(clicked.body, clicked.body.position, {
        x: (Math.random() - 0.5) * 0.02,
        y: -0.02,
      });
    }
  };

  // Drop active critter at X coordinate
  const dropCritter = useCallback((targetX?: number) => {
    if (!engineRef.current || !appRef.current) return;

    onGamePlayRef.current?.();
    sound.playTap(480);

    const critterToSpawn = nextCritterRef.current;
    const spawnX = Math.max(50, Math.min(430, targetX ?? dropperXRef.current));
    const spawnY = 45;

    const body = createCritterBody(spawnX, spawnY, critterToSpawn);
    Matter.Composite.add(engineRef.current.world, body);

    const { container, pupils } = createCritterVisual(critterToSpawn);
    container.x = spawnX;
    container.y = spawnY;
    appRef.current.stage.addChild(container);

    critterMapRef.current.set(body.id, {
      container,
      body,
      type: critterToSpawn,
      pupils,
    });

    // Tap to pop handler in Match Mode
    container.on('pointerdown', () => {
      handleCritterTap(body.id);
    });

    setDroppedTotal((prev) => prev + 1);
    pickNextCritter();
  }, []);

  // Shake / Stir the toy box
  const shakeBox = () => {
    if (!engineRef.current) return;
    sound.playBounce(1.5);

    critterMapRef.current.forEach(({ body }) => {
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.05,
        y: -0.04 - Math.random() * 0.03,
      });
    });
  };

  // Reset entire playground
  const resetGame = () => {
    sound.playTap(400);
    if (!engineRef.current || !appRef.current) return;

    // Clear bodies
    critterMapRef.current.forEach(({ body, container }) => {
      Matter.Composite.remove(engineRef.current!.world, body);
      appRef.current!.stage.removeChild(container);
    });
    critterMapRef.current.clear();

    setScore(0);
    setStackedCount(0);
    setMaxHeight(0);
    setComboCount(0);
    setDroppedTotal(0);
    pickNextCritter();
  };

  // Handle Mode Switch
  const switchMode = (newMode: GameMode) => {
    sound.playTap();
    setMode(newMode);
    modeRef.current = newMode;

    if (!engineRef.current) return;

    // Manage pedestal in Tower Mode
    if (newMode === 'tower') {
      if (!pedestalBodyRef.current) {
        pedestalBodyRef.current = Matter.Bodies.rectangle(240, 525, 180, 20, {
          isStatic: true,
          friction: 0.9,
        });
        Matter.Composite.add(engineRef.current.world, pedestalBodyRef.current);
      }
      if (pedestalGfxRef.current) {
        pedestalGfxRef.current.visible = true;
      }
    } else {
      if (pedestalBodyRef.current) {
        Matter.Composite.remove(engineRef.current.world, pedestalBodyRef.current);
        pedestalBodyRef.current = null;
      }
      if (pedestalGfxRef.current) {
        pedestalGfxRef.current.visible = false;
      }
    }

    resetGame();
  };

  // Initialize Pixi & Matter Engine ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    const stageWidth = 480;
    const stageHeight = 560;

    // 1. Initialize Matter.js Physics Engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.95, scale: 0.001 },
    });
    engineRef.current = engine;

    // Boundaries: Bottom ground + Left and Right walls
    const ground = Matter.Bodies.rectangle(stageWidth / 2, stageHeight - 12, stageWidth, 24, {
      isStatic: true,
      friction: 0.8,
    });
    const leftWall = Matter.Bodies.rectangle(-10, stageHeight / 2, 20, stageHeight, {
      isStatic: true,
    });
    const rightWall = Matter.Bodies.rectangle(stageWidth + 10, stageHeight / 2, 20, stageHeight, {
      isStatic: true,
    });

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Collision sound listener
    Matter.Events.on(engine, 'collisionStart', (evt) => {
      evt.pairs.forEach((pair) => {
        const vel = Math.hypot(
          pair.bodyA.velocity.x - pair.bodyB.velocity.x,
          pair.bodyA.velocity.y - pair.bodyB.velocity.y
        );
        if (vel > 2.5) {
          sound.playBounce(Math.min(vel / 10, 1.2));
        }
      });
    });

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // 2. Initialize PixiJS Application
    const app = new Application();
    appRef.current = app;

    app
      .init({
        width: stageWidth,
        height: stageHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0xf8fafc,
        antialias: true,
      })
      .then(() => {
        if (isDestroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.eventMode = 'static';
        stage.hitArea = app.screen;

        // Visual backdrop
        const bgGfx = new Graphics();
        bgGfx.rect(0, 0, stageWidth, stageHeight).fill({ color: 0xffffff });
        stage.addChild(bgGfx);

        // Ground visual
        const floorGfx = new Graphics();
        floorGfx
          .roundRect(0, stageHeight - 24, stageWidth, 24, 8)
          .fill({ color: 0xe2e8f0 })
          .stroke({ width: 2, color: 0xcbd5e1 });
        stage.addChild(floorGfx);

        // Pedestal visual for Tower Mode
        const pedGfx = new Graphics();
        pedGfx
          .roundRect(stageWidth / 2 - 90, stageHeight - 45, 180, 20, 8)
          .fill({ color: 0x3b82f6 })
          .stroke({ width: 2, color: 0x1d4ed8 });
        pedGfx.visible = modeRef.current === 'tower';
        pedestalGfxRef.current = pedGfx;
        stage.addChild(pedGfx);

        // Dropper guide line & crane container
        const dropperContainer = new Container();
        dropperGfxRef.current = dropperContainer;
        dropperContainer.x = dropperXRef.current;
        dropperContainer.y = 20;

        const craneGfx = new Graphics();
        craneGfx
          .circle(0, 0, 14)
          .fill({ color: 0x64748b })
          .stroke({ width: 2, color: 0x334155 })
          .rect(-2, 14, 4, 16)
          .fill({ color: 0x94a3b8 });

        const dashedGuide = new Graphics();
        dashedGuide
          .moveTo(0, 30)
          .lineTo(0, stageHeight - 30)
          .stroke({ width: 1.5, color: 0x94a3b8, alpha: 0.35 });

        dropperContainer.addChild(dashedGuide);
        dropperContainer.addChild(craneGfx);
        stage.addChild(dropperContainer);

        // Pointer move: move dropper and steer googly eyes
        stage.on('pointermove', (evt) => {
          const clampedX = Math.max(50, Math.min(stageWidth - 50, evt.global.x));
          dropperXRef.current = clampedX;
          if (dropperGfxRef.current) {
            dropperGfxRef.current.x = clampedX;
          }

          // Orient critter pupils toward mouse pointer
          critterMapRef.current.forEach(({ container, pupils, type }) => {
            const dx = evt.global.x - container.x;
            const dy = evt.global.y - container.y;
            const dist = Math.hypot(dx, dy) || 1;
            const maxPupilOffset = 2.5;
            const offsetX = (dx / dist) * maxPupilOffset;
            const offsetY = (dy / dist) * maxPupilOffset;

            const eyeSpacing = type.size * 0.38;
            if (pupils[0]) {
              pupils[0].x = -eyeSpacing + offsetX;
              pupils[0].y = -3 + offsetY;
            }
            if (pupils[1]) {
              pupils[1].x = eyeSpacing + offsetX;
              pupils[1].y = -3 + offsetY;
            }
          });
        });

        // Pointer down on canvas: drop critter
        stage.on('pointerdown', (evt) => {
          if (evt.global.y < stageHeight - 60) {
            dropCritter(evt.global.x);
          }
        });

        // 3. Game Ticker: Update Pixi Graphics with Matter.js physics coordinates
        app.ticker.add(() => {
          let highestY = stageHeight;

          critterMapRef.current.forEach(({ container, body }) => {
            container.x = body.position.x;
            container.y = body.position.y;
            container.rotation = body.angle;

            if (body.position.y < highestY) {
              highestY = body.position.y;
            }
          });

          // In Tower Mode: calculate height stacked
          if (modeRef.current === 'tower') {
            const currentHeightPx = Math.max(0, Math.round(stageHeight - 45 - highestY));
            setMaxHeight(currentHeightPx);
            setStackedCount(critterMapRef.current.size);

            if (critterMapRef.current.size >= 8) {
              onGameWinRef.current?.();
            }
          }
        });
      });

    return () => {
      isDestroyed = true;
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
        runnerRef.current = null;
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
        engineRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      critterMapRef.current.clear();
    };
  }, [dropCritter]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Game Mode Selector & Action Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Mode switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => switchMode('match')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'match' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Critter Pop & Match</span>
          </button>

          <button
            onClick={() => switchMode('tower')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'tower' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Tower Stacker</span>
          </button>

          <button
            onClick={() => switchMode('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'sandbox' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Toy Box Sandbox</span>
          </button>
        </div>

        {/* Next Critter Preview Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-400 font-medium">Up Next:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">{nextCritter.emoji}</span>
              <span className="text-xs font-bold text-slate-800">{nextCritter.label}</span>
            </div>
          </div>

          <button
            onClick={shakeBox}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-all active:scale-95"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-600" />
            <span>Stir Box</span>
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Score HUD */}
      <div className="w-full grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{mode === 'tower' ? 'Tower Height' : 'Score'}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {mode === 'tower' ? `${maxHeight} px` : score}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>{mode === 'tower' ? 'Critters on Tower' : 'Dropped Critters'}</span>
          </div>
          <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {mode === 'tower' ? stackedCount : droppedTotal}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Best Record</span>
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {mode === 'tower' ? `${highScore > 0 ? highScore : maxHeight} px` : highScore}
          </span>
        </div>
      </div>

      {/* Physics Canvas Arena */}
      <div className="flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-[340px] h-[400px] sm:w-[480px] sm:h-[560px] shadow-lg rounded-3xl overflow-hidden bg-slate-50 border-2 border-slate-200 relative cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Drop Quick Button for Mobile/Touch */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => dropCritter()}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all text-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Drop {nextCritter.emoji} Critter!</span>
          </button>
        </div>
      </div>

      {/* Kid Instructions & Physics Description */}
      <div className="mt-6 text-center text-xs text-slate-500 max-w-lg">
        {mode === 'match' && (
          <p>
            🎯 <strong>How to Play:</strong> Move your mouse or finger to aim the crane, then tap to drop! When 2 or more matching critters touch, tap them to pop for points!
          </p>
        )}
        {mode === 'tower' && (
          <p>
            🏗️ <strong>How to Play:</strong> Stack critters carefully onto the center blue pedestal. Keep balance and see how high your whimsical tower can grow!
          </p>
        )}
        {mode === 'sandbox' && (
          <p>
            ✨ <strong>Free Play:</strong> Drop unlimited critters, tap to tickle them, and hit <strong>Stir Box</strong> to launch them tumbling through the air!
          </p>
        )}
      </div>
    </div>
  );
};
