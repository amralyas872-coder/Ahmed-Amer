import { useEffect, useRef, useState } from 'react';
import {
  drawJackSprite,
  drawPixelEarth,
  drawPixelStarfield,
  drawTerrainLayer,
  pxRect,
} from '../../game/pixelSprites';
import { isSupplyMissionComplete, SUPPLY_TARGETS, type SupplyProgress } from '../../game/rules';
import { sound } from '../../game/sound';

interface MiniGame2Props {
  onWin: (collected: SupplyProgress) => void;
  onPause: () => void;
}

interface SupplyEntity {
  id: number;
  kind: 'oxygen' | 'battery' | 'part';
  x: number;
  y: number;
  vy: number;
  collected: boolean;
}

interface HazardEntity {
  id: number;
  kind: 'meteor' | 'rock' | 'spark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export function MiniGame2CollectSupplies({ onWin, onPause }: MiniGame2Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'brief' | 'playing' | 'failed' | 'won'>('brief');
  const [hud, setHud] = useState<{
    hp: number;
    timeLeft: number;
    oxygen: number;
    energyCells: number;
    repairParts: number;
  }>({
    hp: 3,
    timeLeft: 75,
    oxygen: 0,
    energyCells: 0,
    repairParts: 0,
  });
  const [failReason, setFailReason] = useState('');

  const inputRef = useRef({ left: false, right: false, jumpQueued: false });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const resetSignalRef = useRef(0);

