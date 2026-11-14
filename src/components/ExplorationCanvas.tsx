import { useEffect, useRef, useState } from 'react';
import {
  drawJackSprite,
  drawMachineSprite,
  drawPixelEarth,
  drawPixelMoonOrPhobos,
  drawPixelStarfield,
  drawSpacecraftSprite,
  drawTerrainLayer,
  type JackPose,
  pxRect,
} from '../game/pixelSprites';
import { sound } from '../game/sound';
import type { MachineId, SaveState } from '../game/types';

export type InteractTarget =
  | { kind: 'ship' }
  | { kind: 'machine'; id: MachineId };

interface ExplorationCanvasProps {
  planet: 'moon' | 'mars';
  save: SaveState;
  objectiveText: string;
  dialogueOpen: boolean;
  hubOpen: boolean;
  onInteract: (target: InteractTarget) => void;
  onOpenHub: (tab?: 'repair' | 'inventory' | 'log') => void;
  onPause: () => void;
}

interface WorldEntity {
  id: 'ship' | MachineId;
  label: string;
  x: number;
  visible: boolean;
  active: boolean;
}

export function ExplorationCanvas({
  planet,
  save,
  objectiveText,
  dialogueOpen,
  hubOpen,
  onInteract,
  onOpenHub,
  onPause,
}: ExplorationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nearbyPrompt, setNearbyPrompt] = useState<{
    target: InteractTarget;
    label: string;
  } | null>(null);
  const [directionHint, setDirectionHint] = useState<'left' | 'right' | null>(null);

  const inputRef = useRef({ left: false, right: false, jumpQueued: false, interactQueued: false });
  const saveRef = useRef(save);
  saveRef.current = save;
  const blockedRef = useRef(dialogueOpen || hubOpen);
  blockedRef.current = dialogueOpen || hubOpen;
  const dialogueOpenRef = useRef(dialogueOpen);
  dialogueOpenRef.current = dialogueOpen;
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (blockedRef.current) return;
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
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (!e.repeat) inputRef.current.interactQueued = true;
      }
      if (e.key === 'Tab' || e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onOpenHub('repair');
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
      inputRef.current.interactQueued = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [onPause, onOpenHub]);

  useEffect(() => {
    if (dialogueOpen || hubOpen) {
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpQueued = false;
      inputRef.current.interactQueued = false;
    }
  }, [dialogueOpen, hubOpen]);

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

    const worldWidth = 2500;
    let jackX = 350;
    let jackY = 0;
    let jackVy = 0;
    let facing: 1 | -1 = 1;
    let walkPhase = 0;
    let onGround = true;
    let landTimer = 0;
    let stepDist = 0;
    let camX = 0;

    const dustPool = Array.from({ length: 24 }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: 3,
    }));
    let dustIdx = 0;

    const spawnDust = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const p = dustPool[dustIdx++ % dustPool.length];
        p.x = x + (Math.random() - 0.5) * 14;
        p.y = y - 2;
        p.vx = (Math.random() - 0.5) * 65;
        p.vy = -25 - Math.random() * 45;
        p.life = 0.5;
        p.size = 3 + Math.floor(Math.random() * 3);
      }
    };

    let last = performance.now();
    let rafId = 0;
    let lastNearbyKey = '';
    let lastHint: 'left' | 'right' | null = null;

    const getEntities = (s: SaveState): WorldEntity[] => {
      if (planet === 'moon') {
        const lrvVisible = s.installedComponents.includes('universal_power_coupler');
        const craterVisible = s.installedComponents.includes('lunar_traction_module');
        return [
          { id: 'ship', label: 'Spacecraft Hub', x: 200, visible: true, active: true },
          {
            id: 'eagle',
            label: s.discoveredMachines.includes('eagle') ? 'Eagle (Apollo 11)' : 'Mysterious Gold Machine',
            x: 720,
            visible: true,
            active: s.discoveredMachines.includes('eagle'),
          },
          {
            id: 'lrv',
            label: s.discoveredMachines.includes('lrv') ? 'Lunar Roving Vehicle' : 'Half-Buried Moon Buggy',
            x: 1320,
            visible: lrvVisible,
            active: s.discoveredMachines.includes('lrv'),
          },
          {
            id: 'alsep',
            label: 'ALSEP Scientific Station',
            x: 1840,
            visible: craterVisible,
            active: s.discoveredMachines.includes('alsep'),
          },
          {
            id: 'surveyor',
            label: 'Surveyor Lander',
            x: 2040,
            visible: craterVisible,
            active: s.discoveredMachines.includes('surveyor'),
          },
          {
            id: 'apollo_comms',
            label: 'Apollo Communication Dish',
            x: 2240,
            visible: craterVisible,
            active: s.discoveredMachines.includes('apollo_comms'),
          },
        ];
      }

      // Mars world
      const cleaned = s.completedMiniGames.includes(5);
      const spiritVisible = s.talkedMachines.includes('sojourner');
      const oppyVisible = s.talkedMachines.includes('spirit');
      return [
        { id: 'ship', label: 'Spacecraft Hub', x: 200, visible: true, active: true },
        {
          id: 'sojourner',
          label: cleaned ? 'Sojourner Rover' : 'Dust-Covered Mars Rover',
          x: 720,
          visible: true,
          active: cleaned,
        },
        {
          id: 'spirit',
          label: 'Spirit Rover (Gusev Crater)',
          x: 1320,
          visible: spiritVisible,
          active: s.talkedMachines.includes('spirit'),
        },
        {
          id: 'opportunity',
          label: 'Opportunity Rover (Meridiani)',
          x: 1920,
          visible: oppyVisible,
          active: s.talkedMachines.includes('opportunity'),
        },
      ];
    };

    const getObjectiveTargetX = (s: SaveState): number => {
      if (planet === 'moon') {
        if (!s.completedMiniGames.includes(2)) return 720;
        if (!s.installedComponents.includes('universal_power_coupler')) return 200;
        if (!s.completedMiniGames.includes(3)) return 1320;
        if (!s.installedComponents.includes('lunar_traction_module')) return 200;
        if (!s.completedMiniGames.includes(4)) return 1940;
        return 200;
      } else {
        if (!s.completedMiniGames.includes(5)) return 720;
        if (!s.talkedMachines.includes('sojourner')) return 720;
        if (!s.talkedMachines.includes('spirit')) return 1320;
        if (!s.completedMiniGames.includes(6)) return 1920;
        return 200;
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      const w = canvas.width;
      const h = canvas.height;
      const groundY = Math.round(h * 0.77);
      ctx.imageSmoothingEnabled = false;

      const s = saveRef.current;
      const entities = getEntities(s);

      if (!blockedRef.current) {
        let dir = 0;
        if (inputRef.current.left) dir -= 1;
        if (inputRef.current.right) dir += 1;

        const speed = planet === 'moon' ? 230 : 250;
        if (dir !== 0) {
          facing = dir > 0 ? 1 : -1;
          jackX = Math.max(60, Math.min(worldWidth - 60, jackX + dir * speed * dt));
          walkPhase += dt * 9;
          stepDist += Math.abs(dir * speed * dt);
          if (onGround && stepDist > 42) {
            stepDist = 0;
            sound.playStep();
            spawnDust(jackX, groundY, 4);
          }
        }

        if (inputRef.current.jumpQueued) {
          inputRef.current.jumpQueued = false;
          if (onGround) {
            jackVy = -435;
            onGround = false;
            sound.playJump();
            spawnDust(jackX, groundY, 6);
          }
        }

        const gravity = planet === 'moon' ? 760 : 940;
        jackVy += gravity * dt;
        jackY += jackVy * dt;
        if (jackY >= 0) {
          if (!onGround && jackVy > 130) {
            sound.playLand();
            spawnDust(jackX, groundY, 7);
            landTimer = 0.12;
          }
          jackY = 0;
          jackVy = 0;
          onGround = true;
        }
        if (landTimer > 0) landTimer -= dt;
      }

      // Check closest visible entity
      let closest: WorldEntity | null = null;
      let closestDist = Infinity;
      for (const ent of entities) {
        if (!ent.visible) continue;
        const d = Math.abs(jackX - ent.x);
        if (d < 92 && d < closestDist) {
          closest = ent;
          closestDist = d;
        }
      }

      const nextKey = closest ? `${closest.id}:${closest.label}` : '';
      if (nextKey !== lastNearbyKey) {
        lastNearbyKey = nextKey;
        if (closest) {
          setNearbyPrompt({
            target: closest.id === 'ship' ? { kind: 'ship' } : { kind: 'machine', id: closest.id },
            label: closest.label,
          });
        } else {
          setNearbyPrompt(null);
        }
      }

      if (inputRef.current.interactQueued) {
        inputRef.current.interactQueued = false;
        if (closest && !blockedRef.current) {
          sound.unlock();
          sound.playButton('ui');
          onInteractRef.current(
            closest.id === 'ship' ? { kind: 'ship' } : { kind: 'machine', id: closest.id }
          );
        }
      }

      // Update camera smoothly
      const targetCam = Math.max(0, Math.min(worldWidth - w, jackX - w * 0.45));
      camX += (targetCam - camX) * Math.min(1, dt * 7);

      // Update offscreen direction indicator
      const goalX = getObjectiveTargetX(s);
      let nextHint: 'left' | 'right' | null = null;
      if (goalX < camX + 40) nextHint = 'left';
      else if (goalX > camX + w - 40) nextHint = 'right';
      if (nextHint !== lastHint) {
        lastHint = nextHint;
        setDirectionHint(nextHint);
      }

      // Update dust
      for (const p of dustPool) {
        if (p.life > 0) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 90 * dt;
        }
      }

      // Render Background & Terrain
      drawPixelStarfield(ctx, w, h, camX, t, planet);
      if (planet === 'moon') {
        drawPixelEarth(ctx, Math.round(w * 0.8), Math.round(h * 0.2), 44);
      } else {
        drawPixelMoonOrPhobos(ctx, Math.round(w * 0.8), Math.round(h * 0.2), 38, true);
      }
      drawTerrainLayer(ctx, w, h, groundY, camX, planet);

      // Draw Spacecraft & Machines
      const repairCount = s.installedComponents.length;
      for (const ent of entities) {
        if (!ent.visible) continue;
        const sx = ent.x - camX;
        if (sx < -160 || sx > w + 160) continue;

        if (ent.id === 'ship') {
          drawSpacecraftSprite(ctx, sx, groundY, repairCount, t);
        } else {
          drawMachineSprite(ctx, ent.id, sx, groundY, t, ent.active);
          // Dust mound if Eagle hasn't been talked to yet
          if (ent.id === 'eagle' && !ent.active) {
            pxRect(ctx, sx - 42, groundY - 8, 84, 8, '#64748B');
            pxRect(ctx, sx - 30, groundY - 12, 60, 4, '#94A3B8');
          }
        }

        // Interaction floating marker when close
        if (closest && closest.id === ent.id) {
          const bob = Math.sin(t * 6) * 3;
          pxRect(ctx, sx - 12, groundY - 110 + bob, 24, 22, '#090D16');
          pxRect(ctx, sx - 9, groundY - 107 + bob, 18, 16, '#F59E0B');
          ctx.fillStyle = '#090D16';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('E', sx, groundY - 95 + bob);
        }
      }

      // Dust Particles
      for (const p of dustPool) {
        if (p.life > 0) {
          ctx.globalAlpha = Math.max(0, p.life * 1.5);
          pxRect(
            ctx,
            p.x - camX,
            p.y,
            p.size,
            p.size,
            planet === 'mars' ? '#EA580C' : '#CBD5E1'
          );
        }
      }
      ctx.globalAlpha = 1;

      // Draw Jack
      const pose: JackPose = !onGround
        ? 'jump'
        : landTimer > 0
        ? 'land'
        : inputRef.current.left || inputRef.current.right
        ? 'walk'
        : dialogueOpenRef.current
        ? 'talking'
        : 'idle';

      drawJackSprite(ctx, jackX - camX, groundY + jackY, {
        pose,
        facing,
        walkPhase,
        time: t,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [planet]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} data-testid="explore-canvas" className="w-full h-full pixelated" />

      {/* Low-Occlusion Perimeter HUD */}
      <div className="fixed inset-x-0 top-0 z-20 p-3 md:p-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="bg-[#0B1226]/90 border-2 border-[#334155] px-3.5 py-2 max-w-md pointer-events-auto">
          <div className="flex items-center gap-3 text-xs font-mono-tabular">
            <span className="font-pixel text-[#F59E0B]">
              {planet === 'moon' ? 'THE MOON' : 'MARS'}
            </span>
            <span className="text-[#38BDF8]">DAY {save.missionDay}</span>
            <span className="text-[#94A3B8]">
              REPAIR: {Math.round((save.installedComponents.length / 6) * 100)}%
            </span>
          </div>
          <div className="mt-1 text-xs md:text-sm text-[#E2E8F0] leading-snug">
            {objectiveText}
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onOpenHub('repair')}
            className="px-3 py-2 bg-[#0B1226]/90 hover:bg-[#1E293B] border-2 border-[#38BDF8] font-pixel text-xs text-[#38BDF8] cursor-pointer pixel-btn"
          >
            SHIP HUB ({save.collectedComponents.length - save.installedComponents.length > 0 ? 'NEW PART!' : `${save.installedComponents.length}/6`})
          </button>
          <button
            type="button"
            onClick={() => onOpenHub('log')}
            className="px-3 py-2 bg-[#0B1226]/90 hover:bg-[#1E293B] border-2 border-[#334155] font-pixel text-xs text-[#CBD5E1] cursor-pointer pixel-btn hidden sm:inline-block"
          >
            NASA LOG
          </button>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 bg-[#0B1226]/90 hover:bg-[#1E293B] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            PAUSE [P]
          </button>
        </div>
      </div>

      {/* Off-screen Objective Arrow Hint */}
      {!dialogueOpen && !hubOpen && directionHint && (
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-20 pointer-events-none ${
            directionHint === 'left' ? 'left-3' : 'right-3'
          }`}
        >
          <div className="bg-[#0B1226]/90 border-2 border-[#F59E0B] px-2.5 py-1.5 font-pixel text-xs text-[#F59E0B]">
            {directionHint === 'left' ? '◀ OBJECTIVE' : 'OBJECTIVE ▶'}
          </div>
        </div>
      )}

      {/* Nearby Interaction Action Button */}
      {!dialogueOpen && !hubOpen && nearbyPrompt && (
        <div className="fixed bottom-20 md:bottom-8 inset-x-0 z-20 px-4 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => {
              sound.unlock();
              sound.playButton('ui');
              onInteract(nearbyPrompt.target);
            }}
            className="pointer-events-auto max-w-full px-4 md:px-5 py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm leading-snug text-center border-2 border-[#FEF3C7] cursor-pointer pixel-btn shadow-lg"
          >
            [E] EXAMINE: {nearbyPrompt.label.toUpperCase()}
          </button>
        </div>
      )}

      {/* Mobile Touch Controls */}
      {!dialogueOpen && !hubOpen && (
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
            className="w-20 h-14 bg-[#38BDF8]/90 border-2 border-[#E0F2FE] font-pixel text-xs text-[#090D16] pointer-events-auto"
          >
            JUMP
          </button>
        </div>
      )}
    </div>
  );
}
