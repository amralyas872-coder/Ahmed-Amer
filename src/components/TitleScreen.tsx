import { useEffect, useRef } from 'react';
import {
  drawJackSprite,
  drawMachineSprite,
  drawPixelEarth,
  drawPixelStarfield,
  drawSpacecraftSprite,
  drawTerrainLayer,
} from '../game/pixelSprites';
import { sound } from '../game/sound';

interface TitleScreenProps {
  hasSave: boolean;
  savedDay: number;
  muted: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
}

export function TitleScreen({
  hasSave,
  savedDay,
  muted,
  onStartNew,
  onContinue,
  onOpenArchive,
  onOpenSettings,
  onToggleMute,
}: TitleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let startTs = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const t = (now - startTs) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;

      const camX = t * 14;
      drawPixelStarfield(ctx, w, h, camX, t, 'moon');

      // Distant Earth in upper right negative space
      drawPixelEarth(ctx, Math.round(w * 0.78), Math.round(h * 0.24), Math.min(54, Math.max(36, w * 0.045)));

      const groundY = Math.round(h * 0.76);
      drawTerrainLayer(ctx, w, h, groundY, camX, 'moon');

      // Stage Eagle, LRV, and Jack in foreground silhouette right-of-center
      const centerStageX = Math.round(w * 0.66);
      drawSpacecraftSprite(ctx, centerStageX - 240, groundY, 2, t);
      drawMachineSprite(ctx, 'eagle', centerStageX, groundY, t, true);
      drawMachineSprite(ctx, 'lrv', centerStageX + 165, groundY, t, true);
      drawJackSprite(ctx, centerStageX - 75, groundY, {
        pose: 'idle',
        facing: 1,
        walkPhase: 0,
        time: t,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.unlock();
        sound.playButton('ui');
        if (hasSave) {
          onContinue();
        } else {
          onStartNew();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasSave, onContinue, onStartNew]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050816]">
      <canvas
        ref={canvasRef}
        data-testid="title-canvas"
        className="absolute inset-0 w-full h-full pixelated"
      />

      {/* Top-right compact audio/settings controls */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Audio and Game Settings"
          className="px-3 py-2 bg-[#0F172A]/90 hover:bg-[#1E293B] border-2 border-[#334155] text-xs font-pixel text-[#CBD5E1] cursor-pointer pixel-btn"
        >
          SETTINGS
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          className="px-3 py-2 bg-[#0F172A]/90 hover:bg-[#1E293B] border-2 border-[#334155] text-xs font-pixel text-[#F59E0B] cursor-pointer pixel-btn"
        >
          {muted ? 'SOUND: OFF' : 'SOUND: ON'}
        </button>
      </div>

      {/* Left-third negative space composition for title emblem and CTA */}
      <div className="relative z-10 flex flex-col justify-between h-full px-6 pt-16 pb-8 md:px-14 md:py-12 max-w-2xl">
        <div className="mt-2 md:mt-10">
          {/* Bespoke Inline SVG Pixel Mission Crest & Title Lockup */}
          <svg
            viewBox="0 0 520 190"
            className="w-full max-w-[500px] h-auto drop-shadow-[0_6px_0_rgba(2,6,23,0.9)]"
            role="img"
            aria-label="Jack: The Forgotten Space Explorers"
          >
            {/* Mission Patch Emblem */}
            <rect x="4" y="6" width="54" height="54" fill="#0F172A" stroke="#F59E0B" strokeWidth="4" />
            <circle cx="31" cy="33" r="16" fill="#1E3A8A" stroke="#38BDF8" strokeWidth="2" />
            <path d="M21 39 L31 19 L41 39 L31 34 Z" fill="#F8FAFC" />
            <circle cx="42" cy="18" r="3" fill="#F59E0B" />

            {/* Kicker */}
            <text
              x="74"
              y="28"
              fill="#38BDF8"
              fontFamily="Silkscreen, monospace"
              fontSize="14"
              letterSpacing="2"
            >
              NASA-INSPIRED 2D EXPEDITION
            </text>
            <text
              x="74"
              y="50"
              fill="#94A3B8"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
            >
              MOON · MARS · DAY 23 TO DAY 123
            </text>

            {/* Hero Title */}
            <text
              x="4"
              y="108"
              fill="#F8FAFC"
              fontFamily="Silkscreen, monospace"
              fontSize="50"
              fontWeight="700"
            >
              JACK
            </text>
            <text
              x="4"
              y="146"
              fill="#F59E0B"
              fontFamily="Silkscreen, monospace"
              fontSize="24"
              fontWeight="700"
            >
              THE FORGOTTEN
            </text>
            <text
              x="4"
              y="176"
              fill="#E2E8F0"
              fontFamily="Silkscreen, monospace"
              fontSize="24"
              fontWeight="700"
            >
              SPACE EXPLORERS
            </text>
          </svg>

          <p className="mt-4 max-w-md text-sm md:text-base text-[#CBD5E1] leading-relaxed">
            Stranded on the Moon on Day 23. Wake forgotten NASA machines, rebuild your spacecraft, and rescue the rovers waiting on Mars.
          </p>

          {/* Primary Actions (<= 3 main buttons) */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {hasSave ? (
              <>
                <button
                  type="button"
                  data-start="true"
                  onClick={() => {
                    sound.unlock();
                    sound.playButton('ui');
                    onContinue();
                  }}
                  className="px-6 py-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-sm md:text-base border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
                >
                  CONTINUE (DAY {savedDay})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.unlock();
                    sound.playButton('ui');
                    onStartNew();
                  }}
                  className="px-5 py-3.5 bg-[#0F172A]/95 hover:bg-[#1E293B] text-[#F8FAFC] font-pixel text-sm border-2 border-[#475569] cursor-pointer pixel-btn"
                >
                  NEW ADVENTURE
                </button>
              </>
            ) : (
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  sound.unlock();
                  sound.playButton('ui');
                  onStartNew();
                }}
                className="px-7 py-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-base border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
              >
                START ADVENTURE
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.unlock();
                sound.playButton('ui');
                onOpenArchive();
              }}
              className="px-5 py-3.5 bg-[#0F172A]/95 hover:bg-[#1E293B] text-[#38BDF8] font-pixel text-sm border-2 border-[#0284C7] cursor-pointer pixel-btn"
            >
              NASA ARCHIVE
            </button>
          </div>
        </div>

        {/* Single flat control-hint line in bottom safe margin */}
        <div className="text-xs font-mono-tabular text-[#94A3B8] tracking-wide">
          Arrows / WASD Move · Space Jump / Scan · E Interact · P Pause
        </div>
      </div>
    </div>
  );
}
