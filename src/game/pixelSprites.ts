import type { MachineId } from './types';

export type JackPose =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'land'
  | 'surprised'
  | 'talking'
  | 'examining'
  | 'collecting'
  | 'repairing'
  | 'celebrating'
  | 'silent';

export function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawPixelStarfield(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  time: number,
  tint: 'space' | 'moon' | 'mars' = 'moon'
) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  if (tint === 'mars') {
    grad.addColorStop(0, '#1C0A0C');
    grad.addColorStop(0.45, '#5E1E14');
    grad.addColorStop(0.8, '#B84A24');
    grad.addColorStop(1, '#E07A38');
  } else if (tint === 'space') {
    grad.addColorStop(0, '#040714');
    grad.addColorStop(1, '#0D1730');
  } else {
    grad.addColorStop(0, '#050816');
    grad.addColorStop(0.7, '#0B132B');
    grad.addColorStop(1, '#172347');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Deterministic twinkling stars
  const starCount = tint === 'mars' ? 45 : 95;
  for (let i = 0; i < starCount; i++) {
    const seedX = ((i * 7919 + 104729) % 2000) / 2000;
    const seedY = ((i * 3571 + 49999) % 1000) / 1000;
    const parallax = 0.08 + (i % 3) * 0.06;
    const sx = ((seedX * width * 1.5 - cameraX * parallax) % width + width) % width;
    const sy = seedY * height * 0.62;
    const twinkle = 0.45 + 0.55 * Math.sin(time * 2.2 + i * 1.7);
    ctx.globalAlpha = tint === 'mars' ? twinkle * 0.45 : twinkle * 0.9;
    const size = i % 7 === 0 ? 4 : 2;
    ctx.fillStyle = i % 5 === 0 ? '#BAE6FD' : '#F8FAFC';
    ctx.fillRect(Math.round(sx), Math.round(sy), size, size);
  }
  ctx.globalAlpha = 1;
}

const planetCache = new Map<string, HTMLCanvasElement>();

function getCachedPlanetCanvas(
  key: string,
  radius: number,
  painter: (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => void
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cached = planetCache.get(key);
  if (cached) return cached;
  const size = Math.ceil(radius * 2 + 8);
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.imageSmoothingEnabled = false;
  painter(octx, size / 2, size / 2, radius);
  planetCache.set(key, off);
  return off;
}

export function drawPixelEarth(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  const r = Math.round(radius);
  const off = getCachedPlanetCanvas(`earth_${r}`, r, (octx, ocx, ocy, rad) => {
    const p = Math.max(2, Math.round(rad / 12));
    const r2 = rad * rad;
    for (let dy = -rad; dy <= rad; dy += p) {
      for (let dx = -rad; dx <= rad; dx += p) {
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= r2) {
          const nx = dx / rad;
          const ny = dy / rad;
          let col = '#1D4ED8';
          const land =
            Math.sin(nx * 3.8 + 0.5) * Math.cos(ny * 3.1 - 0.3) +
            Math.sin((nx + ny) * 4.2) * 0.35;
          if (ny < -0.78 || ny > 0.82) {
            col = '#E2E8F0';
          } else if (land > 0.25) {
            col = land > 0.52 ? '#84CC16' : '#22C55E';
          } else if (nx < -0.2 && ny > 0.1 && ny < 0.45) {
            col = '#60A5FA';
          }
          if (nx > 0.42 || ny > 0.55) {
            col = col === '#22C55E' ? '#15803D' : col === '#84CC16' ? '#4D7C0F' : '#1E3A8A';
          }
          if (Math.sin(nx * 7 + ny * 3) > 0.82 && nx < 0.4) {
            col = '#F8FAFC';
          }
          octx.fillStyle = col;
          octx.fillRect(Math.round(ocx + dx), Math.round(ocy + dy), p, p);
        }
      }
    }
  });
  if (off) {
    ctx.drawImage(off, Math.round(cx - off.width / 2), Math.round(cy - off.height / 2));
  }
}

