import { useEffect, useRef, useState } from 'react';
import {
  drawMachineSprite,
  drawPixelMoonOrPhobos,
  drawPixelStarfield,
  drawTerrainLayer,
  pxRect,
} from '../../game/pixelSprites';
import { sound } from '../../game/sound';

interface MiniGame6Props {
  onWin: (discoveries: string[]) => void;
  onPause: () => void;
}

interface DiscoveryTarget {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  scanned: boolean;
}

interface MarsHazard {
  x: number;
  width: number;
  height: number;
  kind: 'rock' | 'crater' | 'dust_gust';
}

export function MiniGame6MarsExplorer({ onWin, onPause }: MiniGame6Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'brief' | 'playing' | 'failed' | 'won'>('brief');
  const [hud, setHud] = useState({
    hp: 3,
    energy: 100,
    found: 0,
    nearbyTitle: '',
    objective: 'Explore Mars and photograph 3 scientific discoveries.',
  });
  const [failReason, setFailReason] = useState('');

  const inputRef = useRef({ left: false, right: false, jumpQueued: false, scanQueued: false });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const resetRef = useRef(0);

  const startGame = () => {
    sound.unlock();
    sound.playButton('ui');
    resetRef.current += 1;
    setHud({
      hp: 3,
      energy: 100,
      found: 0,
      nearbyTitle: '',
      objective: 'Drive east and press SPACE / SCAN near all 3 discoveries.',
    });
    setFailReason('');
    setPhase('playing');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (phaseRef.current === 'playing' || phaseRef.current === 'failed') {
          e.preventDefault();
          startGame();
          return;
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (!e.repeat) inputRef.current.jumpQueued = true;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) inputRef.current.scanQueued = true;
      }
      if (phaseRef.current === 'brief' && e.key === 'Enter') startGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false;
    };
    const onBlur = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpQueued = false;
      inputRef.current.scanQueued = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [onPause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const worldWidth = 3100;
    const discoveries: DiscoveryTarget[] = [
      {
        id: 'ancient_rock',
        title: 'Ancient Martian Rock',
        subtitle: 'Layered volcanic basalt specimen',
        x: 780,
        scanned: false,
      },
      {
        id: 'ancient_water',
        title: 'Ancient Water Evidence',
        subtitle: 'Sedimentary channel & sulfate veins',
        x: 1720,
        scanned: false,
      },
      {
        id: 'abandoned_signal',
        title: 'Abandoned Exploration Signal',
        subtitle: 'Final deep-space telemetry beacon',
        x: 2760,
        scanned: false,
      },
    ];

    const hazards: MarsHazard[] = [
      { x: 500, width: 36, height: 28, kind: 'rock' },
      { x: 1060, width: 82, height: 20, kind: 'crater' },
      { x: 1380, width: 65, height: 70, kind: 'dust_gust' },
      { x: 1980, width: 38, height: 32, kind: 'rock' },
      { x: 2280, width: 86, height: 22, kind: 'crater' },
      { x: 2520, width: 65, height: 70, kind: 'dust_gust' },
    ];

    let roverX = 160;
    let roverY = 0;
    let roverVy = 0;
    let onGround = true;
    let hp = 3;
    let energy = 100;
    let invuln = 0;
    let shake = 0;
    let scanBeamTimer = 0;
    let camX = 0;
    let localReset = resetRef.current;

    const resetWorld = () => {
      roverX = 160;
      roverY = 0;
      roverVy = 0;
      onGround = true;
      hp = 3;
      energy = 100;
      invuln = 0;
      shake = 0;
      scanBeamTimer = 0;
      discoveries.forEach((d) => (d.scanned = false));
    };

    let last = performance.now();
    let rafId = 0;
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      if (localReset !== resetRef.current) {
        localReset = resetRef.current;
        resetWorld();
      }

      const w = canvas.width;
      const h = canvas.height;
      const groundY = Math.round(h * 0.77);
      ctx.imageSmoothingEnabled = false;

      if (phaseRef.current === 'playing') {
        if (invuln > 0) invuln -= dt;
        if (scanBeamTimer > 0) scanBeamTimer -= dt;

        let dir = 0;
        if (inputRef.current.left) dir -= 1;
        if (inputRef.current.right) dir += 1;
        if (dir !== 0) {
          roverX = Math.max(60, Math.min(worldWidth - 60, roverX + dir * 270 * dt));
          energy = Math.max(0, energy - 1.6 * dt);
        } else {
          // Solar panels gently recharge when stationary
          energy = Math.min(100, energy + 4 * dt);
        }

        if (inputRef.current.jumpQueued) {
          inputRef.current.jumpQueued = false;
          if (onGround) {
            roverVy = -440;
            onGround = false;
            sound.playJump();
          }
        }

        roverVy += 840 * dt;
        roverY += roverVy * dt;
        if (roverY >= 0) {
          roverY = 0;
          roverVy = 0;
          onGround = true;
        }

        // Check nearby discovery
        const nearby = discoveries.find((d) => !d.scanned && Math.abs(roverX - d.x) < 88);

        if (inputRef.current.scanQueued) {
          inputRef.current.scanQueued = false;
          if (nearby) {
            nearby.scanned = true;
            scanBeamTimer = 0.55;
            energy = Math.min(100, energy + 15);
            sound.playScan();
            const scannedList = discoveries.filter((d) => d.scanned).map((d) => d.title);
            if (scannedList.length >= discoveries.length) {
              sound.playVictory();
              setHud({
                hp,
                energy: Math.round(energy),
                found: scannedList.length,
                nearbyTitle: '',
                objective: 'All 3 discoveries recorded!',
              });
              setPhase('won');
              window.setTimeout(() => onWin(scannedList), 1000);
            }
          }
        }

        // Collisions with Martian hazards
        for (const hz of hazards) {
          if (invuln > 0) continue;
          if (hz.kind === 'rock') {
            if (Math.abs(roverX - hz.x) < hz.width * 0.5 + 18 && roverY > -hz.height + 6) {
              hp -= 1;
              invuln = 1.2;
              shake = 10;
              roverVy = -180;
              onGround = false;
              sound.playHurt();
            }
          } else if (hz.kind === 'crater') {
            if (Math.abs(roverX - hz.x) < hz.width * 0.42 && roverY >= -4) {
              hp -= 1;
              invuln = 1.2;
              shake = 10;
              roverVy = -210;
              onGround = false;
              sound.playHurt();
            }
          } else if (hz.kind === 'dust_gust') {
            const gustActive = Math.sin(t * 2.5 + hz.x) > 0.2;
            if (gustActive && Math.abs(roverX - hz.x) < hz.width * 0.5 + 12) {
              energy = Math.max(0, energy - 14 * dt);
            }
          }
          if (hp <= 0 || energy <= 0) {
            sound.playDefeat();
            setFailReason(
              hp <= 0
                ? 'Rover wheels damaged by Martian rocks and craters!'
                : 'Rover solar energy depleted in Martian dust!'
            );
            setPhase('failed');
          }
        }

        hudTimer += dt;
        if (hudTimer > 0.1) {
          hudTimer = 0;
          const foundCount = discoveries.filter((d) => d.scanned).length;
          setHud({
            hp,
            energy: Math.round(energy),
            found: foundCount,
            nearbyTitle: nearby ? nearby.title : '',
            objective:
              foundCount < 3
                ? 'Explore east and scan 3 Martian discoveries.'
                : 'All discoveries recorded!',
          });
        }
      }

      const targetCam = Math.max(0, Math.min(worldWidth - w, roverX - w * 0.35));
      camX += (targetCam - camX) * Math.min(1, dt * 8);
      if (shake > 0) shake = Math.max(0, shake - dt * 28);
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;

      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy));

      drawPixelStarfield(ctx, w, h, camX, t, 'mars');
      drawPixelMoonOrPhobos(ctx, Math.round(w * 0.78), Math.round(h * 0.2), 36, true);
      drawTerrainLayer(ctx, w, h, groundY, camX, 'mars');

      // Draw hazards
      for (const hz of hazards) {
        const hx = hz.x - camX;
        if (hz.kind === 'rock') {
          pxRect(ctx, hx - hz.width / 2, groundY - hz.height, hz.width, hz.height, '#090D16');
          pxRect(ctx, hx - hz.width / 2 + 3, groundY - hz.height + 3, hz.width - 6, hz.height - 6, '#9A3412');
        } else if (hz.kind === 'crater') {
          pxRect(ctx, hx - hz.width / 2, groundY - 2, hz.width, 14, '#431407');
          pxRect(ctx, hx - hz.width / 2 - 4, groundY - 6, 8, 6, '#EA580C');
          pxRect(ctx, hx + hz.width / 2 - 4, groundY - 6, 8, 6, '#EA580C');
        } else {
          const gustActive = Math.sin(t * 2.5 + hz.x) > 0.2;
          if (gustActive) {
            ctx.globalAlpha = 0.45;
            pxRect(ctx, hx - 28, groundY - 68, 56, 68, '#FDBA74');
            ctx.globalAlpha = 1;
          }
        }
      }

      // Draw Discoveries
      for (const d of discoveries) {
        const dx = d.x - camX;
        if (d.id === 'ancient_rock') {
          pxRect(ctx, dx - 18, groundY - 30, 36, 30, '#090D16');
          pxRect(ctx, dx - 14, groundY - 26, 28, 22, '#B45309');
          pxRect(ctx, dx - 8, groundY - 20, 12, 8, '#FBBF24');
        } else if (d.id === 'ancient_water') {
          pxRect(ctx, dx - 38, groundY - 4, 76, 12, '#0284C7');
          pxRect(ctx, dx - 28, groundY - 2, 56, 6, '#7DD3FC');
        } else {
          // Signal tower
          pxRect(ctx, dx - 8, groundY - 56, 16, 56, '#CBD5E1');
          pxRect(ctx, dx - 14, groundY - 64, 28, 12, d.scanned ? '#22C55E' : '#F59E0B');
        }
        // Scan indicator
        if (!d.scanned) {
          const pulse = Math.sin(t * 6) > 0;
          pxRect(ctx, dx - 12, groundY - 82, 24, 14, '#090D16');
          pxRect(ctx, dx - 9, groundY - 79, 18, 8, pulse ? '#38BDF8' : '#F59E0B');
        } else {
          pxRect(ctx, dx - 10, groundY - 80, 20, 12, '#22C55E');
        }
      }

      // Draw Rover (Opportunity / MER style)
      const rx = roverX - camX;
      const ry = groundY + roverY;
      const blink = invuln > 0 && Math.floor(t * 16) % 2 === 0;
      if (!blink) {
        drawMachineSprite(ctx, 'opportunity', rx, ry, t, true);
      }

      // Scanning laser beam
      if (scanBeamTimer > 0) {
        ctx.globalAlpha = 0.65;
        pxRect(ctx, rx - 4, ry - 60, 80, 16, '#38BDF8');
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [onWin]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1C0A0C]">
      <canvas ref={canvasRef} data-testid="mg6-canvas" className="w-full h-full pixelated" />

      {/* Top HUD */}
      <div className="fixed inset-x-0 top-0 z-20 p-3 md:p-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 pointer-events-auto">
          <div className="font-pixel text-[11px] text-[#EA580C]">MARS EXPLORER</div>
          <div className="mt-1 flex items-center gap-4 text-xs font-mono-tabular text-[#E2E8F0]">
            <span className="text-[#38BDF8]">DISCOVERIES: {hud.found}/3</span>
            <span className="text-[#22C55E]">ENERGY: {hud.energy}%</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5">{hud.objective}</div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 text-xs font-mono-tabular">
            HP: <span className="text-[#EF4444]">{'♥'.repeat(Math.max(0, hud.hp))}</span>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="px-3 py-2 bg-[#0F172A] border-2 border-[#475569] font-pixel text-xs text-[#CBD5E1] cursor-pointer pixel-btn"
          >
            RESTART [R]
          </button>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 bg-[#0F172A] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            PAUSE [P]
          </button>
        </div>
      </div>

      {/* Scan Prompt Banner */}
      {phase === 'playing' && hud.nearbyTitle && (
        <div className="fixed bottom-24 inset-x-0 z-20 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => (inputRef.current.scanQueued = true)}
            className="pointer-events-auto px-5 py-2.5 bg-[#38BDF8] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#E0F2FE] cursor-pointer pixel-btn"
          >
            PRESS [SPACE] TO SCAN: {hud.nearbyTitle.toUpperCase()}
          </button>
        </div>
      )}

      {/* Mobile Touch Controls */}
      {phase === 'playing' && (
        <div className="fixed inset-x-0 bottom-4 z-20 px-4 flex items-center justify-between pointer-events-none md:hidden">
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onTouchStart={() => (inputRef.current.left = true)}
              onTouchEnd={() => (inputRef.current.left = false)}
              className="w-14 h-14 bg-[#0F172A]/85 border-2 border-[#475569] font-pixel text-lg text-[#F8FAFC]"
            >
              ◀
            </button>
            <button
              type="button"
              onTouchStart={() => (inputRef.current.right = true)}
              onTouchEnd={() => (inputRef.current.right = false)}
              className="w-14 h-14 bg-[#0F172A]/85 border-2 border-[#475569] font-pixel text-lg text-[#F8FAFC]"
            >
              ▶
            </button>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onTouchStart={() => (inputRef.current.jumpQueued = true)}
              className="w-16 h-14 bg-[#F59E0B]/90 border-2 border-[#FEF3C7] font-pixel text-xs text-[#090D16]"
            >
              HOP
            </button>
            <button
              type="button"
              onTouchStart={() => (inputRef.current.scanQueued = true)}
              className="w-16 h-14 bg-[#38BDF8]/90 border-2 border-[#E0F2FE] font-pixel text-xs text-[#090D16]"
            >
              SCAN
            </button>
          </div>
        </div>
      )}

      {phase !== 'playing' && (
        <div className="fixed inset-0 z-30 bg-[#040714]/85 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B1226] pixel-frame p-6 text-center">
            {phase === 'brief' && (
              <>
                <h2 className="font-pixel text-lg text-[#EA580C]">
                  MINI-GAME 6 · MARS EXPLORER
                </h2>
                <p className="mt-3 text-sm text-[#CBD5E1] leading-relaxed">
                  Drive across the Martian valley, hop over boulders and craters, and press{' '}
                  <strong>SPACE</strong> near the 3 glowing targets to scan an Ancient Martian Rock,
                  Ancient Water Evidence, and the Abandoned Exploration Signal.
                </p>
                <div className="mt-3 text-xs font-mono-tabular text-[#94A3B8]">
                  Left/Right Drive · Up/W Hop · Space Scan
                </div>
                <button
                  type="button"
                  data-start="true"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#EA580C] hover:bg-[#F97316] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FFEDD5] cursor-pointer pixel-btn"
                >
                  EXPLORE MARS
                </button>
              </>
            )}

            {phase === 'failed' && (
              <>
                <h2 className="font-pixel text-lg text-[#EF4444]">ROVER STALLED</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">{failReason}</p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#EF4444] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
                >
                  RETRY EXPEDITION [R]
                </button>
              </>
            )}

            {phase === 'won' && (
              <>
                <h2 className="font-pixel text-lg text-[#22C55E]">ALL 3 DISCOVERIES RECORDED!</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  The Martian rovers hand Jack the final Deep-Space Navigation Beacon!
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
