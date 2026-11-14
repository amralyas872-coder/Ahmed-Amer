import { useEffect, useRef, useState } from 'react';
import {
  drawJackSprite,
  drawPixelEarth,
  drawPixelStarfield,
  pxRect,
} from '../../game/pixelSprites';
import { sound } from '../../game/sound';

interface MiniGame3Props {
  onWin: () => void;
  onPause: () => void;
}

interface RoverObstacle {
  x: number;
  width: number;
  height: number;
  kind: 'rock' | 'crater';
}

interface LunarSample {
  id: number;
  x: number;
  yOffset: number;
  collected: boolean;
}

export function MiniGame3MoonRover({ onWin, onPause }: MiniGame3Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'brief' | 'playing' | 'failed' | 'won'>('brief');
  const [hud, setHud] = useState({ hp: 3, samples: 0, progressPct: 0 });
  const [failReason, setFailReason] = useState('');

  const inputRef = useRef({ left: false, right: false, jumpQueued: false });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const resetTokenRef = useRef(0);

  const startGame = () => {
    sound.unlock();
    sound.playButton('ui');
    resetTokenRef.current += 1;
    setHud({ hp: 3, samples: 0, progressPct: 0 });
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
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!e.repeat) inputRef.current.jumpQueued = true;
      }
      if (phaseRef.current === 'brief' && e.key === 'Enter') startGame();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false;
    };
    const onBlur = () => {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpQueued = false;
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

    const trackLength = 3400;
    const beaconX = 3240;

    const terrainHeightAt = (wx: number) => {
      return Math.sin(wx * 0.0055) * 14 + Math.cos(wx * 0.013) * 7;
    };

    const obstacles: RoverObstacle[] = [
      { x: 540, width: 34, height: 28, kind: 'rock' },
      { x: 860, width: 88, height: 22, kind: 'crater' },
      { x: 1180, width: 38, height: 34, kind: 'rock' },
      { x: 1520, width: 96, height: 26, kind: 'crater' },
      { x: 1860, width: 40, height: 36, kind: 'rock' },
      { x: 2140, width: 84, height: 22, kind: 'crater' },
      { x: 2460, width: 42, height: 36, kind: 'rock' },
      { x: 2820, width: 100, height: 26, kind: 'crater' },
    ];

    const samples: LunarSample[] = [
      { id: 1, x: 740, yOffset: -36, collected: false },
      { id: 2, x: 1710, yOffset: -42, collected: false },
      { id: 3, x: 2680, yOffset: -38, collected: false },
    ];

    const dustPool = Array.from({ length: 28 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: 4,
    }));
    let dustCursor = 0;

    let roverX = 160;
    let roverY = 0;
    let roverVx = 0;
    let roverVy = 0;
    let wheelAngle = 0;
    let onGround = true;
    let hp = 3;
    let invuln = 0;
    let shake = 0;
    let hitstop = 0;
    let samplesCollected = 0;
    let camX = 0;
    let localReset = resetTokenRef.current;

    const resetWorld = () => {
      roverX = 160;
      roverY = 0;
      roverVx = 0;
      roverVy = 0;
      wheelAngle = 0;
      onGround = true;
      hp = 3;
      invuln = 0;
      shake = 0;
      hitstop = 0;
      samplesCollected = 0;
      samples.forEach((s) => (s.collected = false));
      dustPool.forEach((d) => (d.life = 0));
    };

    let last = performance.now();
    let rafId = 0;
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      if (localReset !== resetTokenRef.current) {
        localReset = resetTokenRef.current;
        resetWorld();
      }

      const w = canvas.width;
      const h = canvas.height;
      const baseGroundY = Math.round(h * 0.76);
      ctx.imageSmoothingEnabled = false;

      if (phaseRef.current === 'playing') {
        if (hitstop > 0) {
          hitstop -= dt;
        } else {
          if (invuln > 0) invuln -= dt;

          // Accelerate / brake
          if (inputRef.current.right) {
            roverVx = Math.min(360, roverVx + 540 * dt);
          } else if (inputRef.current.left) {
            roverVx = Math.max(-210, roverVx - 540 * dt);
          } else {
            roverVx *= Math.pow(0.08, dt);
          }

          roverX = Math.max(70, Math.min(trackLength - 80, roverX + roverVx * dt));
          wheelAngle += (roverVx * dt) / 14;

          if (inputRef.current.jumpQueued) {
            inputRef.current.jumpQueued = false;
            if (onGround) {
              roverVy = -450;
              onGround = false;
              sound.playJump();
            }
          }

          roverVy += 860 * dt;
          roverY += roverVy * dt;

          const slopeY = terrainHeightAt(roverX);
          if (roverY >= slopeY) {
            if (!onGround && roverVy > 160) {
              sound.playLand();
            }
            roverY = slopeY;
            roverVy = 0;
            onGround = true;
          }

          // Dust particles when driving on ground
          if (onGround && Math.abs(roverVx) > 65 && Math.random() < 0.65) {
            const p = dustPool[dustCursor++ % dustPool.length];
            p.x = roverX - Math.sign(roverVx) * 28;
            p.y = baseGroundY + roverY - 4;
            p.vx = -roverVx * 0.25 + (Math.random() - 0.5) * 30;
            p.vy = -25 - Math.random() * 45;
            p.life = 0.45;
            p.size = 4 + Math.floor(Math.random() * 4);
          }

          // Collect samples
          for (const s of samples) {
            if (s.collected) continue;
            const sy = terrainHeightAt(s.x) + s.yOffset;
            if (Math.hypot(roverX - s.x, roverY - 16 - sy) < 46) {
              s.collected = true;
              samplesCollected += 1;
              sound.playPickup('sample');
            }
          }

          // Check obstacles
          for (const ob of obstacles) {
            const obY = terrainHeightAt(ob.x);
            if (ob.kind === 'rock') {
              const hitX = Math.abs(roverX - ob.x) < ob.width * 0.5 + 22;
              const hitY = roverY > obY - ob.height + 6;
              if (hitX && hitY && invuln <= 0) {
                hp -= 1;
                invuln = 1.25;
                hitstop = 0.055;
                shake = 12;
                roverVx = -120;
                roverVy = -180;
                onGround = false;
                sound.playHurt();
                if (hp <= 0) {
                  sound.playDefeat();
                  setFailReason('Rover suspension damaged by lunar boulders.');
                  setPhase('failed');
                }
              }
            } else {
              // Deep crater: slows down or damages if rover drops into it
              const inCraterX = Math.abs(roverX - ob.x) < ob.width * 0.42;
              if (inCraterX && roverY >= obY - 4 && invuln <= 0) {
                hp -= 1;
                invuln = 1.25;
                hitstop = 0.05;
                shake = 10;
                roverVx *= 0.35;
                roverVy = -220;
                onGround = false;
                sound.playHurt();
                if (hp <= 0) {
                  sound.playDefeat();
                  setFailReason('Rover fell into a deep lunar crater!');
                  setPhase('failed');
                }
              }
            }
          }

          // Check destination beacon
          if (roverX >= beaconX - 30) {
            if (samplesCollected >= 3) {
              sound.playVictory();
              setHud({ hp, samples: samplesCollected, progressPct: 100 });
              setPhase('won');
              window.setTimeout(() => onWin(), 900);
            } else {
              setFailReason('You reached the beacon, but missed some Lunar Samples! Back up or collect all 3.');
            }
          }

          hudTimer += dt;
          if (hudTimer > 0.1) {
            hudTimer = 0;
            setHud({
              hp,
              samples: samplesCollected,
              progressPct: Math.min(100, Math.round((roverX / beaconX) * 100)),
            });
          }
        }
      }

      // Update dust particles
      for (const p of dustPool) {
        if (p.life > 0) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 90 * dt;
        }
      }

      const targetCam = Math.max(0, Math.min(trackLength - w, roverX - w * 0.3));
      camX += (targetCam - camX) * Math.min(1, dt * 8);
      if (shake > 0) shake = Math.max(0, shake - dt * 28);
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;

      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy));

      drawPixelStarfield(ctx, w, h, camX, t, 'moon');
      drawPixelEarth(ctx, Math.round(w * 0.82), Math.round(h * 0.2), 40);

      // Distant lunar ridge
      ctx.fillStyle = '#1E293B';
      const step = 160;
      const startM = Math.floor((camX * 0.3) / step) - 1;
      for (let i = startM; i < startM + Math.ceil(w / step) + 3; i++) {
        const mx = i * step - camX * 0.3;
        const mh = 55 + ((Math.abs(i * 41) % 4) * 15);
        ctx.beginPath();
        ctx.moveTo(mx, baseGroundY + 10);
        ctx.lineTo(mx + step * 0.5, baseGroundY - mh);
        ctx.lineTo(mx + step * 1.1, baseGroundY + 10);
        ctx.closePath();
        ctx.fill();
      }

      // Draw curved lunar ground strip
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let screenX = 0; screenX <= w + 16; screenX += 16) {
        const wx = camX + screenX;
        const gy = baseGroundY + terrainHeightAt(wx);
        ctx.lineTo(screenX, gy);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Surface highlight strip
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let screenX = 0; screenX <= w + 16; screenX += 16) {
        const wx = camX + screenX;
        const gy = baseGroundY + terrainHeightAt(wx);
        if (screenX === 0) ctx.moveTo(screenX, gy);
        else ctx.lineTo(screenX, gy);
      }
      ctx.stroke();

      // Draw obstacles
      for (const ob of obstacles) {
        const ox = ob.x - camX;
        const oy = baseGroundY + terrainHeightAt(ob.x);
        if (ob.kind === 'rock') {
          pxRect(ctx, ox - ob.width / 2, oy - ob.height, ob.width, ob.height, '#090D16');
          pxRect(ctx, ox - ob.width / 2 + 3, oy - ob.height + 3, ob.width - 6, ob.height - 6, '#94A3B8');
          pxRect(ctx, ox - ob.width / 2 + 6, oy - ob.height + 6, ob.width - 14, 6, '#E2E8F0');
        } else {
          pxRect(ctx, ox - ob.width / 2, oy - 3, ob.width, 16, '#0F172A');
          pxRect(ctx, ox - ob.width / 2 + 6, oy + 2, ob.width - 12, 12, '#020617');
          pxRect(ctx, ox - ob.width / 2 - 4, oy - 6, 8, 6, '#CBD5E1');
          pxRect(ctx, ox + ob.width / 2 - 4, oy - 6, 8, 6, '#CBD5E1');
        }
      }

      // Draw Destination Beacon
      const bx = beaconX - camX;
      const by = baseGroundY + terrainHeightAt(beaconX);
      pxRect(ctx, bx - 4, by - 78, 8, 78, '#CBD5E1');
      pxRect(ctx, bx - 16, by - 94, 32, 18, '#090D16');
      pxRect(
        ctx,
        bx - 12,
        by - 90,
        24,
        10,
        Math.sin(t * 7) > 0 ? '#22C55E' : '#F59E0B'
      );

      // Draw Lunar Samples
      for (const s of samples) {
        if (s.collected) continue;
        const sxPos = s.x - camX;
        const bob = Math.sin(t * 4 + s.id) * 5;
        const syPos = baseGroundY + terrainHeightAt(s.x) + s.yOffset + bob;
        pxRect(ctx, sxPos - 12, syPos - 14, 24, 24, '#090D16');
        pxRect(ctx, sxPos - 9, syPos - 11, 18, 18, '#38BDF8');
        pxRect(ctx, sxPos - 4, syPos - 7, 8, 10, '#E0F2FE');
      }

      // Draw Dust
      for (const p of dustPool) {
        if (p.life > 0) {
          ctx.globalAlpha = Math.max(0, p.life * 1.6);
          pxRect(ctx, p.x - camX, p.y, p.size, p.size, '#CBD5E1');
        }
      }
      ctx.globalAlpha = 1;

      // Draw LRV with Jack aboard
      const rx = roverX - camX;
      const ry = baseGroundY + roverY;
      const blink = invuln > 0 && Math.floor(t * 16) % 2 === 0;
      if (!blink) {
        const suspBounce = onGround ? Math.sin(roverX * 0.08) * 1.5 : 0;
        // Jack seated
        drawJackSprite(ctx, rx - 4, ry - 12 + suspBounce, {
          pose: 'idle',
          facing: 1,
          walkPhase: 0,
          time: t,
        });
        // Rover chassis
        pxRect(ctx, rx - 34, ry - 20 + suspBounce, 68, 10, '#090D16');
        pxRect(ctx, rx - 31, ry - 18 + suspBounce, 62, 6, '#E2E8F0');
        pxRect(ctx, rx - 28, ry - 18 + suspBounce, 20, 6, '#F59E0B');
        // Dish antenna
        pxRect(ctx, rx + 20, ry - 42 + suspBounce, 4, 24, '#CBD5E1');
        pxRect(ctx, rx + 12, ry - 48 + suspBounce, 20, 7, '#FBBF24');

        // Animated wire-mesh wheels
        for (const wx of [rx - 22, rx + 20]) {
          pxRect(ctx, wx - 11, ry - 11, 22, 22, '#090D16');
          pxRect(ctx, wx - 8, ry - 8, 16, 16, '#475569');
          const spokeX = Math.cos(wheelAngle) * 4;
          const spokeY = Math.sin(wheelAngle) * 4;
          pxRect(ctx, wx - 2 + spokeX, ry - 2 + spokeY, 4, 4, '#E2E8F0');
          pxRect(ctx, wx - 3, ry - 3, 6, 6, '#CBD5E1');
        }
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
    <div className="relative w-full h-full overflow-hidden bg-[#050816]">
      <canvas ref={canvasRef} data-testid="mg3-canvas" className="w-full h-full pixelated" />

      {/* Top HUD */}
      <div className="fixed inset-x-0 top-0 z-20 p-3 md:p-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 pointer-events-auto">
          <div className="font-pixel text-[11px] text-[#F59E0B]">MOON ROVER ADVENTURE</div>
          <div className="mt-1 flex items-center gap-4 text-xs font-mono-tabular text-[#E2E8F0]">
            <span className="text-[#38BDF8]">SAMPLES: {hud.samples}/3</span>
            <span>DISTANCE: {hud.progressPct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 text-xs font-mono-tabular">
            ROVER HP: <span className="text-[#EF4444]">{'♥'.repeat(Math.max(0, hud.hp))}</span>
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

      {/* Warning banner if reached beacon early */}
      {phase === 'playing' && failReason && (
        <div className="fixed top-20 inset-x-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-[#451A03]/95 border-2 border-[#F59E0B] px-4 py-2 text-xs font-pixel text-[#FEF3C7]">
            {failReason}
          </div>
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
              className="w-16 h-14 bg-[#0F172A]/85 border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC]"
            >
              BRAKE
            </button>
            <button
              type="button"
              onTouchStart={() => (inputRef.current.right = true)}
              onTouchEnd={() => (inputRef.current.right = false)}
              className="w-16 h-14 bg-[#0F172A]/85 border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC]"
            >
              DRIVE
            </button>
          </div>
          <button
            type="button"
            onTouchStart={() => (inputRef.current.jumpQueued = true)}
            className="w-20 h-14 bg-[#F59E0B]/90 border-2 border-[#FEF3C7] font-pixel text-xs text-[#090D16] pointer-events-auto"
          >
            JUMP
          </button>
        </div>
      )}

      {phase !== 'playing' && (
        <div className="fixed inset-0 z-30 bg-[#040714]/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B1226] pixel-frame p-6 text-center">
            {phase === 'brief' && (
              <>
                <h2 className="font-pixel text-lg text-[#F59E0B]">
                  MINI-GAME 3 · MOON ROVER ADVENTURE
                </h2>
                <p className="mt-3 text-sm text-[#CBD5E1] leading-relaxed">
                  Drive the electric LRV across the lunar ridge, jump over boulders and deep craters,
                  collect all <strong>3 glowing Lunar Samples</strong>, and reach the destination beacon!
                </p>
                <div className="mt-3 text-xs font-mono-tabular text-[#94A3B8]">
                  Right Accelerate · Left Brake/Reverse · Up / Space Jump
                </div>
                <button
                  type="button"
                  data-start="true"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
                >
                  DRIVE LRV
                </button>
              </>
            )}

            {phase === 'failed' && (
              <>
                <h2 className="font-pixel text-lg text-[#EF4444]">ROVER DISABLED</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">{failReason}</p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#EF4444] hover:bg-[#F87171] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
                >
                  RESTART DRIVE [R]
                </button>
              </>
            )}

            {phase === 'won' && (
              <>
                <h2 className="font-pixel text-lg text-[#22C55E]">DESTINATION REACHED!</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  3/3 Lunar Samples secured. The LRV is ready to guide you to the Ancient Crater!
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
