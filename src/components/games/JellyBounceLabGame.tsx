import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { sound } from '../../sound/soundEffects';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Play,
  Eraser,
  Volume2,
  VolumeX,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

interface JellyBounceLabProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

interface DrawnLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  color: number;
  vibrationAmp: number;
  vibrationPhase: number;
  hitT: number;
  normalX: number;
  normalY: number;
}

interface StarItem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  container: Container;
  starGfx: Graphics;
}

interface SoapBubble {
  id: number;
  x: number;
  y: number;
  initialY: number;
  radius: number;
  popped: boolean;
  container: Container;
  bubbleGfx: Graphics;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  gfx: Graphics;
}

interface LevelConfig {
  id: number;
  name: string;
  maxInk: number;
  pipe: { x: number; y: number };
  candyJar: { x: number; y: number };
  stars: { x: number; y: number }[];
  bubbles: { x: number; y: number; radius: number }[];
  obstacles: { x: number; y: number; w: number; h: number; color?: number }[];
  hint: string;
}

const RAINBOW_COLORS = [
  0xff598f, // Hot pink
  0xfd8a5e, // Coral
  0xf4d35e, // Sun yellow
  0x2ec4b6, // Mint turquoise
  0x38bdf8, // Sky blue
  0xa855f7, // Lavender purple
];

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'First Bounce',
    maxInk: 450,
    pipe: { x: 140, y: 55 },
    candyJar: { x: 660, y: 470 },
    stars: [
      { x: 300, y: 220 },
      { x: 480, y: 310 },
      { x: 600, y: 410 },
    ],
    bubbles: [],
    obstacles: [],
    hint: 'Draw an upward-slanted bouncy line to launch the jelly toward the candy jar!',
  },
  {
    id: 2,
    name: 'Zig-Zag Alley',
    maxInk: 550,
    pipe: { x: 200, y: 55 },
    candyJar: { x: 680, y: 470 },
    stars: [
      { x: 360, y: 190 },
      { x: 180, y: 380 },
      { x: 520, y: 440 },
    ],
    bubbles: [],
    obstacles: [
      { x: 320, y: 220, w: 160, h: 24, color: 0x475569 },
      { x: 460, y: 340, w: 20, h: 140, color: 0x475569 },
    ],
    hint: 'Use two angled trampoline lines to bounce around the wall!',
  },
  {
    id: 3,
    name: 'Bubble Lift',
    maxInk: 500,
    pipe: { x: 120, y: 55 },
    candyJar: { x: 680, y: 470 },
    stars: [
      { x: 260, y: 240 },
      { x: 400, y: 140 },
      { x: 620, y: 360 },
    ],
    bubbles: [{ x: 300, y: 380, radius: 36 }],
    obstacles: [
      { x: 370, y: 240, w: 24, h: 280, color: 0x475569 },
      { x: 500, y: 120, w: 120, h: 22, color: 0x475569 },
    ],
    hint: 'Bounce into the floating soap bubble! It carries the jelly up—tap it to pop!',
  },
  {
    id: 4,
    name: 'Windy Cavern',
    maxInk: 600,
    pipe: { x: 130, y: 55 },
    candyJar: { x: 690, y: 470 },
    stars: [
      { x: 280, y: 320 },
      { x: 490, y: 160 },
      { x: 650, y: 320 },
    ],
    bubbles: [
      { x: 260, y: 420, radius: 34 },
      { x: 530, y: 320, radius: 34 },
    ],
    obstacles: [
      { x: 200, y: 240, w: 18, h: 180, color: 0x475569 },
      { x: 400, y: 180, w: 18, h: 320, color: 0x475569 },
    ],
    hint: 'Ride the first bubble, pop it, bounce across, and ride the second bubble to victory!',
  },
  {
    id: 5,
    name: 'Master Bouncer',
    maxInk: 650,
    pipe: { x: 100, y: 55 },
    candyJar: { x: 700, y: 470 },
    stars: [
      { x: 240, y: 180 },
      { x: 420, y: 340 },
      { x: 560, y: 200 },
    ],
    bubbles: [{ x: 380, y: 430, radius: 38 }],
    obstacles: [
      { x: 170, y: 220, w: 120, h: 20, color: 0x475569 },
      { x: 320, y: 140, w: 20, h: 220, color: 0x475569 },
      { x: 490, y: 260, w: 150, h: 20, color: 0x475569 },
    ],
    hint: 'The grand laboratory test! Calculate your angles and pop bubbles with perfect timing!',
  },
];