export function drawPixelMoonOrPhobos(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  isMars = false
) {
  const r = Math.round(radius);
  const off = getCachedPlanetCanvas(`moon_${r}_${isMars ? 'm' : 'l'}`, r, (octx, ocx, ocy, rad) => {
    const p = Math.max(2, Math.round(rad / 10));
    const r2 = rad * rad;
    for (let dy = -rad; dy <= rad; dy += p) {
      for (let dx = -rad; dx <= rad; dx += p) {
        if (dx * dx + dy * dy <= r2) {
          const nx = dx / rad;
          const ny = dy / rad;
          const crater =
            Math.hypot(nx + 0.3, ny + 0.2) < 0.22 ||
            Math.hypot(nx - 0.35, ny - 0.15) < 0.18 ||
            Math.hypot(nx + 0.05, ny - 0.42) < 0.15;
          if (isMars) {
            octx.fillStyle = crater ? '#7C2D12' : nx > 0.4 ? '#C2410C' : '#F97316';
          } else {
            octx.fillStyle = crater ? '#64748B' : nx > 0.4 ? '#94A3B8' : '#E2E8F0';
          }
          octx.fillRect(Math.round(ocx + dx), Math.round(ocy + dy), p, p);
        }
      }
    }
  });
  if (off) {
    ctx.drawImage(off, Math.round(cx - off.width / 2), Math.round(cy - off.height / 2));
  }
}

