import { useEffect, useRef, useState } from 'react';
import { computeSolarCleanPercentage, isSolarPanelCleaned } from '../../game/rules';
import { sound } from '../../game/sound';

interface MiniGame5Props {
  onWin: () => void;
  onPause: () => void;
}

const COLS = 8;
const ROWS = 5;
const TOTAL_CELLS = COLS * ROWS;

export function MiniGame5CleanSolarPanels({ onWin, onPause }: MiniGame5Props) {
  const [phase, setPhase] = useState<'brief' | 'playing' | 'failed' | 'won'>('brief');
  const [cleanPct, setCleanPct] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [panelIntegrity, setPanelIntegrity] = useState(100);
  const [cursorCell, setCursorCell] = useState({ col: 3, row: 2 });
  const [dustGrid, setDustGrid] = useState<number[]>(() =>
    Array.from({ length: TOTAL_CELLS }, (_, i) => (i % 5 === 0 ? 1.0 : 0.85))
  );
  // Hotspots that need gentle sweeping (or single warning tap) — actually let's mark 3 stubborn cells
  // that require 2 passes, plus a live brush pointer!
  const [hotCells] = useState<number[]>(() => [9, 22, 31]);
  const [windMsg, setWindMsg] = useState('');

  const pointerDownRef = useRef(false);
  const dustRef = useRef(dustGrid);
  dustRef.current = dustGrid;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const lastSoundRef = useRef(0);

  const resetGame = () => {
    sound.unlock();
    sound.playButton('ui');
    const initial = Array.from({ length: TOTAL_CELLS }, (_, i) => (i % 4 === 0 ? 1.0 : 0.88));
    setDustGrid(initial);
    setCleanPct(computeSolarCleanPercentage(initial));
    setTimeLeft(45);
    setPanelIntegrity(100);
    setWindMsg('');
    setPhase('playing');
  };

  const cleanCellAt = (idx: number, amount = 0.55) => {
    if (phaseRef.current !== 'playing') return;
    const prev = dustRef.current;
    if (prev[idx] <= 0.01) return;

    const next = [...prev];
    const factor = hotCells.includes(idx) ? amount * 0.65 : amount;
    const before = next[idx];
    next[idx] = Math.max(0, next[idx] - factor);
    dustRef.current = next;
    setDustGrid(next);

    const pct = computeSolarCleanPercentage(next);
    setCleanPct(pct);

    const now = performance.now();
    if (now - lastSoundRef.current > 90) {
      lastSoundRef.current = now;
      if (before > 0.1 && next[idx] <= 0.05) {
        sound.playSolarSpark();
      } else {
        sound.playBrushSweep();
      }
    }

    if (isSolarPanelCleaned(next, 90)) {
      sound.playVictory();
      setPhase('won');
      window.setTimeout(() => onWin(), 1100);
    }
  };

  // Timer & occasional Martian wind gusts pushing dust back on 2 edge cells
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          sound.playDefeat();
          setPhase('failed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const windTimer = window.setInterval(() => {
      setDustGrid((prev) => {
        if (computeSolarCleanPercentage(prev) >= 90) return prev;
        const next = [...prev];
        const edgeIndices = [0, 7, 8, 15, 32, 39];
        const pick = edgeIndices[Math.floor(Math.random() * edgeIndices.length)];
        next[pick] = Math.min(1, next[pick] + 0.45);
        setCleanPct(computeSolarCleanPercentage(next));
        setWindMsg('MARTIAN DUST GUST! Re-sweep edges if needed.');
        window.setTimeout(() => setWindMsg(''), 2000);
        return next;
      });
    }, 7500);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(windTimer);
    };
  }, [phase]);

  // Keyboard brush navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
        return;
      }
      if (phaseRef.current === 'brief' && e.key === 'Enter') {
        resetGame();
        return;
      }
      if (phaseRef.current === 'failed' && (e.key === 'r' || e.key === 'R' || e.key === 'Enter')) {
        resetGame();
        return;
      }
      if (phaseRef.current !== 'playing') return;

      let dCol = 0;
      let dRow = 0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dCol = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dCol = 1;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dRow = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dRow = 1;

      if (dCol !== 0 || dRow !== 0) {
        e.preventDefault();
        setCursorCell((c) => {
          const nc = {
            col: Math.max(0, Math.min(COLS - 1, c.col + dCol)),
            row: Math.max(0, Math.min(ROWS - 1, c.row + dRow)),
          };
          cleanCellAt(nc.row * COLS + nc.col, 0.95);
          return nc;
        });
      } else if (e.key === ' ') {
        e.preventDefault();
        cleanCellAt(cursorCell.row * COLS + cursorCell.col, 1.0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cursorCell, onPause]);

  return (
    <div
      className="w-full h-full bg-[#1C0A0C] flex flex-col items-center justify-between p-3 md:p-6 overflow-y-auto"
      onPointerUp={() => (pointerDownRef.current = false)}
      onPointerCancel={() => (pointerDownRef.current = false)}
    >
      {/* Top HUD */}
      <div className="max-w-4xl w-full bg-[#2A100F] pixel-frame p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel text-sm md:text-base text-[#F59E0B]">
            MINI-GAME 5 · CLEAN THE SOLAR PANELS
          </h2>
          <p className="text-xs text-[#FDBA74] mt-0.5">
            Drag cursor/finger or use Arrow keys across the Martian dust until solar output reaches 90%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono-tabular text-xs">
            <div className="text-[#38BDF8]">POWER: {cleanPct}% / 90%</div>
            <div className="text-[#FCA5A5]">TIME: {timeLeft}s · INTEGRITY: {panelIntegrity}%</div>
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

      {/* Energy Meter */}
      <div className="max-w-4xl w-full mt-3">
        <div className="w-full h-6 bg-[#090D16] border-2 border-[#475569] p-0.5 flex items-center">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${Math.min(100, cleanPct)}%`,
              backgroundColor: cleanPct >= 90 ? '#22C55E' : cleanPct >= 50 ? '#38BDF8' : '#F59E0B',
            }}
          />
        </div>
        {windMsg && (
          <div className="mt-1.5 text-center font-pixel text-xs text-[#FDBA74]">{windMsg}</div>
        )}
      </div>

      {/* Large Pixel-Art Solar Panel */}
      <div className="max-w-4xl w-full my-4 bg-[#0F172A] border-4 border-[#94A3B8] p-3 md:p-5 shadow-2xl">
        <div
          className="grid gap-1.5 md:gap-2 touch-none"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          onPointerDown={() => (pointerDownRef.current = true)}
        >
          {dustGrid.map((dust, idx) => {
            const isClean = dust <= 0.12;
            const isCursor = cursorCell.row * COLS + cursorCell.col === idx;
            const isStubborn = hotCells.includes(idx);

            return (
              <button
                key={idx}
                type="button"
                aria-label={`Solar cell ${idx + 1}, ${Math.round((1 - dust) * 100)}% clean`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  pointerDownRef.current = true;
                  setCursorCell({ col: idx % COLS, row: Math.floor(idx / COLS) });
                  cleanCellAt(idx, 0.65);
                }}
                onPointerEnter={() => {
                  if (pointerDownRef.current) {
                    setCursorCell({ col: idx % COLS, row: Math.floor(idx / COLS) });
                    cleanCellAt(idx, 0.55);
                  }
                }}
                onClick={() => cleanCellAt(idx, 0.65)}
                className={`relative aspect-[4/3] min-h-[44px] border-2 overflow-hidden cursor-crosshair transition-transform ${
                  isClean
                    ? 'bg-[#1E3A8A] border-[#38BDF8]'
                    : 'bg-[#172554] border-[#334155]'
                } ${isCursor ? 'ring-2 ring-[#FACC15]' : ''}`}
              >
                {/* Solar cell grid lines */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30 pointer-events-none">
                  <div className="border-r border-b border-[#60A5FA]" />
                  <div className="border-b border-[#60A5FA]" />
                  <div className="border-r border-[#60A5FA]" />
                  <div />
                </div>

                {/* Red Martian dust layer */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-100"
                  style={{
                    opacity: dust,
                    backgroundColor: isStubborn ? '#9A3412' : '#C2410C',
                  }}
                />

                {isClean && (
                  <span className="relative z-10 font-pixel text-[10px] text-[#BAE6FD]">⚡</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs font-mono-tabular text-[#FDBA74]">
        Click & Drag / Touch-Sweep cells (or use Arrow Keys + Space)
      </div>

      {/* Brief / Fail / Win Modals */}
      {phase !== 'playing' && (
        <div className="fixed inset-0 z-30 bg-[#040714]/85 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B1226] pixel-frame p-6 text-center">
            {phase === 'brief' && (
              <>
                <h2 className="font-pixel text-lg text-[#F59E0B]">
                  CLEAN MARTIAN SOLAR PANELS
                </h2>
                <p className="mt-3 text-sm text-[#CBD5E1] leading-relaxed">
                  Thick red Martian dust is blocking sunlight from waking Sojourner! Sweep away at
                  least <strong>90%</strong> of the dust before the 45-second storm window closes.
                </p>
                <button
                  type="button"
                  data-start="true"
                  onClick={resetGame}
                  className="mt-5 w-full py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
                >
                  START CLEANING
                </button>
              </>
            )}

            {phase === 'failed' && (
              <>
                <h2 className="font-pixel text-lg text-[#EF4444]">DUST STORM HIT!</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  You cleaned {cleanPct}% of the array before time ran out. Try again!
                </p>
                <button
                  type="button"
                  onClick={resetGame}
                  className="mt-5 w-full py-3 bg-[#EF4444] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
                >
                  RETRY CLEANING [R]
                </button>
              </>
            )}

            {phase === 'won' && (
              <>
                <h2 className="font-pixel text-lg text-[#22C55E]">SOLAR POWER RESTORED!</h2>
                <p className="mt-3 text-sm text-[#CBD5E1]">
                  Sunlight hits the solar cells—an energy pulse awakens the Mars rover!
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