export const JellyBounceLabGame: React.FC<JellyBounceLabProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const onGamePlayRef = useRef(onGamePlay);
  onGamePlayRef.current = onGamePlay;
  const onGameWinRef = useRef(onGameWin);
  onGameWinRef.current = onGameWin;

  // Level & state
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [levelWon, setLevelWon] = useState<boolean>(false);
  const [starsEarned, setStarsEarned] = useState<number>(0);
  const [inkRemaining, setInkRemaining] = useState<number>(LEVELS[0].maxInk);
  const [isJellyDropping, setIsJellyDropping] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  const currentLevel = LEVELS[currentLevelIdx];

  // Game Engine & Physics refs
  const linesRef = useRef<DrawnLine[]>([]);
  const linesGfxRef = useRef<Graphics | null>(null);
  const previewGfxRef = useRef<Graphics | null>(null);
  const drawingStartRef = useRef<{ x: number; y: number } | null>(null);
  const inkRemainingRef = useRef<number>(LEVELS[0].maxInk);
  inkRemainingRef.current = inkRemaining;

  // Jelly state
  const jellyRef = useRef<{
    container: Container;
    bodyGfx: Graphics;
    eyeLeft: Graphics;
    eyeRight: Graphics;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isTrapped: boolean;
    trappedBubble: SoapBubble | null;
    scaleX: number;
    scaleY: number;
    isWon: boolean;
  } | null>(null);

  // Entities
  const starsRef = useRef<StarItem[]>([]);
  const bubblesRef = useRef<SoapBubble[]>([]);
  const confettiPoolRef = useRef<ConfettiParticle[]>([]);
  const confettiContainerRef = useRef<Container | null>(null);

  // Drop jelly from pipe
  const dropJelly = useCallback(() => {
    if (!jellyRef.current) return;
    onGamePlayRef.current?.();
    sound.playTap(620);

    const pipe = currentLevel.pipe;
    jellyRef.current.x = pipe.x;
    jellyRef.current.y = pipe.y + 10;
    jellyRef.current.vx = 1.2;
    jellyRef.current.vy = 1.8;
    jellyRef.current.isTrapped = false;
    jellyRef.current.trappedBubble = null;
    jellyRef.current.scaleX = 1.0;
    jellyRef.current.scaleY = 1.0;
    jellyRef.current.isWon = false;
    jellyRef.current.container.visible = true;

    setIsJellyDropping(true);
  }, [currentLevel]);

  // Reset current level
  const resetLevel = useCallback(() => {
    sound.playTap(440);
    setLevelWon(false);
    setStarsEarned(0);
    setIsJellyDropping(false);

    // Reset jelly position
    if (jellyRef.current) {
      jellyRef.current.x = currentLevel.pipe.x;
      jellyRef.current.y = currentLevel.pipe.y + 10;
      jellyRef.current.vx = 0;
      jellyRef.current.vy = 0;
      jellyRef.current.isTrapped = false;
      jellyRef.current.trappedBubble = null;
      jellyRef.current.container.scale.set(1, 1);
      jellyRef.current.container.visible = true;
    }

    // Reset stars
    starsRef.current.forEach((st) => {
      st.collected = false;
      st.container.visible = true;
      st.container.alpha = 1;
    });

    // Reset bubbles
    bubblesRef.current.forEach((b) => {
      b.popped = false;
      b.container.visible = true;
      b.container.alpha = 1;
      b.y = b.initialY;
    });

    // Clear confetti
    confettiPoolRef.current.forEach((p) => {
      p.gfx.visible = false;
    });
  }, [currentLevel]);

  // Clear drawn trampoline lines and restore ink
  const clearLines = () => {
    sound.playTap(350);
    linesRef.current = [];
    if (linesGfxRef.current) {
      linesGfxRef.current.clear();
    }
    setInkRemaining(currentLevel.maxInk);
    inkRemainingRef.current = currentLevel.maxInk;
  };

  // Next level handler
  const nextLevel = () => {
    sound.playTap(580);
    if (currentLevelIdx < LEVELS.length - 1) {
      const nextIdx = currentLevelIdx + 1;
      setCurrentLevelIdx(nextIdx);
      linesRef.current = [];
      setInkRemaining(LEVELS[nextIdx].maxInk);
      inkRemainingRef.current = LEVELS[nextIdx].maxInk;
      setLevelWon(false);
      setStarsEarned(0);
      setIsJellyDropping(false);
    } else {
      // Loop back or replay
      setCurrentLevelIdx(0);
      linesRef.current = [];
      setInkRemaining(LEVELS[0].maxInk);
      inkRemainingRef.current = LEVELS[0].maxInk;
      setLevelWon(false);
      setStarsEarned(0);
      setIsJellyDropping(false);
    }
  };

  // Build Level Scene Objects (Obstacles, Stars, Bubbles, Pipe, Candy Jar)
  const buildLevelScene = useCallback((app: Application, level: LevelConfig) => {
    const stage = app.stage;
    stage.removeChildren();

    // 1. Dark Lab Background (0x1a1a2e as strictly requested)
    const bgGfx = new Graphics();
    bgGfx.rect(0, 0, 800, 560).fill({ color: 0x1a1a2e });
    // Decorative subtle lab grid
    for (let x = 40; x < 800; x += 40) {
      bgGfx.moveTo(x, 0).lineTo(x, 560).stroke({ width: 1, color: 0x272744, alpha: 0.35 });
    }
    for (let y = 40; y < 560; y += 40) {
      bgGfx.moveTo(0, y).lineTo(800, y).stroke({ width: 1, color: 0x272744, alpha: 0.35 });
    }
    stage.addChild(bgGfx);

    // 2. Obstacles Layer
    const obsContainer = new Container();
    level.obstacles.forEach((obs) => {
      const g = new Graphics();
      g.roundRect(obs.x, obs.y, obs.w, obs.h, 8)
        .fill({ color: obs.color ?? 0x475569 })
        .stroke({ width: 2, color: 0x64748b });
      obsContainer.addChild(g);
    });
    stage.addChild(obsContainer);

    // 3. Candy Jar (Goal at bottom)
    const jarContainer = new Container();
    jarContainer.x = level.candyJar.x;
    jarContainer.y = level.candyJar.y;

    const jarGfx = new Graphics();
    // Glass Jar Base
    jarGfx
      .roundRect(-42, -50, 84, 80, 16)
      .fill({ color: 0x0284c7, alpha: 0.25 })
      .stroke({ width: 3, color: 0x38bdf8 });
    // Colorful candies inside jar
    jarGfx
      .circle(-18, 0, 10).fill({ color: 0xf43f5e })
      .circle(12, 5, 11).fill({ color: 0xfbbf24 })
      .circle(-5, -18, 9).fill({ color: 0x34d399 })
      .circle(18, -12, 8).fill({ color: 0xa855f7 });
    // Jar Neck & Lid
    jarGfx
      .rect(-30, -56, 60, 10).fill({ color: 0x0ea5e9, alpha: 0.4 })
      .stroke({ width: 2, color: 0x38bdf8 })
      .roundRect(-36, -64, 72, 10, 4).fill({ color: 0xf43f5e })
      .stroke({ width: 2, color: 0xffffff });
    // Glowing target halo
    jarGfx.circle(0, -25, 45).stroke({ width: 2, color: 0x38bdf8, alpha: 0.4 });

    const jarLabel = new Text({
      text: 'CANDY JAR',
      style: new TextStyle({
        fontFamily: 'Outfit, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        fill: 0x38bdf8,
      }),
    });
    jarLabel.anchor.set(0.5);
    jarLabel.y = 24;

    jarContainer.addChild(jarGfx);
    jarContainer.addChild(jarLabel);
    stage.addChild(jarContainer);

    // 4. Pipe Dispenser at top
    const pipeContainer = new Container();
    pipeContainer.x = level.pipe.x;
    pipeContainer.y = level.pipe.y;

    const pipeGfx = new Graphics();
    pipeGfx
      .rect(-24, -40, 48, 40)
      .fill({ color: 0x64748b })
      .stroke({ width: 2, color: 0x94a3b8 })
      .roundRect(-28, -6, 56, 12, 4)
      .fill({ color: 0x334155 })
      .stroke({ width: 2, color: 0x94a3b8 });
    pipeContainer.addChild(pipeGfx);
    stage.addChild(pipeContainer);

    // 5. Collectible Golden Stars
    starsRef.current = [];
    level.stars.forEach((stPos, idx) => {
      const starContainer = new Container();
      starContainer.x = stPos.x;
      starContainer.y = stPos.y;

      const starGfx = new Graphics();
      // Draw 5-pointed star
      const outerR = 16;
      const innerR = 7;
      const points: number[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      starGfx.poly(points).fill({ color: 0xfacc15 }).stroke({ width: 2, color: 0xffffff });

      // Star sparkle aura
      const aura = new Graphics();
      aura.circle(0, 0, 20).stroke({ width: 1.5, color: 0xfef08a, alpha: 0.5 });

      starContainer.addChild(aura);
      starContainer.addChild(starGfx);
      stage.addChild(starContainer);

      starsRef.current.push({
        id: idx,
        x: stPos.x,
        y: stPos.y,
        collected: false,
        container: starContainer,
        starGfx,
      });
    });

    // 6. Soap Bubbles (Interactive floating bubbles with eventMode = 'static')
    bubblesRef.current = [];
    level.bubbles.forEach((bCfg, idx) => {
      const bContainer = new Container();
      bContainer.x = bCfg.x;
      bContainer.y = bCfg.y;
      bContainer.eventMode = 'static';
      bContainer.cursor = 'pointer';

      const bGfx = new Graphics();
      // Iridescent soapy bubble
      bGfx
        .circle(0, 0, bCfg.radius)
        .fill({ color: 0x38bdf8, alpha: 0.28 })
        .stroke({ width: 2.5, color: 0xe0e7ff, alpha: 0.85 });
      // Bubble shine highlight
      bGfx
        .arc(-bCfg.radius * 0.35, -bCfg.radius * 0.35, bCfg.radius * 0.45, 1.1 * Math.PI, 1.7 * Math.PI)
        .stroke({ width: 3, color: 0xffffff, alpha: 0.9, cap: 'round' });

      bContainer.addChild(bGfx);

      // Bubble pop tap handler
      bContainer.on('pointerdown', (e) => {
        e.stopPropagation();
        const bubble = bubblesRef.current.find((b) => b.id === idx);
        if (bubble && !bubble.popped) {
          sound.playBubblePop();
          bubble.popped = true;
          bubble.container.visible = false;

          // If jelly is inside, release it!
          if (jellyRef.current && jellyRef.current.trappedBubble === bubble) {
            jellyRef.current.isTrapped = false;
            jellyRef.current.trappedBubble = null;
            jellyRef.current.vy = -3.5; // gentle upward pop impulse
            jellyRef.current.vx = (Math.random() - 0.5) * 2;
          }
        }
      });

      stage.addChild(bContainer);

      bubblesRef.current.push({
        id: idx,
        x: bCfg.x,
        y: bCfg.y,
        initialY: bCfg.y,
        radius: bCfg.radius,
        popped: false,
        container: bContainer,
        bubbleGfx: bGfx,
      });
    });

    // 7. Lines Render Layer
    const linesGfx = new Graphics();
    linesGfxRef.current = linesGfx;
    stage.addChild(linesGfx);

    // 8. Drawing Preview Line Layer
    const previewGfx = new Graphics();
    previewGfxRef.current = previewGfx;
    stage.addChild(previewGfx);

    // 9. Jelly Character (Container with rounded rect body + googly eye graphics)
    const jellyContainer = new Container();
    jellyContainer.x = level.pipe.x;
    jellyContainer.y = level.pipe.y + 10;

    const jellyBody = new Graphics();
    const jellyWidth = 38;
    const jellyHeight = 34;
    // Glowing candy-pink rounded jelly
    jellyBody
      .roundRect(-jellyWidth / 2, -jellyHeight / 2, jellyWidth, jellyHeight, 14)
      .fill({ color: 0xf43f5e })
      .stroke({ width: 3, color: 0xffffff });
    // Cheerful rosy cheeks
    jellyBody
      .circle(-10, 4, 3.5).fill({ color: 0xffa5b6, alpha: 0.6 })
      .circle(10, 4, 3.5).fill({ color: 0xffa5b6, alpha: 0.6 });
    // Smiling mouth
    jellyBody
      .arc(0, 3, 5, 0.1 * Math.PI, 0.9 * Math.PI)
      .stroke({ width: 2, color: 0x881337, cap: 'round' });

    // Two Googly Eyes
    const eyeContainer = new Container();
    const eyeSpacing = 8;

    // Eye Whites
    const eyeLeftWhite = new Graphics();
    eyeLeftWhite.circle(-eyeSpacing, -5, 5.5).fill({ color: 0xffffff }).stroke({ width: 1.2, color: 0x334155 });
    const eyeRightWhite = new Graphics();
    eyeRightWhite.circle(eyeSpacing, -5, 5.5).fill({ color: 0xffffff }).stroke({ width: 1.2, color: 0x334155 });
    eyeContainer.addChild(eyeLeftWhite);
    eyeContainer.addChild(eyeRightWhite);

    // Pupils that shift toward velocity vector
    const pupilLeft = new Graphics();
    pupilLeft.circle(-eyeSpacing, -5, 2.5).fill({ color: 0x0f172a }).circle(-eyeSpacing - 0.7, -6, 0.9).fill({ color: 0xffffff });
    const pupilRight = new Graphics();
    pupilRight.circle(eyeSpacing, -5, 2.5).fill({ color: 0x0f172a }).circle(eyeSpacing - 0.7, -6, 0.9).fill({ color: 0xffffff });
    eyeContainer.addChild(pupilLeft);
    eyeContainer.addChild(pupilRight);

    jellyContainer.addChild(jellyBody);
    jellyContainer.addChild(eyeContainer);
    stage.addChild(jellyContainer);

    jellyRef.current = {
      container: jellyContainer,
      bodyGfx: jellyBody,
      eyeLeft: pupilLeft,
      eyeRight: pupilRight,
      x: level.pipe.x,
      y: level.pipe.y + 10,
      vx: 0,
      vy: 0,
      radius: 18,
      isTrapped: false,
      trappedBubble: null,
      scaleX: 1.0,
      scaleY: 1.0,
      isWon: false,
    };

    // 10. Confetti Particle Pool Layer (PIXI.Graphics stars pool)
    const confettiContainer = new Container();
    confettiContainerRef.current = confettiContainer;
    confettiPoolRef.current = [];

    const confettiColors = [0xf43f5e, 0xfbbf24, 0x38bdf8, 0x34d399, 0xa855f7, 0xffffff];
    for (let i = 0; i < 45; i++) {
      const pGfx = new Graphics();
      pGfx.poly([
        0, -6, 4, -2, 6, 4, 0, 2, -6, 4, -4, -2
      ]).fill({ color: confettiColors[i % confettiColors.length] });
      pGfx.visible = false;
      confettiContainer.addChild(pGfx);

      confettiPoolRef.current.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: confettiColors[i % confettiColors.length],
        size: 5 + Math.random() * 4,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        gfx: pGfx,
      });
    }
    stage.addChild(confettiContainer);
  }, []);

  // Main PixiJS Application Lifecycle (Strictly PixiJS v8)
  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    const app = new Application();
    appRef.current = app;

    // Asynchronously initialize app with resizeTo / dimension constraints
    app
      .init({
        width: 800,
        height: 560,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0x1a1a2e, // Strictly 0x1a1a2e as requested
        antialias: true,
      })
      .then(() => {
        if (isDestroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);

        // Strict Requirement: Use eventMode = 'static' on app.stage to capture pointer events
        const stage = app.stage;
        stage.eventMode = 'static';
        stage.hitArea = app.screen;

        buildLevelScene(app, LEVELS[currentLevelIdx]);

        // Pointer event listeners on stage for drawing bouncy lines
        stage.on('pointerdown', (evt) => {
          if (inkRemainingRef.current <= 15) return;
          drawingStartRef.current = { x: evt.global.x, y: evt.global.y };
        });

        stage.on('pointermove', (evt) => {
          if (!drawingStartRef.current || !previewGfxRef.current) return;

          const x1 = drawingStartRef.current.x;
          const y1 = drawingStartRef.current.y;
          const x2 = evt.global.x;
          const y2 = evt.global.y;
          const dist = Math.hypot(x2 - x1, y2 - y1);

          if (dist > 10) {
            previewGfxRef.current.clear();
            const allowedDist = Math.min(dist, inkRemainingRef.current);
            const ratio = allowedDist / dist;
            const clampedX2 = x1 + (x2 - x1) * ratio;
            const clampedY2 = y1 + (y2 - y1) * ratio;

            previewGfxRef.current
              .moveTo(x1, y1)
              .lineTo(clampedX2, clampedY2)
              .stroke({ width: 6, color: 0xffffff, alpha: 0.6, cap: 'round' });
          }
        });

        const finishLine = (evt: { global: { x: number; y: number } }) => {
          if (!drawingStartRef.current) return;

          const x1 = drawingStartRef.current.x;
          const y1 = drawingStartRef.current.y;
          const x2 = evt.global.x;
          const y2 = evt.global.y;
          const rawDist = Math.hypot(x2 - x1, y2 - y1);

          if (rawDist > 20 && inkRemainingRef.current > 10) {
            const allowedDist = Math.min(rawDist, inkRemainingRef.current);
            const ratio = allowedDist / rawDist;
            const finalX2 = x1 + (x2 - x1) * ratio;
            const finalY2 = y1 + (y2 - y1) * ratio;

            const dx = finalX2 - x1;
            const dy = finalY2 - y1;
            const len = Math.hypot(dx, dy);

            // Compute line normal pointing upward
            let nx = -dy / len;
            let ny = dx / len;
            if (ny > 0) {
              nx = -nx;
              ny = -ny;
            }

            const color = RAINBOW_COLORS[linesRef.current.length % RAINBOW_COLORS.length];

            linesRef.current.push({
              id: Date.now() + Math.random(),
              x1,
              y1,
              x2: finalX2,
              y2: finalY2,
              length: len,
              color,
              vibrationAmp: 0,
              vibrationPhase: 0,
              hitT: 0.5,
              normalX: nx,
              normalY: ny,
            });

            sound.playTap(700);

            // Deduct ink
            const newInk = Math.max(0, Math.round(inkRemainingRef.current - len));
            inkRemainingRef.current = newInk;
            setInkRemaining(newInk);
          }

          drawingStartRef.current = null;
          if (previewGfxRef.current) {
            previewGfxRef.current.clear();
          }
        };

        stage.on('pointerup', finishLine);
        stage.on('pointerupoutside', finishLine);

        // Strict Requirement: Use app.ticker.add((ticker) => ...) for the physics update loop
        app.ticker.add((ticker) => {
          const dt = Math.min(ticker.deltaTime, 2.0);

          // 1. Render all drawn trampoline lines (vibrating like a plucked string via quadraticCurveTo)
          if (linesGfxRef.current) {
            linesGfxRef.current.clear();

            linesRef.current.forEach((line) => {
              if (line.vibrationAmp > 0.4) {
                line.vibrationPhase += 0.45 * dt;
                line.vibrationAmp *= Math.pow(0.88, dt);

                const waveOffset = Math.sin(line.vibrationPhase) * line.vibrationAmp;
                const midX = line.x1 + (line.x2 - line.x1) * line.hitT;
                const midY = line.y1 + (line.y2 - line.y1) * line.hitT;

                const ctrlX = midX + line.normalX * waveOffset;
                const ctrlY = midY + line.normalY * waveOffset;

                // Modern PixiJS v8 quadraticCurveTo
                linesGfxRef.current!
                  .moveTo(line.x1, line.y1)
                  .quadraticCurveTo(ctrlX, ctrlY, line.x2, line.y2)
                  .stroke({ width: 7, color: line.color, cap: 'round' });
              } else {
                linesGfxRef.current!
                  .moveTo(line.x1, line.y1)
                  .lineTo(line.x2, line.y2)
                  .stroke({ width: 7, color: line.color, cap: 'round' });
              }
            });
          }

          // 2. Animate soap bubbles (bobbing gently upward)
          bubblesRef.current.forEach((b) => {
            if (!b.popped) {
              b.y -= 0.35 * dt;
              if (b.y < -40) {
                b.y = 560; // loop back from bottom
              }
              b.container.y = b.y + Math.sin(Date.now() * 0.003 + b.id) * 3;
            }
          });

          // 3. Physics update for the Jelly Character
          const jelly = jellyRef.current;
          if (jelly && !jelly.isWon) {
            // Lerp squash and stretch back to (1, 1)
            jelly.scaleX += (1.0 - jelly.scaleX) * 0.12 * dt;
            jelly.scaleY += (1.0 - jelly.scaleY) * 0.12 * dt;
            jelly.container.scale.set(jelly.scaleX, jelly.scaleY);

            // Shifting googly eyes toward velocity vector
            const speed = Math.hypot(jelly.vx, jelly.vy) || 1;
            const maxEyeOffset = 2.4;
            const eyeShiftX = (jelly.vx / speed) * maxEyeOffset;
            const eyeShiftY = (jelly.vy / speed) * maxEyeOffset;

            jelly.eyeLeft.x = -8 + eyeShiftX;
            jelly.eyeLeft.y = -5 + eyeShiftY;
            jelly.eyeRight.x = 8 + eyeShiftX;
            jelly.eyeRight.y = -5 + eyeShiftY;

            // Trapped in soap bubble behavior
            if (jelly.isTrapped && jelly.trappedBubble && !jelly.trappedBubble.popped) {
              jelly.x += (jelly.trappedBubble.x - jelly.x) * 0.1 * dt;
              jelly.y = jelly.trappedBubble.container.y;
              jelly.vx = 0;
              jelly.vy = 0;
            } else {
              // Free falling gravity physics
              jelly.vy += 0.35 * dt; // Gravity
              jelly.vx *= Math.pow(0.992, dt); // Air resistance

              // Terminal velocity clamp
              if (jelly.vy > 14) jelly.vy = 14;

              jelly.x += jelly.vx * dt;
              jelly.y += jelly.vy * dt;

              // Arena boundary collisions
              if (jelly.x < jelly.radius) {
                jelly.x = jelly.radius;
                jelly.vx = Math.abs(jelly.vx) * 0.8;
                sound.playBounce(0.5);
              } else if (jelly.x > 800 - jelly.radius) {
                jelly.x = 800 - jelly.radius;
                jelly.vx = -Math.abs(jelly.vx) * 0.8;
                sound.playBounce(0.5);
              }

              // Bottom abyss: auto respawn in pipe
              if (jelly.y > 580) {
                sound.playMismatch();
                jelly.x = LEVELS[currentLevelIdx].pipe.x;
                jelly.y = LEVELS[currentLevelIdx].pipe.y + 10;
                jelly.vx = 1.0;
                jelly.vy = 1.5;
              }

              // Obstacle collisions
              LEVELS[currentLevelIdx].obstacles.forEach((obs) => {
                const nearestX = Math.max(obs.x, Math.min(jelly.x, obs.x + obs.w));
                const nearestY = Math.max(obs.y, Math.min(jelly.y, obs.y + obs.h));
                const dx = jelly.x - nearestX;
                const dy = jelly.y - nearestY;
                const dist = Math.hypot(dx, dy);

                if (dist < jelly.radius) {
                  const overlap = jelly.radius - dist;
                  const nx = dist > 0.001 ? dx / dist : 0;
                  const ny = dist > 0.001 ? dy / dist : -1;

                  jelly.x += nx * overlap;
                  jelly.y += ny * overlap;

                  // Reflect velocity with slight damping
                  const dot = jelly.vx * nx + jelly.vy * ny;
                  if (dot < 0) {
                    jelly.vx = (jelly.vx - 1.8 * dot * nx) * 0.75;
                    jelly.vy = (jelly.vy - 1.8 * dot * ny) * 0.75;
                    sound.playBounce(Math.hypot(jelly.vx, jelly.vy) / 6);
                  }
                }
              });

              // Trampoline Lines Collision & Reflection
              linesRef.current.forEach((line) => {
                const lx = line.x2 - line.x1;
                const ly = line.y2 - line.y1;
                const lLenSq = lx * lx + ly * ly;
                if (lLenSq === 0) return;

                // Projection along line
                const t = Math.max(
                  0,
                  Math.min(1, ((jelly.x - line.x1) * lx + (jelly.y - line.y1) * ly) / lLenSq)
                );
                const projX = line.x1 + t * lx;
                const projY = line.y1 + t * ly;

                const distX = jelly.x - projX;
                const distY = jelly.y - projY;
                const dist = Math.hypot(distX, distY);

                if (dist < jelly.radius + 3) {
                  // Determine collision normal
                  let nx = dist > 0.001 ? distX / dist : line.normalX;
                  let ny = dist > 0.001 ? distY / dist : line.normalY;

                  // Relative velocity along normal
                  const vDotN = jelly.vx * nx + jelly.vy * ny;

                  if (vDotN < 0) {
                    // Reflection along the line's normal vector with bouncy multiplier
                    const restitution = 1.15; // Spring trampoline energy
                    jelly.vx = jelly.vx - (1 + restitution) * vDotN * nx;
                    jelly.vy = jelly.vy - (1 + restitution) * vDotN * ny;

                    // Ensure solid minimum bounce impulse
                    const totalSpeed = Math.hypot(jelly.vx, jelly.vy);
                    if (totalSpeed < 7.5) {
                      jelly.vx = nx * 8.0;
                      jelly.vy = ny * 8.0;
                    }

                    // Strict Requirement: Apply squash-and-stretch via jelly.scale.set(1.3, 0.7) that lerps back
                    jelly.scaleX = 1.35;
                    jelly.scaleY = 0.65;
                    jelly.container.scale.set(jelly.scaleX, jelly.scaleY);

                    // Strict Requirement: Animate line vibrating like a plucked string using quadraticCurveTo
                    line.vibrationAmp = 18;
                    line.vibrationPhase = 0;
                    line.hitT = t;

                    // Nudge outside line
                    jelly.x = projX + nx * (jelly.radius + 4);
                    jelly.y = projY + ny * (jelly.radius + 4);

                    // Strict Requirement: Synthesize pitch-scaling 'boing' sound
                    sound.playBoing(Math.min(3.5, totalSpeed / 4));
                  }
                }
              });

              // Soap Bubble Collision (Enters bubble)
              bubblesRef.current.forEach((b) => {
                if (!b.popped && !jelly.isTrapped) {
                  const bDist = Math.hypot(jelly.x - b.x, jelly.y - b.container.y);
                  if (bDist < jelly.radius + b.radius) {
                    jelly.isTrapped = true;
                    jelly.trappedBubble = b;
                    sound.playTap(880);
                  }
                }
              });

              // Collectible Stars Check
              starsRef.current.forEach((st) => {
                if (!st.collected) {
                  const dist = Math.hypot(jelly.x - st.x, jelly.y - st.y);
                  if (dist < jelly.radius + 18) {
                    st.collected = true;
                    st.container.visible = false;
                    const nextStars = starsRef.current.filter((s) => s.collected).length;
                    setStarsEarned(nextStars);
                    sound.playStarCollect(nextStars);
                  }
                }
              });

              // Candy Jar Goal Collision
              const jar = LEVELS[currentLevelIdx].candyJar;
              const jarDist = Math.hypot(jelly.x - jar.x, jelly.y - jar.y);
              if (jarDist < 35 && jelly.y > jar.y - 45) {
                // VICTORY!
                jelly.isWon = true;
                setLevelWon(true);
                onGameWinRef.current?.();
                sound.playWin();

                // Strict Requirement: Particle explosion of colorful confetti using a pool of PIXI.Graphics stars
                confettiPoolRef.current.forEach((p) => {
                  p.x = jar.x;
                  p.y = jar.y - 20;
                  const angle = Math.random() * Math.PI * 2;
                  const mag = 4 + Math.random() * 9;
                  p.vx = Math.cos(angle) * mag;
                  p.vy = Math.sin(angle) * mag - 4;
                  p.alpha = 1.0;
                  p.gfx.x = p.x;
                  p.gfx.y = p.y;
                  p.gfx.visible = true;
                });
              }
            }

            jelly.container.x = jelly.x;
            jelly.container.y = jelly.y;
          }

          // 4. Update Confetti Particles
          confettiPoolRef.current.forEach((p) => {
            if (p.gfx.visible) {
              p.vy += 0.25 * dt; // Gravity
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.rotation += p.rotSpeed * dt;
              p.alpha -= 0.009 * dt;

              p.gfx.x = p.x;
              p.gfx.y = p.y;
              p.gfx.rotation = p.rotation;
              p.gfx.alpha = Math.max(0, p.alpha);

              if (p.alpha <= 0) {
                p.gfx.visible = false;
              }
            }
          });
        });
      });

    return () => {
      isDestroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [currentLevelIdx, buildLevelScene]);

  const inkPercentage = Math.round((inkRemaining / currentLevel.maxInk) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top HUD: Level Selector, Rainbow Ink Bar, Actions */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Level Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    sound.playTap(520);
                    setCurrentLevelIdx(idx);
                    linesRef.current = [];
                    setInkRemaining(lvl.maxInk);
                    inkRemainingRef.current = lvl.maxInk;
                    setLevelWon(false);
                    setStarsEarned(0);
                    setIsJellyDropping(false);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    currentLevelIdx === idx
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl.id}
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-700 ml-1">{currentLevel.name}</span>
          </div>

          {/* Stars Collected Indicator */}
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span className="text-xs text-amber-800 font-bold">Stars:</span>
            <div className="flex items-center text-lg">
              <span className={starsEarned >= 1 ? 'opacity-100' : 'opacity-25'}>⭐</span>
              <span className={starsEarned >= 2 ? 'opacity-100' : 'opacity-25'}>⭐</span>
              <span className={starsEarned >= 3 ? 'opacity-100' : 'opacity-25'}>⭐</span>
            </div>
          </div>

          {/* Tool buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={clearLines}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Lines</span>
            </button>
            <button
              onClick={resetLevel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
            <button
              onClick={dropJelly}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Drop Jelly!</span>
            </button>
          </div>
        </div>

        {/* Visual 'Rainbow Ink' Bar (Strict Requirement) */}
        <div className="w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Rainbow Ink:</span>
          </div>
          <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${inkPercentage}%`,
                background:
                  'linear-gradient(90deg, #ff598f 0%, #fd8a5e 25%, #f4d35e 50%, #2ec4b6 75%, #38bdf8 100%)',
              }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 w-12 text-right">
            {inkPercentage}%
          </span>
        </div>
      </div>

      {/* Main PixiJS Canvas Viewport */}
      <div className="relative w-full flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-[340px] h-[240px] sm:w-[800px] sm:h-[560px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-[#1a1a2e] relative cursor-crosshair"
          style={{ touchAction: 'none' }}
        />

        {/* Victory Celebration Overlay Banner */}
        {levelWon && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 rounded-3xl animate-in fade-in zoom-in-95 duration-200 z-30">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border-2 border-rose-300">
              <div className="w-16 h-16 mx-auto mb-3 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                🍬
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                Sweet Victory!
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                The cute jelly reached the candy jar safe and sound!
              </p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 text-3xl mb-6">
                <span className={starsEarned >= 1 ? 'opacity-100 animate-bounce' : 'opacity-25'}>⭐</span>
                <span className={starsEarned >= 2 ? 'opacity-100 animate-bounce' : 'opacity-25'}>⭐</span>
                <span className={starsEarned >= 3 ? 'opacity-100 animate-bounce' : 'opacity-25'}>⭐</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetLevel}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Replay
                </button>
                <button
                  onClick={nextLevel}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <span>{currentLevelIdx < LEVELS.length - 1 ? 'Next Level' : 'Play Again'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Level Hint Box */}
      <div className="w-full max-w-2xl mt-4 px-4 py-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <p>
          <strong>Lab Hint:</strong> {currentLevel.hint}
        </p>
      </div>
    </div>
  );
};
