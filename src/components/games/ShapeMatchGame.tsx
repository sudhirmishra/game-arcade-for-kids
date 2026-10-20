import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle, Circle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { sound } from '../../sound/soundEffects';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Award,
} from 'lucide-react';

interface ShapeMatchGameProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

interface ShapeDefinition {
  id: string;
  name: string;
  color: number;
  spawnPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  draw: (gfx: Graphics, isShadow: boolean) => void;
}

interface LevelPack {
  levelNumber: number;
  title: string;
  subtitle: string;
  shapes: ShapeDefinition[];
}

const LEVEL_PACKS: LevelPack[] = [
  {
    levelNumber: 1,
    title: 'Playground Trio',
    subtitle: 'Classic Circle, Square & Triangle',
    shapes: [
      {
        id: 'circle',
        name: 'Circle',
        color: 0xff4757, // Coral Red
        spawnPos: { x: 140, y: 130 },
        targetPos: { x: 520, y: 130 },
        draw: (gfx, isShadow) => {
          const r = 42;
          if (isShadow) {
            gfx
              .circle(0, 0, r)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .circle(0, 0, r)
              .fill({ color: 0xff4757 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-14, -14, 10).fill({ color: 0xffffff, alpha: 0.25 });
          }
        },
      },
      {
        id: 'square',
        name: 'Square',
        color: 0x2ed573, // Emerald Green
        spawnPos: { x: 280, y: 250 },
        targetPos: { x: 680, y: 230 },
        draw: (gfx, isShadow) => {
          const s = 80;
          const r = 16;
          if (isShadow) {
            gfx
              .roundRect(-s / 2, -s / 2, s, s, r)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .roundRect(-s / 2, -s / 2, s, s, r)
              .fill({ color: 0x2ed573 })
              .stroke({ width: 3, color: 0xffffff });
            gfx
              .roundRect(-s / 2 + 10, -s / 2 + 8, s - 20, 12, 6)
              .fill({ color: 0xffffff, alpha: 0.22 });
          }
        },
      },
      {
        id: 'triangle',
        name: 'Triangle',
        color: 0x1e90ff, // Ocean Blue
        spawnPos: { x: 140, y: 350 },
        targetPos: { x: 520, y: 320 },
        draw: (gfx, isShadow) => {
          const pts = [0, -45, 45, 36, -45, 36];
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0x1e90ff })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(0, 10, 8).fill({ color: 0xffffff, alpha: 0.25 });
          }
        },
      },
    ],
  },
  {
    levelNumber: 2,
    title: 'Cosmic Wonders',
    subtitle: 'Golden Star, Diamond, Hexagon & Oval',
    shapes: [
      {
        id: 'star',
        name: 'Star',
        color: 0xffa502, // Golden Yellow
        spawnPos: { x: 130, y: 110 },
        targetPos: { x: 510, y: 110 },
        draw: (gfx, isShadow) => {
          // 5-point star
          const points: number[] = [];
          const numPts = 5;
          const outerR = 46;
          const innerR = 22;
          for (let i = 0; i < numPts * 2; i++) {
            const angle = (i * Math.PI) / numPts - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            points.push(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          if (isShadow) {
            gfx
              .poly(points)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(points)
              .fill({ color: 0xffa502 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-10, -12, 7).fill({ color: 0xffffff, alpha: 0.3 });
          }
        },
      },
      {
        id: 'diamond',
        name: 'Diamond',
        color: 0xff6b81, // Rose Pink
        spawnPos: { x: 270, y: 160 },
        targetPos: { x: 670, y: 140 },
        draw: (gfx, isShadow) => {
          const pts = [0, -46, 40, 0, 0, 46, -40, 0];
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0xff6b81 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-10, -8, 6).fill({ color: 0xffffff, alpha: 0.25 });
          }
        },
      },
      {
        id: 'hexagon',
        name: 'Hexagon',
        color: 0x9b59b6, // Amethyst Purple
        spawnPos: { x: 130, y: 290 },
        targetPos: { x: 510, y: 280 },
        draw: (gfx, isShadow) => {
          const pts: number[] = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            pts.push(Math.cos(angle) * 42, Math.sin(angle) * 42);
          }
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0x9b59b6 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-12, -10, 8).fill({ color: 0xffffff, alpha: 0.25 });
          }
        },
      },
      {
        id: 'oval',
        name: 'Oval',
        color: 0x00d2d3, // Mint Turquoise
        spawnPos: { x: 270, y: 340 },
        targetPos: { x: 670, y: 310 },
        draw: (gfx, isShadow) => {
          if (isShadow) {
            gfx
              .ellipse(0, 0, 48, 30)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .ellipse(0, 0, 48, 30)
              .fill({ color: 0x00d2d3 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.ellipse(-12, -8, 14, 8).fill({ color: 0xffffff, alpha: 0.28 });
          }
        },
      },
    ],
  },
  {
    levelNumber: 3,
    title: 'Master Mosaic',
    subtitle: 'Pentagon, Heart & Crescent Moon',
    shapes: [
      {
        id: 'pentagon',
        name: 'Pentagon',
        color: 0x34495e, // Indigo Slate
        spawnPos: { x: 140, y: 120 },
        targetPos: { x: 530, y: 110 },
        draw: (gfx, isShadow) => {
          const pts: number[] = [];
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            pts.push(Math.cos(angle) * 44, Math.sin(angle) * 44);
          }
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0x546de5 })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-10, -12, 7).fill({ color: 0xffffff, alpha: 0.25 });
          }
        },
      },
      {
        id: 'heart',
        name: 'Heart',
        color: 0xe056fd, // Pink Passion
        spawnPos: { x: 270, y: 220 },
        targetPos: { x: 670, y: 200 },
        draw: (gfx, isShadow) => {
          const pts: number[] = [];
          for (let t = 0; t < Math.PI * 2; t += 0.12) {
            const x = 2.4 * (16 * Math.pow(Math.sin(t), 3));
            const y = -2.4 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            pts.push(x, y);
          }
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0xe056fd })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-10, -10, 6).fill({ color: 0xffffff, alpha: 0.3 });
          }
        },
      },
      {
        id: 'crescent',
        name: 'Crescent Moon',
        color: 0xf1c40f, // Bright Lemon
        spawnPos: { x: 140, y: 340 },
        targetPos: { x: 530, y: 310 },
        draw: (gfx, isShadow) => {
          const pts: number[] = [];
          const outerR = 42;
          const innerR = 34;
          const shiftX = 14;
          const shiftY = -4;
          for (let a = -Math.PI * 0.72; a <= Math.PI * 0.72; a += 0.12) {
            pts.push(Math.cos(a) * outerR, Math.sin(a) * outerR);
          }
          for (let a = Math.PI * 0.72; a >= -Math.PI * 0.72; a -= 0.12) {
            pts.push(shiftX + Math.cos(a) * innerR, shiftY + Math.sin(a) * innerR);
          }
          if (isShadow) {
            gfx
              .poly(pts)
              .fill({ color: 0x0a0a14, alpha: 0.65 })
              .stroke({ width: 3, color: 0x3d4461, alpha: 0.8 });
          } else {
            gfx
              .poly(pts)
              .fill({ color: 0xf1c40f })
              .stroke({ width: 3, color: 0xffffff });
            gfx.circle(-12, -8, 6).fill({ color: 0xffffff, alpha: 0.3 });
          }
        },
      },
    ],
  },
];