  const startGame = () => {
    sound.unlock();
    sound.playButton('ui');
    resetSignalRef.current += 1;
    setHud({ hp: 3, timeLeft: 75, oxygen: 0, energyCells: 0, repairParts: 0 });
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
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!e.repeat) inputRef.current.jumpQueued = true;
      }
      if (phaseRef.current === 'brief' && e.key === 'Enter') {
        startGame();
      }
      if (phaseRef.current === 'failed' && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
        startGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputRef.current.right = false;
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

    const worldWidth = 1800;
    let jackX = 240;
    let jackY = 0;
    let jackVy = 0;
    let facing: 1 | -1 = 1;
    let walkPhase = 0;
    let onGround = true;
    let hp = 3;
    let invuln = 0;
    let hitstop = 0;
    let shake = 0;
    let timeLeft = 75;
    let camX = 0;
    let supplyTimer = 0;
    let hazardTimer = 0.8;
    let nextId = 1;
    let localResetToken = resetSignalRef.current;

    const progress: SupplyProgress = { oxygen: 0, energyCells: 0, repairParts: 0 };

    const supplies: SupplyEntity[] = [
      { id: nextId++, kind: 'oxygen', x: 420, y: 0, vy: 0, collected: false },
      { id: nextId++, kind: 'battery', x: 640, y: -90, vy: 0, collected: false },
      { id: nextId++, kind: 'part', x: 850, y: 0, vy: 0, collected: false },
      { id: nextId++, kind: 'oxygen', x: 1060, y: -70, vy: 0, collected: false },
      { id: nextId++, kind: 'part', x: 1260, y: 0, vy: 0, collected: false },
      { id: nextId++, kind: 'battery', x: 1460, y: -85, vy: 0, collected: false },
      { id: nextId++, kind: 'part', x: 1620, y: 0, vy: 0, collected: false },
    ];
    const hazards: HazardEntity[] = [];

    const resetWorld = () => {
      jackX = 240;
      jackY = 0;
      jackVy = 0;
      facing = 1;
      hp = 3;
      invuln = 0;
      hitstop = 0;
      shake = 0;
      timeLeft = 75;
      progress.oxygen = 0;
      progress.energyCells = 0;
      progress.repairParts = 0;
      supplies.forEach((s) => (s.collected = false));
      hazards.length = 0;
    };

    let last = performance.now();
    let rafId = 0;
    let hudTick = 0;

    const loop = (now: number) => {
      const rawDt = (now - last) / 1000;
      last = now;
      const dt = Math.min(rawDt, 0.05);
      const t = now / 1000;

      if (localResetToken !== resetSignalRef.current) {
        localResetToken = resetSignalRef.current;
        resetWorld();
      }

      const w = canvas.width;
      const h = canvas.height;
      const groundY = Math.round(h * 0.78);
      ctx.imageSmoothingEnabled = false;

      if (phaseRef.current === 'playing') {
        if (hitstop > 0) {
          hitstop -= dt;
        } else {
          timeLeft = Math.max(0, timeLeft - dt);
          if (timeLeft <= 0) {
            sound.playDefeat();
            setFailReason('Mission timer expired before all emergency supplies were secured.');
            setPhase('failed');
          }

          if (invuln > 0) invuln -= dt;

          // Move Jack (low lunar gravity)
          const moveSpeed = 285;
          let moveDir = 0;
          if (inputRef.current.left) moveDir -= 1;
          if (inputRef.current.right) moveDir += 1;

          if (moveDir !== 0) {
            facing = moveDir > 0 ? 1 : -1;
            jackX = Math.max(50, Math.min(worldWidth - 50, jackX + moveDir * moveSpeed * dt));
            walkPhase += dt * 11;
          }

          if (inputRef.current.jumpQueued) {
            inputRef.current.jumpQueued = false;
            if (onGround) {
              jackVy = -510;
              onGround = false;
              sound.playJump();
            }
          }

          // Low gravity physics
          jackVy += 880 * dt;
          jackY += jackVy * dt;
          if (jackY >= 0) {
            if (!onGround && jackVy > 150) sound.playLand();
            jackY = 0;
            jackVy = 0;
            onGround = true;
          }

          // Spawn extra needed supplies periodically
          supplyTimer += dt;
          if (supplyTimer > 3.2) {
            supplyTimer = 0;
            const needed: ('oxygen' | 'battery' | 'part')[] = [];
            if (progress.oxygen < SUPPLY_TARGETS.oxygen) needed.push('oxygen');
            if (progress.energyCells < SUPPLY_TARGETS.energyCells) needed.push('battery');
            if (progress.repairParts < SUPPLY_TARGETS.repairParts) needed.push('part');
            if (needed.length > 0 && supplies.filter((s) => !s.collected).length < 6) {
              const kind = needed[Math.floor(Math.random() * needed.length)];
              const sx = Math.max(80, Math.min(worldWidth - 80, jackX + (Math.random() - 0.5) * 700));
              supplies.push({
                id: nextId++,
                kind,
                x: sx,
                y: Math.random() > 0.5 ? -80 : 0,
                vy: 0,
                collected: false,
              });
            }
          }

          // Spawn falling meteors, unstable rocks, electrical hazards
          hazardTimer -= dt;
          if (hazardTimer <= 0) {
            hazardTimer = 1.05 + Math.random() * 0.7;
            const roll = Math.random();
            if (roll < 0.55) {
              hazards.push({
                id: nextId++,
                kind: 'meteor',
                x: Math.max(80, Math.min(worldWidth - 80, jackX + (Math.random() - 0.5) * 680)),
                y: -groundY + 20,
                vx: (Math.random() - 0.5) * 90,
                vy: 230 + Math.random() * 110,
                radius: 16,
                active: true,
              });
            } else if (roll < 0.8) {
              const fromRight = Math.random() > 0.5;
              hazards.push({
                id: nextId++,
                kind: 'rock',
                x: fromRight ? Math.min(worldWidth - 20, jackX + w * 0.6) : Math.max(20, jackX - w * 0.6),
                y: -14,
                vx: fromRight ? -210 : 210,
                vy: 0,
                radius: 15,
                active: true,
              });
            } else {
              hazards.push({
                id: nextId++,
                kind: 'spark',
                x: Math.max(80, Math.min(worldWidth - 80, jackX + (Math.random() - 0.5) * 520)),
                y: -groundY + 30,
                vx: 0,
                vy: 190,
                radius: 14,
                active: true,
              });
            }
          }

          // Check supply pickups
          const jackCenterY = groundY + jackY - 26;
          for (const s of supplies) {
            if (s.collected) continue;
            const sy = groundY + s.y - 18;
            if (Math.hypot(jackX - s.x, jackCenterY - sy) < 42) {
              s.collected = true;
              if (s.kind === 'oxygen') {
                progress.oxygen += 1;
                sound.playPickup('oxygen');
              } else if (s.kind === 'battery') {
                progress.energyCells += 1;
                sound.playPickup('battery');
              } else {
                progress.repairParts += 1;
                sound.playPickup('part');
              }
              if (isSupplyMissionComplete(progress)) {
                sound.playVictory();
                setHud({
                  hp,
                  timeLeft: Math.ceil(timeLeft),
                  ...progress,
                });
                setPhase('won');
                window.setTimeout(() => onWin({ ...progress }), 900);
              }
            }
          }

          // Update & collide hazards
          for (const hz of hazards) {
            if (!hz.active) continue;
            hz.x += hz.vx * dt;
            hz.y += hz.vy * dt;
            if (hz.y > 0) {
              hz.active = false;
              continue;
            }
            if (hz.x < 0 || hz.x > worldWidth) {
              hz.active = false;
              continue;
            }
            const hy = groundY + hz.y;
            if (invuln <= 0 && Math.hypot(jackX - hz.x, jackCenterY - hy) < hz.radius + 18) {
              hz.active = false;
              hp -= 1;
              invuln = 1.25;
              hitstop = 0.055;
              shake = 12;
              sound.playHurt();
              if (hp <= 0) {
                sound.playDefeat();
                setFailReason('Suit integrity compromised by lunar hazards.');
                setPhase('failed');
              }
            }
          }

          hudTick += dt;
          if (hudTick > 0.12) {
            hudTick = 0;
            setHud({
              hp,
              timeLeft: Math.ceil(timeLeft),
              oxygen: progress.oxygen,
              energyCells: progress.energyCells,
              repairParts: progress.repairParts,
            });
          }
        }
      }

      // Smooth camera follow
      const targetCam = Math.max(0, Math.min(worldWidth - w, jackX - w * 0.45));
      camX += (targetCam - camX) * Math.min(1, dt * 8);
      if (shake > 0) shake = Math.max(0, shake - dt * 28);
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;

      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy));

      drawPixelStarfield(ctx, w, h, camX, t, 'moon');
      drawPixelEarth(ctx, Math.round(w * 0.8), Math.round(h * 0.2), 40);
      drawTerrainLayer(ctx, w, h, groundY, camX, 'moon');

      // Draw supplies
      for (const s of supplies) {
        if (s.collected) continue;
        const screenX = s.x - camX;
        const bob = Math.sin(t * 4 + s.id) * 5;
        const screenY = groundY + s.y + bob - 18;
        if (s.kind === 'oxygen') {
          pxRect(ctx, screenX - 10, screenY - 14, 20, 26, '#090D16');
          pxRect(ctx, screenX - 7, screenY - 11, 14, 20, '#0EA5E9');
          pxRect(ctx, screenX - 4, screenY - 17, 8, 4, '#CBD5E1');
          pxRect(ctx, screenX - 4, screenY - 5, 8, 8, '#F8FAFC');
        } else if (s.kind === 'battery') {
          pxRect(ctx, screenX - 10, screenY - 12, 20, 22, '#090D16');
          pxRect(ctx, screenX - 7, screenY - 9, 14, 16, '#22C55E');
          pxRect(ctx, screenX - 4, screenY - 15, 8, 4, '#FACC15');
          pxRect(ctx, screenX - 3, screenY - 4, 6, 6, '#FEF08A');
        } else {
          pxRect(ctx, screenX - 11, screenY - 10, 22, 18, '#090D16');
          pxRect(ctx, screenX - 8, screenY - 7, 16, 12, '#F59E0B');
          pxRect(ctx, screenX - 4, screenY - 4, 8, 6, '#FEF3C7');
        }
      }

      // Draw hazards
      for (const hz of hazards) {
        if (!hz.active) continue;
        const screenX = hz.x - camX;
        const screenY = groundY + hz.y;
        if (hz.kind === 'meteor') {
          pxRect(ctx, screenX - 12, screenY - 18, 24, 20, '#EA580C');
          pxRect(ctx, screenX - 9, screenY - 10, 18, 18, '#475569');
          pxRect(ctx, screenX - 5, screenY - 6, 10, 10, '#94A3B8');
        } else if (hz.kind === 'rock') {
          pxRect(ctx, screenX - 12, screenY - 12, 24, 20, '#090D16');
          pxRect(ctx, screenX - 9, screenY - 9, 18, 14, '#EF4444');
        } else {
          const flash = Math.sin(t * 25) > 0 ? '#FACC15' : '#38BDF8';
          pxRect(ctx, screenX - 10, screenY - 10, 20, 20, '#090D16');
          pxRect(ctx, screenX - 6, screenY - 6, 12, 12, flash);
        }
      }

      // Draw Jack
      const blinkHide = invuln > 0 && Math.floor(t * 16) % 2 === 0;
      if (!blinkHide) {
        drawJackSprite(ctx, jackX - camX, groundY + jackY, {
          pose: !onGround ? 'jump' : inputRef.current.left || inputRef.current.right ? 'run' : 'idle',
          facing,
          walkPhase,
          time: t,
          hitFlash: invuln > 1.15,
        });
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
      <canvas ref={canvasRef} data-testid="mg2-canvas" className="w-full h-full pixelated" />

      {/* Top HUD */}
      <div className="fixed inset-x-0 top-0 z-20 p-3 md:p-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 pointer-events-auto">
          <div className="font-pixel text-[11px] text-[#38BDF8]">EAGLE SUPPLY MISSION</div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono-tabular">
            <span className="text-[#38BDF8]">
              O2: {Math.min(hud.oxygen, SUPPLY_TARGETS.oxygen)}/{SUPPLY_TARGETS.oxygen}
            </span>
            <span className="text-[#22C55E]">
              CELLS: {Math.min(hud.energyCells, SUPPLY_TARGETS.energyCells)}/{SUPPLY_TARGETS.energyCells}
            </span>
            <span className="text-[#F59E0B]">
              PARTS: {Math.min(hud.repairParts, SUPPLY_TARGETS.repairParts)}/{SUPPLY_TARGETS.repairParts}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3 py-2 text-xs font-mono-tabular">
            HP: <span className="text-[#EF4444]">{'♥'.repeat(Math.max(0, hud.hp))}</span> · TIME:{' '}
            <span className="text-[#F59E0B]">{hud.timeLeft}s</span>
          </div>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 bg-[#0F172A] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* Touch Controls */}
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
          <button
            type="button"
            onTouchStart={() => (inputRef.current.jumpQueued = true)}
            className="w-20 h-14 bg-[#F59E0B]/90 border-2 border-[#FEF3C7] font-pixel text-xs text-[#090D16] pointer-events-auto"
          >
            JUMP
          </button>
        </div>
      )}

      {/* Briefing / Failure / Won Modal */}
      {phase !== 'playing' && (
        <div className="fixed inset-0 z-30 bg-[#040714]/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B1226] pixel-frame p-6 text-center">
            {phase === 'brief' && (
              <>
                <h2 className="font-pixel text-lg text-[#F59E0B]">
                  MINI-GAME 2 · COLLECT THE SUPPLIES
                </h2>
                <p className="mt-3 text-sm text-[#CBD5E1] leading-relaxed">
                  Move across the lunar terrain and collect <strong>3 Oxygen Tanks</strong>,{' '}
                  <strong>3 Energy Cells</strong>, and <strong>4 Repair Parts</strong>. Dodge falling
                  meteors, rolling rocks, and electrical hazards!
                </p>
                <div className="mt-3 text-xs font-mono-tabular text-[#94A3B8]">
                  Left / Right Arrows (A / D) Move · Space / Up Jump
                </div>
                <button
                  type="button"
                  data-start="true"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
                >
                  START SUPPLY RUN
                </button>
              </>
            )}

            {phase === 'failed' && (
              <>
                <h2 className="font-pixel text-lg text-[#EF4444]">SUPPLY RUN FAILED</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">{failReason}</p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 w-full py-3 bg-[#EF4444] hover:bg-[#F87171] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
                >
                  RETRY MISSION [R]
                </button>
              </>
            )}

            {phase === 'won' && (
              <>
                <h2 className="font-pixel text-lg text-[#22C55E]">ALL SUPPLIES RECOVERED!</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  Returning to Eagle with the emergency oxygen, power cells, and parts...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