export function drawTerrainLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  cameraX: number,
  planet: 'moon' | 'mars'
) {
  // Distant mountain silhouettes
  const mountainColorFar = planet === 'mars' ? '#4A1812' : '#1E293B';
  const mountainColorNear = planet === 'mars' ? '#7C2D12' : '#334155';
  const groundTop = planet === 'mars' ? '#C2410C' : '#94A3B8';
  const groundMid = planet === 'mars' ? '#9A3412' : '#64748B';
  const groundDeep = planet === 'mars' ? '#431407' : '#334155';
  const craterRim = planet === 'mars' ? '#EA580C' : '#CBD5E1';
  const craterPit = planet === 'mars' ? '#451A03' : '#1E293B';

  // Far mountains (parallax 0.2)
  ctx.fillStyle = mountainColorFar;
  const farStep = 140;
  const startFar = Math.floor((cameraX * 0.2) / farStep) - 1;
  for (let i = startFar; i < startFar + Math.ceil(width / farStep) + 3; i++) {
    const mx = i * farStep - cameraX * 0.2;
    const mh = 52 + ((Math.abs(i * 37) % 5) * 16);
    ctx.beginPath();
    ctx.moveTo(mx, groundY);
    ctx.lineTo(mx + farStep * 0.45, groundY - mh);
    ctx.lineTo(mx + farStep * 1.1, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // Near ridges (parallax 0.45)
  ctx.fillStyle = mountainColorNear;
  const nearStep = 180;
  const startNear = Math.floor((cameraX * 0.45) / nearStep) - 1;
  for (let i = startNear; i < startNear + Math.ceil(width / nearStep) + 3; i++) {
    const mx = i * nearStep - cameraX * 0.45;
    const mh = 30 + ((Math.abs(i * 53) % 4) * 12);
    ctx.beginPath();
    ctx.moveTo(mx, groundY);
    ctx.lineTo(mx + nearStep * 0.35, groundY - mh);
    ctx.lineTo(mx + nearStep * 0.65, groundY - mh * 0.72);
    ctx.lineTo(mx + nearStep * 1.05, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // Main ground slab
  pxRect(ctx, 0, groundY, width, height - groundY, groundMid);
  pxRect(ctx, 0, groundY, width, 6, groundTop);
  pxRect(ctx, 0, groundY + 34, width, height - groundY - 34, groundDeep);

  // Foreground craters & pebbles (world locked 1.0)
  const tile = 220;
  const firstTile = Math.floor(cameraX / tile) - 1;
  const count = Math.ceil(width / tile) + 3;
  for (let i = firstTile; i < firstTile + count; i++) {
    const wx = i * tile - cameraX;
    // Crater
    const cx = wx + ((Math.abs(i * 71) % 90) + 30);
    const cw = 54 + (Math.abs(i * 19) % 28);
    pxRect(ctx, cx, groundY + 10, cw, 10, craterRim);
    pxRect(ctx, cx + 6, groundY + 13, cw - 12, 8, craterPit);

    // Small surface rocks
    const rx = wx + ((Math.abs(i * 113) % 110) + 100);
    pxRect(ctx, rx, groundY - 6, 14, 6, groundTop);
    pxRect(ctx, rx + 2, groundY - 9, 8, 3, craterRim);
    pxRect(ctx, rx, groundY, 14, 3, groundDeep);
  }
}

export function drawJackSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: {
    pose: JackPose;
    facing: 1 | -1;
    walkPhase: number;
    time: number;
    hitFlash?: boolean;
  }
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Squash/stretch based on pose
  let sx = 1;
  let sy = 1;
  if (opts.pose === 'jump') {
    sx = 0.88;
    sy = 1.14;
  } else if (opts.pose === 'land') {
    sx = 1.18;
    sy = 0.82;
  }
  ctx.scale(opts.facing * sx, sy);

  const p = 3; // 3px pixel unit -> Jack is ~12x18 units = 36x54 px
  const outline = '#090D16';
  const suitLight = opts.hitFlash ? '#FFFFFF' : '#F8FAFC';
  const suitMid = opts.hitFlash ? '#FEF08A' : '#CBD5E1';
  const suitDark = '#64748B';
  const visor = opts.pose === 'surprised' ? '#38BDF8' : '#0EA5E9';
  const visorHighlight = '#BAE6FD';
  const trim = '#EF4444';

  const bob =
    opts.pose === 'walk' || opts.pose === 'run'
      ? Math.abs(Math.sin(opts.walkPhase)) * -3
      : opts.pose === 'celebrating'
      ? Math.abs(Math.sin(opts.time * 8)) * -6
      : Math.sin(opts.time * 2.5) * 1;

  ctx.translate(0, bob);

  // Backpack (behind)
  pxRect(ctx, -7 * p, -12 * p, 3 * p, 7 * p, outline);
  pxRect(ctx, -6 * p, -11 * p, 2 * p, 5 * p, suitDark);
  // Antenna on backpack
  pxRect(ctx, -6 * p, -16 * p, p, 4 * p, suitMid);
  pxRect(ctx, -6 * p, -17 * p, p, p, opts.pose === 'talking' ? '#22C55E' : trim);

  // Legs
  const legSwing =
    opts.pose === 'walk' || opts.pose === 'run' ? Math.sin(opts.walkPhase) * 2.2 * p : 0;
  const jumpLift = opts.pose === 'jump' ? -2 * p : 0;

  // Back leg
  pxRect(ctx, -3 * p - legSwing * 0.5, -5 * p + jumpLift * 0.5, 3 * p, 5 * p, outline);
  pxRect(ctx, -2 * p - legSwing * 0.5, -4 * p + jumpLift * 0.5, 2 * p, 3 * p, suitMid);
  pxRect(ctx, -2 * p - legSwing * 0.5, -1 * p + jumpLift * 0.5, 2 * p, p, suitDark);

  // Front leg
  pxRect(ctx, 0 + legSwing * 0.5, -5 * p + jumpLift, 3 * p, 5 * p, outline);
  pxRect(ctx, 1 * p + legSwing * 0.5, -4 * p + jumpLift, 2 * p, 3 * p, suitLight);
  pxRect(ctx, 1 * p + legSwing * 0.5, -1 * p + jumpLift, 2 * p, p, suitDark);

  // Torso
  pxRect(ctx, -4 * p, -11 * p, 8 * p, 6 * p, outline);
  pxRect(ctx, -3 * p, -10 * p, 6 * p, 4 * p, suitLight);
  // Chest life support control box
  pxRect(ctx, -1 * p, -9 * p, 3 * p, 2 * p, suitDark);
  pxRect(ctx, 0, -9 * p, p, p, '#22C55E');
  pxRect(ctx, 1 * p, -9 * p, p, p, trim);

  // Helmet
  pxRect(ctx, -4 * p, -18 * p, 9 * p, 7 * p, outline);
  pxRect(ctx, -3 * p, -17 * p, 7 * p, 5 * p, suitLight);
  // Helmet shadow rim
  pxRect(ctx, -3 * p, -13 * p, 7 * p, p, suitMid);
  // Visor
  pxRect(ctx, -1 * p, -16 * p, 5 * p, 4 * p, '#0F172A');
  pxRect(ctx, 0, -15 * p, 4 * p, 2 * p, visor);
  pxRect(ctx, 2 * p, -15 * p, 2 * p, p, visorHighlight);

  // Arm
  const armRaise =
    opts.pose === 'celebrating'
      ? -5 * p
      : opts.pose === 'repairing' || opts.pose === 'examining' || opts.pose === 'collecting'
      ? -2 * p + Math.sin(opts.time * 12) * 2
      : -legSwing * 0.4;

  pxRect(ctx, 1 * p, -10 * p + armRaise * 0.3, 3 * p, 5 * p, outline);
  pxRect(ctx, 2 * p, -9 * p + armRaise * 0.3, 2 * p, 3 * p, suitLight);
  pxRect(ctx, 2 * p, -6 * p + armRaise * 0.3, 2 * p, p, trim);

  // Repairing tool spark
  if (opts.pose === 'repairing') {
    pxRect(ctx, 4 * p, -7 * p, 3 * p, p, '#94A3B8');
    if (Math.sin(opts.time * 24) > 0) {
      pxRect(ctx, 7 * p, -8 * p, 2 * p, 2 * p, '#FACC15');
    }
  }

  // Surprised indicator
  if (opts.pose === 'surprised') {
    pxRect(ctx, 0, -23 * p, p, 3 * p, '#FACC15');
    pxRect(ctx, 0, -19 * p, p, p, '#FACC15');
  }

  ctx.restore();
}

export function drawSpacecraftSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  repairLevel: number, // 0 to 6
  time: number
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const p = 4;

  const hull = repairLevel >= 4 ? '#E2E8F0' : '#94A3B8';
  const hullShade = '#475569';
  const accent = repairLevel >= 6 ? '#22C55E' : repairLevel >= 4 ? '#38BDF8' : '#F59E0B';

  // Landing struts
  pxRect(ctx, -12 * p, -4 * p, 3 * p, 4 * p, '#334155');
  pxRect(ctx, 9 * p, -4 * p, 3 * p, 4 * p, '#334155');
  pxRect(ctx, -14 * p, -1 * p, 5 * p, p, '#64748B');
  pxRect(ctx, 9 * p, -1 * p, 5 * p, p, '#64748B');

  // Engine nozzle
  pxRect(ctx, -4 * p, -3 * p, 8 * p, 3 * p, '#1E293B');
  if (repairLevel >= 4) {
    const glow = Math.sin(time * 8) > 0 ? '#38BDF8' : '#0EA5E9';
    pxRect(ctx, -3 * p, 0, 6 * p, 2 * p, glow);
  }

  // Main cabin body
  pxRect(ctx, -10 * p, -16 * p, 20 * p, 13 * p, '#0F172A');
  pxRect(ctx, -9 * p, -15 * p, 18 * p, 11 * p, hull);
  pxRect(ctx, -9 * p, -7 * p, 18 * p, 3 * p, hullShade);

  // Nose cone
  pxRect(ctx, -6 * p, -22 * p, 12 * p, 6 * p, '#0F172A');
  pxRect(ctx, -5 * p, -21 * p, 10 * p, 5 * p, hull);
  pxRect(ctx, -3 * p, -25 * p, 6 * p, 3 * p, accent);

  // Cockpit window
  pxRect(ctx, -4 * p, -14 * p, 8 * p, 5 * p, '#020617');
  pxRect(
    ctx,
    -3 * p,
    -13 * p,
    6 * p,
    3 * p,
    repairLevel >= 1 ? '#38BDF8' : Math.sin(time * 6) > 0 ? '#EF4444' : '#450A0A'
  );

  // Comms dish on top if installed (>=4)
  if (repairLevel >= 4) {
    pxRect(ctx, 6 * p, -20 * p, 2 * p, 4 * p, '#CBD5E1');
    pxRect(ctx, 5 * p, -22 * p, 4 * p, 2 * p, '#F8FAFC');
  }

  // Warning sparks if damaged (< 4)
  if (repairLevel < 4 && Math.sin(time * 14) > 0.35) {
    pxRect(ctx, -7 * p, -11 * p, 2 * p, 2 * p, '#F59E0B');
    pxRect(ctx, 5 * p, -9 * p, 2 * p, 2 * p, '#EF4444');
  }

  // Beacon light
  const blink = Math.sin(time * 4) > 0;
  pxRect(ctx, -1 * p, -27 * p, 2 * p, 2 * p, blink ? accent : '#1E293B');

  ctx.restore();
}

export function drawMachineSprite(
  ctx: CanvasRenderingContext2D,
  id: MachineId,
  x: number,
  y: number,
  time: number,
  active: boolean
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const p = 3;
  const glow = active && Math.sin(time * 5) > 0 ? '#38BDF8' : active ? '#22C55E' : '#475569';

  if (id === 'eagle') {
    // Apollo 11 Eagle Descent Stage (left on the Moon)
    // 4 landing legs
    pxRect(ctx, -11 * p, -5 * p, 2 * p, 5 * p, '#D97706');
    pxRect(ctx, 9 * p, -5 * p, 2 * p, 5 * p, '#D97706');
    pxRect(ctx, -13 * p, -1 * p, 4 * p, p, '#FBBF24');
    pxRect(ctx, 9 * p, -1 * p, 4 * p, p, '#FBBF24');
    pxRect(ctx, -2 * p, -4 * p, 4 * p, 4 * p, '#78350F');
    // Gold foil octagonal base
    pxRect(ctx, -9 * p, -14 * p, 18 * p, 10 * p, '#090D16');
    pxRect(ctx, -8 * p, -13 * p, 16 * p, 8 * p, '#F59E0B');
    pxRect(ctx, -6 * p, -12 * p, 12 * p, 6 * p, '#FBBF24');
    // Blue glowing control panel
    pxRect(ctx, -2 * p, -11 * p, 4 * p, 3 * p, '#0F172A');
    pxRect(ctx, -1 * p, -10 * p, 2 * p, 2 * p, active ? '#38BDF8' : '#1E293B');
    // Ascent docking collar / top hatch stub
    pxRect(ctx, -4 * p, -17 * p, 8 * p, 3 * p, '#CBD5E1');
    pxRect(ctx, -1 * p, -20 * p, 2 * p, 3 * p, '#94A3B8');
  } else if (id === 'lrv') {
    // 4-wheeled wire-mesh Moon Buggy
    // Chassis
    pxRect(ctx, -11 * p, -8 * p, 22 * p, 4 * p, '#090D16');
    pxRect(ctx, -10 * p, -7 * p, 20 * p, 2 * p, '#E2E8F0');
    pxRect(ctx, -8 * p, -7 * p, 6 * p, 2 * p, '#F59E0B');
    // Seats
    pxRect(ctx, -5 * p, -12 * p, 5 * p, 5 * p, '#CBD5E1');
    pxRect(ctx, -4 * p, -11 * p, 3 * p, 3 * p, '#64748B');
    // High-gain umbrella dish
    pxRect(ctx, 6 * p, -16 * p, 2 * p, 9 * p, '#94A3B8');
    pxRect(ctx, 3 * p, -18 * p, 8 * p, 3 * p, '#FBBF24');
    // Wire-mesh wheels
    for (const wx of [-8 * p, 5 * p]) {
      pxRect(ctx, wx - 3 * p, -5 * p, 6 * p, 5 * p, '#090D16');
      pxRect(ctx, wx - 2 * p, -4 * p, 4 * p, 3 * p, '#475569');
      pxRect(ctx, wx - p, -3 * p, 2 * p, p, '#E2E8F0');
    }
    pxRect(ctx, 1 * p, -10 * p, 2 * p, 2 * p, glow);
  } else if (id === 'alsep') {
    // ALSEP Central Station + Instruments
    pxRect(ctx, -8 * p, -10 * p, 16 * p, 10 * p, '#090D16');
    pxRect(ctx, -7 * p, -9 * p, 14 * p, 8 * p, '#E2E8F0');
    pxRect(ctx, -6 * p, -8 * p, 5 * p, 5 * p, '#F59E0B');
    // Tall antenna
    pxRect(ctx, -1 * p, -20 * p, 2 * p, 10 * p, '#CBD5E1');
    pxRect(ctx, -2 * p, -22 * p, 4 * p, 2 * p, glow);
    // Seismometer sensor pod beside it
    pxRect(ctx, 10 * p, -5 * p, 5 * p, 5 * p, '#090D16');
    pxRect(ctx, 11 * p, -4 * p, 3 * p, 3 * p, '#38BDF8');
    pxRect(ctx, 7 * p, -2 * p, 4 * p, p, '#F59E0B');
  } else if (id === 'surveyor') {
    // Three-legged robotic Surveyor Lander
    pxRect(ctx, -9 * p, -6 * p, 2 * p, 6 * p, '#CBD5E1');
    pxRect(ctx, 7 * p, -6 * p, 2 * p, 6 * p, '#CBD5E1');
    pxRect(ctx, -1 * p, -6 * p, 2 * p, 6 * p, '#94A3B8');
    pxRect(ctx, -7 * p, -12 * p, 14 * p, 6 * p, '#090D16');
    pxRect(ctx, -6 * p, -11 * p, 12 * p, 4 * p, '#F8FAFC');
    pxRect(ctx, -3 * p, -10 * p, 6 * p, 3 * p, '#F59E0B');
    // Camera mast & solar wing
    pxRect(ctx, -1 * p, -21 * p, 2 * p, 9 * p, '#CBD5E1');
    pxRect(ctx, -3 * p, -23 * p, 6 * p, 3 * p, glow);
    pxRect(ctx, 6 * p, -17 * p, 7 * p, 4 * p, '#1D4ED8');
  } else if (id === 'apollo_comms') {
    // Apollo Communication Dish pointed toward Earth
    pxRect(ctx, -8 * p, -8 * p, 16 * p, 8 * p, '#090D16');
    pxRect(ctx, -7 * p, -7 * p, 14 * p, 6 * p, '#CBD5E1');
    pxRect(ctx, -5 * p, -6 * p, 4 * p, 4 * p, '#F59E0B');
    pxRect(ctx, 0, -18 * p, 2 * p, 11 * p, '#94A3B8');
    // Parabolic dish
    pxRect(ctx, -5 * p, -24 * p, 12 * p, 7 * p, '#E2E8F0');
    pxRect(ctx, -3 * p, -23 * p, 8 * p, 5 * p, '#64748B');
    pxRect(ctx, 0, -21 * p, 2 * p, 2 * p, glow);
  } else if (id === 'sojourner') {
    // Small compact 6-wheeled Pathfinder Rover
    for (const wx of [-5 * p, 0, 5 * p]) {
      pxRect(ctx, wx - 2 * p, -3 * p, 3 * p, 3 * p, '#090D16');
      pxRect(ctx, wx - p, -2 * p, 2 * p, 2 * p, '#475569');
    }
    pxRect(ctx, -6 * p, -7 * p, 12 * p, 4 * p, '#090D16');
    pxRect(ctx, -5 * p, -6 * p, 10 * p, 3 * p, '#FDE68A');
    // Top solar deck
    pxRect(ctx, -6 * p, -9 * p, 12 * p, 2 * p, active ? '#1D4ED8' : '#7C2D12');
    // Little mast
    pxRect(ctx, 3 * p, -13 * p, 2 * p, 4 * p, '#E2E8F0');
    pxRect(ctx, 3 * p, -14 * p, 2 * p, p, glow);
  } else {
    // Spirit or Opportunity (MER Twins)
    const wingColor = active ? '#1D4ED8' : '#7C2D12';
    const bodyAccent = id === 'opportunity' ? '#38BDF8' : '#F59E0B';
    // 6 wheels
    for (const wx of [-8 * p, 0, 8 * p]) {
      pxRect(ctx, wx - 2 * p, -4 * p, 4 * p, 4 * p, '#090D16');
      pxRect(ctx, wx - p, -3 * p, 2 * p, 2 * p, '#64748B');
    }
    // Solar wings
    pxRect(ctx, -11 * p, -10 * p, 22 * p, 4 * p, '#090D16');
    pxRect(ctx, -10 * p, -9 * p, 20 * p, 2 * p, wingColor);
    // Warm electronics box
    pxRect(ctx, -5 * p, -9 * p, 10 * p, 5 * p, '#F8FAFC');
    pxRect(ctx, -3 * p, -8 * p, 6 * p, 3 * p, bodyAccent);
    // PanCam mast + stereo eyes
    pxRect(ctx, -1 * p, -19 * p, 2 * p, 9 * p, '#E2E8F0');
    pxRect(ctx, -4 * p, -22 * p, 8 * p, 4 * p, '#090D16');
    pxRect(ctx, -3 * p, -21 * p, 6 * p, 2 * p, '#F8FAFC');
    pxRect(ctx, -2 * p, -21 * p, 2 * p, 2 * p, glow);
    pxRect(ctx, 1 * p, -21 * p, 2 * p, 2 * p, glow);
    // Robotic arm
    pxRect(ctx, 6 * p, -12 * p, 4 * p, 2 * p, '#CBD5E1');
    pxRect(ctx, 9 * p, -10 * p, 2 * p, 4 * p, '#94A3B8');
  }

  ctx.restore();
}