export const ShapeMatchGame: React.FC<ShapeMatchGameProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const triggerHintRef = useRef<(() => void) | null>(null);

  // Keep callback props in stable refs so they NEVER cause canvas unmount / teardown
  const onGamePlayRef = useRef(onGamePlay);
  onGamePlayRef.current = onGamePlay;
  const onGameWinRef = useRef(onGameWin);
  onGameWinRef.current = onGameWin;
  const hasTriggeredPlayRef = useRef(false);

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [hintActive, setHintActive] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);

  const level = LEVEL_PACKS[currentLevelIndex];
  const totalInLevel = level.shapes.length;

  const resetCurrentLevel = useCallback(() => {
    sound.playTap(480);
    hasTriggeredPlayRef.current = false;
    setMatchedCount(0);
    setIsLevelComplete(false);
    setHintActive(false);
    setResetKey((k) => k + 1);
  }, []);

  const changeLevel = useCallback((newIdx: number) => {
    sound.playTap(540);
    hasTriggeredPlayRef.current = false;
    setCurrentLevelIndex(newIdx);
    setMatchedCount(0);
    setIsLevelComplete(false);
    setHintActive(false);
    setResetKey((k) => k + 1);
  }, []);

  const showHint = () => {
    sound.playTap(700);
    setHintActive(true);
    triggerHintRef.current?.();
    setTimeout(() => setHintActive(false), 2400);
  };

  // Build and mount PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    const stageWidth = 800;
    const stageHeight = 460;
    const SNAP_DISTANCE = 95;

    const app = new Application();
    appRef.current = app;

    let cleanupWindowListener: (() => void) | null = null;

    app
      .init({
        width: stageWidth,
        height: stageHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0x141424,
        antialias: true,
      })
      .then(() => {
        if (isDestroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';

        // Responsive canvas display
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
        app.canvas.style.display = 'block';
        app.canvas.style.touchAction = 'none';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.eventMode = 'static';
        stage.hitArea = app.screen;

        // Background card plate on target side
        const bgPlate = new Graphics();
        bgPlate
          .roundRect(430, 40, 340, 380, 24)
          .fill({ color: 0x1a1a2e, alpha: 0.85 })
          .stroke({ width: 2, color: 0x2e2e4a });

        // Middle separator guide line
        bgPlate
          .moveTo(400, 40)
          .lineTo(400, 420)
          .stroke({ width: 2, color: 0x2e2e4a, alpha: 0.6 });

        stage.addChild(bgPlate);

        // Header labels on canvas
        const labelStyle = new TextStyle({
          fontFamily: 'Outfit, sans-serif',
          fontSize: 12,
          fontWeight: 'bold',
          fill: 0x64748b,
          letterSpacing: 1,
        });

        const leftLabel = new Text({ text: 'DRAGGABLE PIECES', style: labelStyle });
        leftLabel.position.set(130, 20);
        stage.addChild(leftLabel);

        const rightLabel = new Text({ text: 'MATCHING SHADOW SLOTS', style: labelStyle });
        rightLabel.position.set(500, 20);
        stage.addChild(rightLabel);

        // Containers for layer organization
        const shadowsContainer = new Container();
        const draggablesContainer = new Container();
        const feedbackContainer = new Container();

        stage.addChild(shadowsContainer);
        stage.addChild(draggablesContainer);
        stage.addChild(feedbackContainer);

        interface ShadowItem {
          id: string;
          container: Container;
          haloGfx: Graphics;
          x: number;
          y: number;
        }

        interface DraggableItem {
          id: string;
          name: string;
          container: Container;
          initialX: number;
          initialY: number;
          matched: boolean;
          isReturning: boolean;
        }

        const shadows: ShadowItem[] = [];
        const draggables: DraggableItem[] = [];

        // 1. Create Shadows
        level.shapes.forEach((cfg) => {
          const sCont = new Container();
          sCont.position.set(cfg.targetPos.x, cfg.targetPos.y);

          const halo = new Graphics();
          halo.circle(0, 0, 58).fill({ color: 0x22c55e, alpha: 0 }); // Hidden initially
          sCont.addChild(halo);

          const sGfx = new Graphics();
          cfg.draw(sGfx, true);
          sCont.addChild(sGfx);

          shadowsContainer.addChild(sCont);
          shadows.push({
            id: cfg.id,
            container: sCont,
            haloGfx: halo,
            x: cfg.targetPos.x,
            y: cfg.targetPos.y,
          });
        });

        // 2. Create Draggables
        let activeDrag: DraggableItem | null = null;
        let dragOffset = { x: 0, y: 0 };
        let matchedSoFar = 0;

        level.shapes.forEach((cfg) => {
          const dCont = new Container();
          dCont.position.set(cfg.spawnPos.x, cfg.spawnPos.y);

          const dGfx = new Graphics();
          cfg.draw(dGfx, false);
          dCont.addChild(dGfx);

          // Generous hitArea so taps never miss thin borders or complex contours
          dCont.hitArea = new Circle(0, 0, 52);
          dCont.eventMode = 'static';
          dCont.cursor = 'grab';

          const item: DraggableItem = {
            id: cfg.id,
            name: cfg.name,
            container: dCont,
            initialX: cfg.spawnPos.x,
            initialY: cfg.spawnPos.y,
            matched: false,
            isReturning: false,
          };

          dCont.on('pointerdown', (e) => {
            if (item.matched || item.isReturning) return;
            if (!hasTriggeredPlayRef.current) {
              hasTriggeredPlayRef.current = true;
              onGamePlayRef.current?.();
            }

            activeDrag = item;
            dCont.cursor = 'grabbing';
            draggablesContainer.setChildIndex(dCont, draggablesContainer.children.length - 1);
            dCont.scale.set(1.15);

            sound.playTap(620);

            // In PixiJS v8, e.global gives canvas coordinates directly
            const pointerX = e.global.x;
            const pointerY = e.global.y;
            dragOffset.x = pointerX - dCont.x;
            dragOffset.y = pointerY - dCont.y;
          });

          draggablesContainer.addChild(dCont);
          draggables.push(item);
        });

        // Drag movement updater
        const updateDragPosition = (stageX: number, stageY: number) => {
          if (!activeDrag) return;

          activeDrag.container.x = stageX - dragOffset.x;
          activeDrag.container.y = stageY - dragOffset.y;

          // Proximity magnet effect on matching shadow
          shadows.forEach((s) => {
            const isTarget = s.id === activeDrag!.id;
            const dist = Math.hypot(
              activeDrag!.container.x - s.x,
              activeDrag!.container.y - s.y
            );

            if (isTarget) {
              if (dist < SNAP_DISTANCE) {
                s.container.scale.set(1.12);
                s.haloGfx.alpha = 0.75;
              } else if (dist < 140) {
                s.container.scale.set(1.05);
                s.haloGfx.alpha = 0.35;
              } else {
                s.container.scale.set(1.0);
                s.haloGfx.alpha = 0;
              }
            }
          });
        };

        // Pointer move on Pixi canvas
        stage.on('pointermove', (e) => {
          if (!activeDrag) return;
          updateDragPosition(e.global.x, e.global.y);
        });

        stage.on('globalpointermove', (e) => {
          if (!activeDrag) return;
          updateDragPosition(e.global.x, e.global.y);
        });

        // Window pointermove for bulletproof tracking even outside the canvas element
        const onWindowPointerMove = (e: PointerEvent) => {
          if (!activeDrag || !app.canvas) return;
          const rect = app.canvas.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const stageX = (e.clientX - rect.left) * (stageWidth / rect.width);
          const stageY = (e.clientY - rect.top) * (stageHeight / rect.height);
          updateDragPosition(stageX, stageY);
        };
        window.addEventListener('pointermove', onWindowPointerMove);

        // Pointer up: snap check
        const onPointerUp = () => {
          if (!activeDrag) return;

          const item = activeDrag;
          activeDrag = null;

          item.container.cursor = 'grab';
          item.container.scale.set(1.0);

          // Reset all shadow hover scales
          shadows.forEach((s) => {
            s.container.scale.set(1.0);
            s.haloGfx.alpha = 0;
          });

          const shadow = shadows.find((s) => s.id === item.id);
          const dist = shadow
            ? Math.hypot(item.container.x - shadow.x, item.container.y - shadow.y)
            : 9999;

          if (shadow && dist <= SNAP_DISTANCE) {
            // SNAP SUCCESS!
            item.matched = true;
            item.container.x = shadow.x;
            item.container.y = shadow.y;
            item.container.cursor = 'default';
            item.container.eventMode = 'none';

            // Audio pop & fanfare
            sound.playBubblePop();
            sound.playStarCollect(matchedSoFar);

            // Visual 1: Pulsing bounce scale
            let tick = 0;
            const pulse = (ticker: { deltaTime: number }) => {
              tick += 0.22 * ticker.deltaTime;
              item.container.scale.set(1 + Math.sin(tick) * 0.18);
              if (tick >= Math.PI) {
                item.container.scale.set(1.0);
                app.ticker.remove(pulse);
              }
            };
            app.ticker.add(pulse);

            // Visual 2: Halo illumination
            shadow.haloGfx.alpha = 0.55;

            // Visual 3: Floating text
            spawnFloatingText(item.container.x, item.container.y - 48, `✓ ${item.name}!`);

            matchedSoFar++;
            setMatchedCount(matchedSoFar);
            setScore((s) => s + 150);

            if (matchedSoFar === level.shapes.length) {
              // LEVEL COMPLETE!
              setIsLevelComplete(true);
              sound.playWin();
              onGameWinRef.current?.();
              confetti({
                particleCount: 75,
                spread: 60,
                origin: { y: 0.6 },
              });
            }
            return;
          }

          // Check if dropped near a wrong shadow for friendly helper feedback
          const wrongShadow = shadows.find((s) => {
            if (s.id === item.id) return false;
            return Math.hypot(item.container.x - s.x, item.container.y - s.y) <= SNAP_DISTANCE;
          });

          if (wrongShadow) {
            sound.playTap(260);
            spawnFloatingText(item.container.x, item.container.y - 40, `Not quite!`);
          } else {
            sound.playTap(380);
          }

          // Smooth cubic ease-out return animation
          item.isReturning = true;
          item.container.cursor = 'not-allowed';

          let returnElapsed = 0;
          const startX = item.container.x;
          const startY = item.container.y;
          const returnTicker = (ticker: { deltaTime: number }) => {
            returnElapsed += 0.08 * ticker.deltaTime;
            const t = Math.min(1, returnElapsed);
            const ease = 1 - Math.pow(1 - t, 3);
            item.container.x = startX + (item.initialX - startX) * ease;
            item.container.y = startY + (item.initialY - startY) * ease;

            if (t >= 1) {
              item.container.x = item.initialX;
              item.container.y = item.initialY;
              item.isReturning = false;
              item.container.cursor = 'grab';
              app.ticker.remove(returnTicker);
            }
          };
          app.ticker.add(returnTicker);
        };

        stage.on('pointerup', onPointerUp);
        stage.on('pointerupoutside', onPointerUp);

        // Window listener ensures mouseup outside canvas still ends drag cleanly
        window.addEventListener('pointerup', onPointerUp);
        cleanupWindowListener = () => {
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointermove', onWindowPointerMove);
        };

        // Hint trigger handler
        triggerHintRef.current = () => {
          const unmatched = draggables.filter((d) => !d.matched);
          unmatched.forEach((d) => {
            const sh = shadows.find((s) => s.id === d.id);
            if (sh) {
              sh.haloGfx.alpha = 0.65;
              let elapsed = 0;
              const hintPulse = (ticker: { deltaTime: number }) => {
                elapsed += 0.08 * ticker.deltaTime;
                sh.container.scale.set(1 + Math.sin(elapsed * 4) * 0.08);
                if (elapsed >= Math.PI * 1.5) {
                  sh.container.scale.set(1.0);
                  sh.haloGfx.alpha = 0;
                  app.ticker.remove(hintPulse);
                }
              };
              app.ticker.add(hintPulse);
            }
          });
        };

        // Floating feedback text helper
        function spawnFloatingText(x: number, y: number, text: string) {
          const txt = new Text({
            text,
            style: new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 16,
              fontWeight: 'bold',
              fill: 0x55efc4,
              dropShadow: {
                alpha: 0.6,
                blur: 4,
                distance: 2,
                color: 0x000000,
              },
            }),
          });
          txt.anchor.set(0.5);
          txt.position.set(x, y);
          feedbackContainer.addChild(txt);

          let elapsed = 0;
          const anim = (ticker: { deltaTime: number }) => {
            elapsed += 0.05 * ticker.deltaTime;
            txt.y -= 1.2 * ticker.deltaTime;
            txt.alpha = Math.max(0, 1 - elapsed);
            if (txt.alpha <= 0) {
              feedbackContainer.removeChild(txt);
              txt.destroy();
              app.ticker.remove(anim);
            }
          };
          app.ticker.add(anim);
        }
      });

    return () => {
      isDestroyed = true;
      if (cleanupWindowListener) {
        cleanupWindowListener();
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [currentLevelIndex, resetKey]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Status & Controls Bar */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Level Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {LEVEL_PACKS.map((pack, idx) => (
            <button
              key={pack.levelNumber}
              onClick={() => changeLevel(idx)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                idx === currentLevelIndex
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pack {pack.levelNumber}: {pack.title}
            </button>
          ))}
        </div>

        {/* Level Progress & Score */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Progress:</span>
            <span className="font-mono font-bold text-slate-900">
              {matchedCount} / {totalInLevel}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Score:</span>
            <span className="font-mono font-bold text-slate-900">{score}</span>
          </div>

          <button
            onClick={showHint}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold border border-amber-200 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint</span>
          </button>

          <button
            onClick={resetCurrentLevel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main PixiJS Viewport */}
      <div className="relative w-full flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-full max-w-[800px] aspect-[800/460] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-[#141424] relative cursor-pointer"
          style={{ touchAction: 'none' }}
        />

        {/* Level Complete Overlay */}
        {isLevelComplete && (
          <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-3xl mb-3 border border-purple-400/30">
              🎉
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              All Shapes Snapped!
            </h2>
            <p className="text-slate-300 text-sm max-w-sm mb-6">
              You matched every shape in <strong>{level.title}</strong> perfectly!
            </p>
            <div className="flex items-center gap-3">
              {currentLevelIndex < LEVEL_PACKS.length - 1 ? (
                <button
                  onClick={() => changeLevel(currentLevelIndex + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <span>Next Pack</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => changeLevel(0)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  <span>Play Again (Pack 1)</span>
                </button>
              )}
              <button
                onClick={resetCurrentLevel}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20 text-sm"
              >
                Replay Level
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions & Guide */}
      <div className="w-full max-w-2xl mt-4 px-4 py-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div>
          <span className="font-bold text-slate-800">🖐️ How to Play:</span>
          <span className="ml-1 text-slate-600">
            Click and drag each shape on the left onto its matching dark silhouette on the right. Release to snap it into place!
          </span>
        </div>
        {hintActive && (
          <div className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
            Hint: Match by shape geometry!
          </div>
        )}
      </div>
    </div>
  );
};
