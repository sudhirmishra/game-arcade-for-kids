import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle, TilingSprite } from 'pixi.js';
import { sound } from '../../sound/soundEffects';
import { RotateCcw, Sparkles, Trophy, Zap, Play, Volume2, VolumeX, Flame } from 'lucide-react';

interface ChameleonColorDashProps {
  onGameWin?: () => void;
  onGamePlay?: () => void;
}

// 6 Game Colors
const COLORS = {
  RED: 0xff3366,
  YELLOW: 0xffdd00,
  BLUE: 0x3399ff,
  ORANGE: 0xff8800, // Red + Yellow
  GREEN: 0x22cc66,  // Yellow + Blue
  PURPLE: 0xaa33ff, // Red + Blue
  WHITE: 0xffffff,
};

interface VineSegment {
  container: Container;
  bodyGfx: Graphics;
  x: number;
  y: number;
  width: number;
  colorName: string;
  tint: number;
  checked: boolean;
}

interface PaintParticle {
  container: Container;
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  active: boolean;
}

interface StarParticle {
  container: Container;
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  rotation: number;
  active: boolean;
}

interface RainbowBug {
  container: Container;
  bodyGfx: Graphics;
  wingLeft: Graphics;
  wingRight: Graphics;
  x: number;
  y: number;
  baseY: number;
  active: boolean;
}

export const ChameleonColorDashGame: React.FC<ChameleonColorDashProps> = ({ onGameWin, onGamePlay }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Score HUD states
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wonderpix_chameleon_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [combo, setCombo] = useState<number>(1);
  const [discoSecondsLeft, setDiscoSecondsLeft] = useState<number>(0);
  const [currentChameleonColorName, setCurrentChameleonColorName] = useState<string>('Red');

  // Input states
  const activePrimaryKeysRef = useRef<{ red: boolean; yellow: boolean; blue: boolean }>({
    red: false,
    yellow: false,
    blue: false,
  });
  const lastPressTimeRef = useRef<{ red: number; yellow: number; blue: number }>({
    red: 0,
    yellow: 0,
    blue: 0,
  });

  // Game Engine & Simulation refs
  const chameleonRef = useRef<{
    container: Container;
    bodyGfx: Graphics;
    dizzyGfx: Graphics;
    eyeWhite: Graphics;
    pupil: Graphics;
    legsGfx: Graphics;
    tailGfx: Graphics;
    currentTint: number;
    isDizzy: boolean;
    dizzyTimer: number;
    walkAnim: number;
  } | null>(null);

  const vinesRef = useRef<VineSegment[]>([]);
  const rainbowBugsRef = useRef<RainbowBug[]>([]);
  const paintParticlesRef = useRef<PaintParticle[]>([]);
  const starParticlesRef = useRef<StarParticle[]>([]);
  const splatScreenOverlayRef = useRef<Graphics | null>(null);

  const baseSpeedRef = useRef<number>(4.2);
  const speedMultiplierRef = useRef<number>(1.0);
  const discoTimerRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(1);
  const rainbowHueRef = useRef<number>(0);

  // Color resolution based on active buttons / recent tap window (250ms)
  const resolveCurrentTint = useCallback((): { tint: number; name: string } => {
    const keys = activePrimaryKeysRef.current;
    const now = Date.now();
    const buffer = 250;

    const rActive = keys.red || (now - lastPressTimeRef.current.red < buffer);
    const yActive = keys.yellow || (now - lastPressTimeRef.current.yellow < buffer);
    const bActive = keys.blue || (now - lastPressTimeRef.current.blue < buffer);

    const count = (rActive ? 1 : 0) + (yActive ? 1 : 0) + (bActive ? 1 : 0);

    if (count >= 2) {
      if (rActive && yActive) return { tint: COLORS.ORANGE, name: 'Orange (Red + Yellow)' };
      if (yActive && bActive) return { tint: COLORS.GREEN, name: 'Green (Yellow + Blue)' };
      if (rActive && bActive) return { tint: COLORS.PURPLE, name: 'Purple (Red + Blue)' };
    }

    if (rActive) return { tint: COLORS.RED, name: 'Red' };
    if (yActive) return { tint: COLORS.YELLOW, name: 'Yellow' };
    if (bActive) return { tint: COLORS.BLUE, name: 'Blue' };

    // Default red
    return { tint: COLORS.RED, name: 'Red' };
  }, []);

  // Update Chameleon tint and spawn paint burst
  const applyColorState = useCallback(() => {
    if (!chameleonRef.current) return;

    if (discoTimerRef.current > 0) return; // Disco Mode overrides

    const { tint, name } = resolveCurrentTint();
    if (chameleonRef.current.currentTint !== tint) {
      chameleonRef.current.currentTint = tint;
      chameleonRef.current.bodyGfx.tint = tint;
      chameleonRef.current.tailGfx.tint = tint;
      chameleonRef.current.legsGfx.tint = tint;
      setCurrentChameleonColorName(name);

      // Play color mix sound if it's a secondary mix
      if (tint === COLORS.ORANGE || tint === COLORS.GREEN || tint === COLORS.PURPLE) {
        sound.playColorMix();
        // Burst paint splatter particles
        spawnPaintSplatter(140, 360, tint);
      } else {
        sound.playTap(680);
      }
    }
  }, [resolveCurrentTint]);

  // Spawn paint splatter particles
  const spawnPaintSplatter = (x: number, y: number, color: number) => {
    let spawned = 0;
    paintParticlesRef.current.forEach((p) => {
      if (!p.active && spawned < 14) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.alpha = 1.0;
        p.scale = 0.6 + Math.random() * 0.8;
        p.gfx.tint = color;
        p.container.visible = true;
        spawned++;
      }
    });
  };

  // Spawn star particles on match
  const spawnStarParticles = (x: number, y: number) => {
    let spawned = 0;
    starParticlesRef.current.forEach((st) => {
      if (!st.active && spawned < 8) {
        st.active = true;
        st.x = x;
        st.y = y;
        st.vx = -1.5 + (Math.random() - 0.5) * 3;
        st.vy = -3 - Math.random() * 3;
        st.alpha = 1.0;
        st.rotation = Math.random() * Math.PI;
        st.container.visible = true;
        spawned++;
      }
    });
  };

  // Trigger Splat Mismatch (Kid-Friendly: no game over)
  const triggerMismatch = (vineColorName: string) => {
    sound.playSplat();
    comboRef.current = 1;
    setCombo(1);
    speedMultiplierRef.current = Math.max(1.0, speedMultiplierRef.current * 0.85);

    if (chameleonRef.current) {
      chameleonRef.current.isDizzy = true;
      chameleonRef.current.dizzyTimer = 45; // ~0.75 seconds of dizzy eyes
      chameleonRef.current.dizzyGfx.visible = true;
      chameleonRef.current.pupil.visible = false;
    }

    // Splat overlay animation
    if (splatScreenOverlayRef.current) {
      splatScreenOverlayRef.current.alpha = 0.75;
      splatScreenOverlayRef.current.visible = true;
    }
  };

  // Button Input Handlers
  const pressButton = (color: 'red' | 'yellow' | 'blue') => {
    onGamePlay?.();
    activePrimaryKeysRef.current[color] = true;
    lastPressTimeRef.current[color] = Date.now();
    applyColorState();
  };

  const releaseButton = (color: 'red' | 'yellow' | 'blue') => {
    activePrimaryKeysRef.current[color] = false;
    applyColorState();
  };

  // Reset Game
  const resetGame = () => {
    sound.playTap(440);
    scoreRef.current = 0;
    setScore(0);
    comboRef.current = 1;
    setCombo(1);
    speedMultiplierRef.current = 1.0;
    discoTimerRef.current = 0;
    setDiscoSecondsLeft(0);

    // Reset vines
    vinesRef.current.forEach((v, idx) => {
      v.x = 80 + idx * 260;
      v.checked = false;
    });

    if (chameleonRef.current) {
      chameleonRef.current.isDizzy = false;
      chameleonRef.current.dizzyTimer = 0;
      chameleonRef.current.dizzyGfx.visible = false;
      chameleonRef.current.pupil.visible = true;
      chameleonRef.current.currentTint = COLORS.RED;
      chameleonRef.current.bodyGfx.tint = COLORS.RED;
      chameleonRef.current.tailGfx.tint = COLORS.RED;
      chameleonRef.current.legsGfx.tint = COLORS.RED;
      setCurrentChameleonColorName('Red');
    }
  };

  // Keyboard Event Handlers (1/2/3 and A/S/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') pressButton('red');
      else if (key === '2' || key === 's') pressButton('yellow');
      else if (key === '3' || key === 'd') pressButton('blue');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') releaseButton('red');
      else if (key === '2' || key === 's') releaseButton('yellow');
      else if (key === '3' || key === 'd') releaseButton('blue');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [applyColorState]);

  // Main PixiJS v8 Application Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;
    const stageWidth = 800;
    const stageHeight = 540;

    const app = new Application();
    appRef.current = app;

    // Strict Requirement: Initialize asynchronously with backgroundColor 0x112233
    app
      .init({
        width: stageWidth,
        height: stageHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        backgroundColor: 0x112233,
        antialias: true,
      })
      .then(() => {
        if (isDestroyed || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas);

        const stage = app.stage;
        stage.eventMode = 'static';
        stage.hitArea = app.screen;

        // -------------------------------------------------------------
        // Strict Requirement: Generate procedural textures via
        // app.renderer.generateTexture() for multi-layered TilingSprite
        // -------------------------------------------------------------

        // 1. Layer 1: Distant Misty Jungle Canopy (Slow)
        const bgFarGfx = new Graphics();
        bgFarGfx.rect(0, 0, 400, stageHeight).fill({ color: 0x0f2b38 });
        // Mountain & distant trees silhouettes
        bgFarGfx
          .poly([0, 260, 100, 180, 220, 270, 310, 190, 400, 260, 400, 540, 0, 540])
          .fill({ color: 0x0a1d26 });
        const bgFarTexture = app.renderer.generateTexture(bgFarGfx);
        const bgFarTile = new TilingSprite({
          texture: bgFarTexture,
          width: stageWidth,
          height: stageHeight,
        });
        stage.addChild(bgFarTile);

        // 2. Layer 2: Midground Jungle Trees & Lianas (Medium)
        const bgMidGfx = new Graphics();
        bgMidGfx.rect(0, 0, 400, stageHeight).fill({ color: 0x000000, alpha: 0 }); // Transparent base
        // Jungle tree trunks & foliage arches
        bgMidGfx
          .rect(60, 80, 28, 460).fill({ color: 0x093322 })
          .circle(74, 100, 50).fill({ color: 0x0e4730 })
          .rect(260, 120, 32, 420).fill({ color: 0x093322 })
          .circle(276, 130, 60).fill({ color: 0x0e4730 })
          .roundRect(140, 20, 120, 14, 6).fill({ color: 0x0a3b27 });
        const bgMidTexture = app.renderer.generateTexture(bgMidGfx);
        const bgMidTile = new TilingSprite({
          texture: bgMidTexture,
          width: stageWidth,
          height: stageHeight,
        });
        stage.addChild(bgMidTile);

        // 3. Ground / Canopy Branch Layer (Vines Container)
        const vinesContainer = new Container();
        stage.addChild(vinesContainer);

        // Spawn 6 initial vine segments with distinct colors
        const colorPalette = [
          { name: 'Red', tint: COLORS.RED },
          { name: 'Yellow', tint: COLORS.YELLOW },
          { name: 'Blue', tint: COLORS.BLUE },
          { name: 'Orange', tint: COLORS.ORANGE },
          { name: 'Green', tint: COLORS.GREEN },
          { name: 'Purple', tint: COLORS.PURPLE },
        ];

        vinesRef.current = [];
        for (let i = 0; i < 5; i++) {
          const colInfo = colorPalette[i % colorPalette.length];
          const vContainer = new Container();
          vContainer.x = 80 + i * 260;
          vContainer.y = 380;

          // Strict Requirement: Draw body/vine in neutral white (0xFFFFFF) so tint switches instantaneously
          const vGfx = new Graphics();
          vGfx
            .roundRect(0, 0, 220, 16, 8)
            .fill({ color: 0xffffff })
            .stroke({ width: 2, color: 0xffffff });
          // Decorative leaf curls
          vGfx
            .circle(40, -4, 6).fill({ color: 0xffffff })
            .circle(120, -4, 6).fill({ color: 0xffffff })
            .circle(180, -4, 6).fill({ color: 0xffffff });

          vGfx.tint = colInfo.tint;
          vContainer.addChild(vGfx);
          vinesContainer.addChild(vContainer);

          vinesRef.current.push({
            container: vContainer,
            bodyGfx: vGfx,
            x: 80 + i * 260,
            y: 380,
            width: 220,
            colorName: colInfo.name,
            tint: colInfo.tint,
            checked: false,
          });
        }

        // 4. Floating Rainbow Bugs Layer
        const bugsContainer = new Container();
        stage.addChild(bugsContainer);

        rainbowBugsRef.current = [];
        for (let i = 0; i < 2; i++) {
          const bugCont = new Container();
          bugCont.x = 900 + i * 1100;
          bugCont.y = 300;

          const bugBody = new Graphics();
          bugBody
            .circle(0, 0, 12)
            .fill({ color: 0xffffff })
            .stroke({ width: 2, color: 0xfef08a });

          const wingL = new Graphics();
          wingL.roundRect(-14, -14, 12, 10, 4).fill({ color: 0x38bdf8, alpha: 0.75 });
          const wingR = new Graphics();
          wingR.roundRect(2, -14, 12, 10, 4).fill({ color: 0xec4899, alpha: 0.75 });

          bugCont.addChild(wingL);
          bugCont.addChild(wingR);
          bugCont.addChild(bugBody);
          bugsContainer.addChild(bugCont);

          rainbowBugsRef.current.push({
            container: bugCont,
            bodyGfx: bugBody,
            wingLeft: wingL,
            wingRight: wingR,
            x: 900 + i * 1100,
            y: 300,
            baseY: 300,
            active: true,
          });
        }

        // 5. Star Particles Pool
        const starPoolContainer = new Container();
        stage.addChild(starPoolContainer);
        starParticlesRef.current = [];
        for (let i = 0; i < 30; i++) {
          const stG = new Graphics();
          stG
            .poly([0, -6, 4, -2, 6, 4, 0, 2, -6, 4, -4, -2])
            .fill({ color: 0xfacc15 })
            .stroke({ width: 1, color: 0xffffff });
          const cont = new Container();
          cont.addChild(stG);
          cont.visible = false;
          starPoolContainer.addChild(cont);

          starParticlesRef.current.push({
            container: cont,
            gfx: stG,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            alpha: 1,
            rotation: 0,
            active: false,
          });
        }

        // 6. Paint Splatter Particles Pool
        const paintPoolContainer = new Container();
        stage.addChild(paintPoolContainer);
        paintParticlesRef.current = [];
        for (let i = 0; i < 40; i++) {
          const pG = new Graphics();
          pG.circle(0, 0, 5).fill({ color: 0xffffff });
          const cont = new Container();
          cont.addChild(pG);
          cont.visible = false;
          paintPoolContainer.addChild(cont);

          paintParticlesRef.current.push({
            container: cont,
            gfx: pG,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            alpha: 1,
            scale: 1,
            active: false,
          });
        }

        // 7. Strict Requirement: Cute Chameleon Character
        // Drawn in neutral white (0xFFFFFF) so its tint property changes instantaneously
        const chamContainer = new Container();
        chamContainer.x = 160;
        chamContainer.y = 350;

        // Chameleon Body (curved friendly lizard shape)
        const chamBody = new Graphics();
        chamBody
          .roundRect(-26, -18, 52, 34, 16)
          .fill({ color: 0xffffff })
          .stroke({ width: 2.5, color: 0x334155 });
        // Chameleon Head crest
        chamBody
          .poly([-20, -18, -32, -30, -12, -22])
          .fill({ color: 0xffffff })
          .stroke({ width: 2, color: 0x334155 });

        // Chameleon Curled Tail
        const chamTail = new Graphics();
        chamTail
          .arc(26, -2, 14, 0.4 * Math.PI, 1.8 * Math.PI)
          .stroke({ width: 7, color: 0xffffff, cap: 'round' });

        // Chameleon Running Legs
        const chamLegs = new Graphics();
        chamLegs
          .roundRect(-18, 12, 10, 14, 5).fill({ color: 0xffffff })
          .roundRect(10, 12, 10, 14, 5).fill({ color: 0xffffff });

        // Googly / Expressive Eye
        const eyeWhite = new Graphics();
        eyeWhite.circle(-14, -8, 8).fill({ color: 0xffffff }).stroke({ width: 1.5, color: 0x0f172a });

        // Normal Pupil
        const pupil = new Graphics();
        pupil.circle(-14, -8, 3.5).fill({ color: 0x0f172a }).circle(-15, -9.5, 1.2).fill({ color: 0xffffff });

        // Dizzy Swirl Eye Graphic (shown on mismatch)
        const dizzyGfx = new Graphics();
        dizzyGfx
          .moveTo(-18, -12).lineTo(-10, -4).stroke({ width: 2, color: 0x0f172a, cap: 'round' })
          .moveTo(-10, -12).lineTo(-18, -4).stroke({ width: 2, color: 0x0f172a, cap: 'round' });
        dizzyGfx.visible = false;

        chamContainer.addChild(chamTail);
        chamContainer.addChild(chamLegs);
        chamContainer.addChild(chamBody);
        chamContainer.addChild(eyeWhite);
        chamContainer.addChild(pupil);
        chamContainer.addChild(dizzyGfx);

        // Apply initial Red tint
        chamBody.tint = COLORS.RED;
        chamTail.tint = COLORS.RED;
        chamLegs.tint = COLORS.RED;

        stage.addChild(chamContainer);

        chameleonRef.current = {
          container: chamContainer,
          bodyGfx: chamBody,
          dizzyGfx,
          eyeWhite,
          pupil,
          legsGfx: chamLegs,
          tailGfx: chamTail,
          currentTint: COLORS.RED,
          isDizzy: false,
          dizzyTimer: 0,
          walkAnim: 0,
        };

        // 8. Paint Splat Screen Overlay (temporary splat on mismatch)
        const splatGfx = new Graphics();
        // Paint drips on screen edges
        splatGfx
          .circle(80, 80, 40).fill({ color: 0x64748b, alpha: 0.6 })
          .circle(120, 60, 24).fill({ color: 0x64748b, alpha: 0.5 })
          .circle(700, 140, 48).fill({ color: 0x64748b, alpha: 0.6 })
          .circle(660, 180, 26).fill({ color: 0x64748b, alpha: 0.5 });
        splatGfx.alpha = 0;
        splatGfx.visible = false;
        splatScreenOverlayRef.current = splatGfx;
        stage.addChild(splatGfx);

        // -------------------------------------------------------------
        // Strict Requirement: Interactive HUD container at the bottom
        // with 3 large, bouncy circular PIXI.Container buttons
        // for Red, Yellow, and Blue (eventMode = 'static', pointerdown/up)
        // -------------------------------------------------------------
        const hudContainer = new Container();
        hudContainer.y = stageHeight - 90;
        stage.addChild(hudContainer);

        // HUD panel background bar
        const hudBar = new Graphics();
        hudBar
          .roundRect(140, 0, 520, 80, 24)
          .fill({ color: 0x0f172a, alpha: 0.85 })
          .stroke({ width: 2, color: 0x334155 });
        hudContainer.addChild(hudBar);

        const buttonConfigs = [
          { key: 'red' as const, label: 'RED (1 / A)', color: COLORS.RED, x: 230 },
          { key: 'yellow' as const, label: 'YELLOW (2 / S)', color: COLORS.YELLOW, x: 400 },
          { key: 'blue' as const, label: 'BLUE (3 / D)', color: COLORS.BLUE, x: 570 },
        ];

        buttonConfigs.forEach((btnCfg) => {
          const btnCont = new Container();
          btnCont.x = btnCfg.x;
          btnCont.y = 40;
          btnCont.eventMode = 'static';
          btnCont.cursor = 'pointer';

          const btnGfx = new Graphics();
          btnGfx
            .circle(0, 0, 30)
            .fill({ color: btnCfg.color })
            .stroke({ width: 3.5, color: 0xffffff });

          const btnText = new Text({
            text: btnCfg.label,
            style: new TextStyle({
              fontFamily: 'Outfit, sans-serif',
              fontSize: 10,
              fontWeight: 'bold',
              fill: 0xffffff,
            }),
          });
          btnText.anchor.set(0.5);
          btnText.y = 36;

          btnCont.addChild(btnGfx);
          btnCont.addChild(btnText);

          btnCont.on('pointerdown', () => {
            btnCont.scale.set(0.88);
            pressButton(btnCfg.key);
          });

          const onUp = () => {
            btnCont.scale.set(1.0);
            releaseButton(btnCfg.key);
          };
          btnCont.on('pointerup', onUp);
          btnCont.on('pointerupoutside', onUp);

          hudContainer.addChild(btnCont);
        });

        // -------------------------------------------------------------
        // Game Ticker Update Loop
        // -------------------------------------------------------------
        app.ticker.add((ticker) => {
          const dt = Math.min(ticker.deltaTime, 2.0);
          const currentSpeed = baseSpeedRef.current * speedMultiplierRef.current;

          // Parallax Scrolling
          bgFarTile.tilePosition.x -= currentSpeed * 0.35 * dt;
          bgMidTile.tilePosition.x -= currentSpeed * 0.85 * dt;

          // Handle Disco Mode countdown
          if (discoTimerRef.current > 0) {
            discoTimerRef.current -= dt / 60;
            setDiscoSecondsLeft(Math.max(0, Math.ceil(discoTimerRef.current)));

            // Cycle chameleon through HSL hues every frame
            rainbowHueRef.current = (rainbowHueRef.current + 4 * dt) % 360;
            const h = rainbowHueRef.current;
            // Convert HSL to Hex
            const s = 1.0;
            const l = 0.55;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; }
            else if (h < 120) { r = x; g = c; }
            else if (h < 180) { g = c; b = x; }
            else if (h < 240) { g = x; b = c; }
            else if (h < 300) { r = x; b = c; }
            else { r = c; b = x; }

            const discoColor =
              (Math.round((r + m) * 255) << 16) +
              (Math.round((g + m) * 255) << 8) +
              Math.round((b + m) * 255);

            if (chameleonRef.current) {
              chameleonRef.current.bodyGfx.tint = discoColor;
              chameleonRef.current.tailGfx.tint = discoColor;
              chameleonRef.current.legsGfx.tint = discoColor;
              chameleonRef.current.currentTint = discoColor;
            }

            // Spawn rainbow trail stars
            if (Math.random() < 0.3) {
              spawnStarParticles(150, 350 + (Math.random() - 0.5) * 15);
            }
          }

          // Move Vines
          vinesRef.current.forEach((vine) => {
            vine.x -= currentSpeed * dt;
            vine.container.x = vine.x;

            // Kid-Friendly Collision: when chameleon passes over vine center (~160px)
            if (!vine.checked && vine.x <= 165 && vine.x + vine.width >= 155) {
              vine.checked = true;

              const isDisco = discoTimerRef.current > 0;
              const isMatch = isDisco || (chameleonRef.current && chameleonRef.current.currentTint === vine.tint);

              if (isMatch) {
                // MATCH!
                sound.playTap(760);
                comboRef.current += 1;
                setCombo(comboRef.current);
                speedMultiplierRef.current = Math.min(2.4, speedMultiplierRef.current + 0.04);

                scoreRef.current += 100 * comboRef.current;
                setScore(scoreRef.current);

                spawnStarParticles(160, 360);

                if (scoreRef.current > highScore) {
                  setHighScore(scoreRef.current);
                  localStorage.setItem('wonderpix_chameleon_highscore', String(scoreRef.current));
                }
              } else {
                // MISMATCH
                triggerMismatch(vine.colorName);
              }
            }

            // Wrap vine segment around when it scrolls off-screen
            if (vine.x < -240) {
              // Find rightmost vine
              let maxX = 0;
              vinesRef.current.forEach((v) => {
                if (v.x > maxX) maxX = v.x;
              });
              vine.x = maxX + 240 + Math.random() * 40;
              vine.checked = false;

              // Assign a new random color from the 6 palette options
              const randomCol = colorPalette[Math.floor(Math.random() * colorPalette.length)];
              vine.colorName = randomCol.name;
              vine.tint = randomCol.tint;
              vine.bodyGfx.tint = randomCol.tint;
            }
          });

          // Move Rainbow Bugs
          rainbowBugsRef.current.forEach((bug) => {
            bug.x -= (currentSpeed + 1.2) * dt;
            bug.container.x = bug.x;
            bug.container.y = bug.baseY + Math.sin(Date.now() * 0.005 + bug.x * 0.01) * 22;

            // Flap wings
            const wingAngle = Math.sin(Date.now() * 0.02) * 0.4;
            bug.wingLeft.rotation = wingAngle;
            bug.wingRight.rotation = -wingAngle;

            // Collision with chameleon (~160, 350)
            if (bug.active && Math.hypot(bug.x - 160, bug.container.y - 350) < 36) {
              bug.active = false;
              bug.container.visible = false;
              sound.playDiscoStart();
              discoTimerRef.current = 5.0; // 5 seconds of Disco Mode
              setDiscoSecondsLeft(5);
              spawnStarParticles(bug.x, bug.container.y);
            }

            // Recycle bug off-screen
            if (bug.x < -60) {
              bug.x = 1200 + Math.random() * 800;
              bug.active = true;
              bug.container.visible = true;
            }
          });

          // Update Chameleon Animation & Dizzy State
          if (chameleonRef.current) {
            chameleonRef.current.walkAnim += currentSpeed * 0.08 * dt;
            // Running leg swing
            chameleonRef.current.legsGfx.y = Math.sin(chameleonRef.current.walkAnim) * 2;
            chameleonRef.current.tailGfx.rotation = Math.sin(chameleonRef.current.walkAnim * 0.8) * 0.15;

            // Dizzy recovery
            if (chameleonRef.current.isDizzy) {
              chameleonRef.current.dizzyTimer -= dt;
              chameleonRef.current.container.rotation = Math.sin(Date.now() * 0.02) * 0.08;
              if (chameleonRef.current.dizzyTimer <= 0) {
                chameleonRef.current.isDizzy = false;
                chameleonRef.current.dizzyGfx.visible = false;
                chameleonRef.current.pupil.visible = true;
                chameleonRef.current.container.rotation = 0;
              }
            }
          }

          // Fade Paint Splat Screen Overlay
          if (splatScreenOverlayRef.current && splatScreenOverlayRef.current.visible) {
            splatScreenOverlayRef.current.alpha -= 0.012 * dt;
            if (splatScreenOverlayRef.current.alpha <= 0) {
              splatScreenOverlayRef.current.visible = false;
            }
          }

          // Update Star Particles
          starParticlesRef.current.forEach((st) => {
            if (st.active) {
              st.x += st.vx * dt;
              st.y += st.vy * dt;
              st.rotation += 0.1 * dt;
              st.alpha -= 0.02 * dt;

              st.container.x = st.x;
              st.container.y = st.y;
              st.container.rotation = st.rotation;
              st.container.alpha = Math.max(0, st.alpha);

              if (st.alpha <= 0) {
                st.active = false;
                st.container.visible = false;
              }
            }
          });

          // Update Paint Splatter Particles
          paintParticlesRef.current.forEach((p) => {
            if (p.active) {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += 0.18 * dt; // gravity
              p.alpha -= 0.025 * dt;

              p.container.x = p.x;
              p.container.y = p.y;
              p.container.scale.set(p.scale);
              p.container.alpha = Math.max(0, p.alpha);

              if (p.alpha <= 0) {
                p.active = false;
                p.container.visible = false;
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
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
      {/* Top Status & Controls Bar */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Current Color Indicator */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Camouflage:</span>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <div
              className="w-4 h-4 rounded-full border border-white shadow-xs transition-colors"
              style={{
                backgroundColor:
                  currentChameleonColorName.includes('Red')
                    ? '#ff3366'
                    : currentChameleonColorName.includes('Yellow')
                    ? '#ffdd00'
                    : currentChameleonColorName.includes('Blue')
                    ? '#3399ff'
                    : currentChameleonColorName.includes('Orange')
                    ? '#ff8800'
                    : currentChameleonColorName.includes('Green')
                    ? '#22cc66'
                    : '#aa33ff',
              }}
            />
            <span className="text-xs font-extrabold text-slate-800">
              {discoSecondsLeft > 0 ? '🌈 DISCO AUTO-MATCH' : currentChameleonColorName}
            </span>
          </div>
        </div>

        {/* Disco Mode Banner */}
        {discoSecondsLeft > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl text-xs font-bold animate-pulse shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DISCO MODE: {discoSecondsLeft}s</span>
          </div>
        )}

        {/* Score & Combo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Score:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums ml-1">{score}</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            <Flame className="w-3.5 h-3.5" />
            <span>Combo:</span>
            <span className="font-mono font-bold tabular-nums ml-0.5">{combo}x</span>
          </div>

          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main PixiJS Viewport */}
      <div className="relative w-full flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-[340px] h-[230px] sm:w-[800px] sm:h-[540px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-[#112233] relative cursor-pointer"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Kid Instructions & Color Mixing Guide */}
      <div className="w-full max-w-2xl mt-4 px-4 py-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div>
          <span className="font-bold text-slate-800">🎨 Color Mixing Guide:</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-medium text-rose-600">Red + Yellow = Orange</span>
            <span>·</span>
            <span className="font-medium text-emerald-600">Yellow + Blue = Green</span>
            <span>·</span>
            <span className="font-medium text-purple-600">Red + Blue = Purple</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          Tip: Tap two buttons or use keyboard keys <strong>1 / 2 / 3</strong> or <strong>A / S / D</strong>!
        </div>
      </div>
    </div>
  );
};
