import { useEffect, useRef, useState } from 'react';
import {
  type EmergencyButtonColor,
  generateSimonSequence,
  validateSimonInput,
} from '../../game/rules';
import { ASSETS } from '../../game/storyData';
import { sound } from '../../game/sound';

interface MiniGame1Props {
  onWin: () => void;
  onPause: () => void;
}

const BUTTONS: {
  id: EmergencyButtonColor;
  label: string;
  system: string;
  keyHint: string;
  baseBg: string;
  litBg: string;
  border: string;
}[] = [
  {
    id: 'red',
    label: 'STABILIZE',
    system: 'ATTITUDE CONTROL',
    keyHint: '1 / R',
    baseBg: 'bg-[#7F1D1D]',
    litBg: 'bg-[#EF4444]',
    border: 'border-[#FCA5A5]',
  },
  {
    id: 'blue',
    label: 'POWER',
    system: 'AUXILIARY BUS',
    keyHint: '2 / B',
    baseBg: 'bg-[#1E3A8A]',
    litBg: 'bg-[#38BDF8]',
    border: 'border-[#BAE6FD]',
  },
  {
    id: 'green',
    label: 'GEAR',
    system: 'LANDING STRUTS',
    keyHint: '3 / G',
    baseBg: 'bg-[#14532D]',
    litBg: 'bg-[#22C55E]',
    border: 'border-[#BBF7D0]',
  },
  {
    id: 'yellow',
    label: 'THRUSTERS',
    system: 'DESCENT RETRO',
    keyHint: '4 / Y',
    baseBg: 'bg-[#713F12]',
    litBg: 'bg-[#FACC15]',
    border: 'border-[#FEF08A]',
  },
];

const ROUND_LENGTHS = [3, 4, 5];

export function MiniGame1EmergencyLanding({ onWin, onPause }: MiniGame1Props) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState<'brief' | 'showing' | 'input' | 'failed' | 'landing'>('brief');
  const [sequence, setSequence] = useState<EmergencyButtonColor[]>(() => generateSimonSequence(ROUND_LENGTHS[0]));
  const [playerInputs, setPlayerInputs] = useState<EmergencyButtonColor[]>([]);
  const [litButton, setLitButton] = useState<EmergencyButtonColor | null>(null);
  const [statusMsg, setStatusMsg] = useState('Memorize and repeat the emergency control sequence.');
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const playSequence = (seq: EmergencyButtonColor[]) => {
    clearTimers();
    setPhase('showing');
    setPlayerInputs([]);
    setStatusMsg('WATCH SEQUENCE...');

    seq.forEach((color, idx) => {
      const startMs = 450 + idx * 650;
      const t1 = window.setTimeout(() => {
        setLitButton(color);
        sound.playButton(color);
      }, startMs);
      const t2 = window.setTimeout(() => {
        setLitButton(null);
      }, startMs + 420);
      timersRef.current.push(t1, t2);
    });

    const endMs = 450 + seq.length * 650 + 180;
    const tEnd = window.setTimeout(() => {
      setPhase('input');
      setStatusMsg(`YOUR TURN — REPEAT ${seq.length} CONTROLS`);
    }, endMs);
    timersRef.current.push(tEnd);
  };

  const startRound = (idx: number) => {
    const seq = generateSimonSequence(ROUND_LENGTHS[idx]);
    setRoundIdx(idx);
    setSequence(seq);
    playSequence(seq);
  };

  const handlePress = (color: EmergencyButtonColor) => {
    if (phase !== 'input') return;
    sound.unlock();
    setLitButton(color);
    sound.playButton(color);
    const tClear = window.setTimeout(() => setLitButton(null), 180);
    timersRef.current.push(tClear);

    const nextInputs = [...playerInputs, color];
    setPlayerInputs(nextInputs);

    const verdict = validateSimonInput(sequence, nextInputs);
    if (verdict === 'wrong') {
      sound.playHurt();
      setPhase('failed');
      setStatusMsg('OVERRIDE FAILED — THRUSTER DESYNC! RETRY SEQUENCE.');
      return;
    }

    if (verdict === 'correct') {
      if (roundIdx + 1 >= ROUND_LENGTHS.length) {
        sound.playVictory();
        setPhase('landing');
        setStatusMsg('ALL EMERGENCY CONTROLS LOCKED — TOUCHING DOWN ON MOON!');
        const tWin = window.setTimeout(() => onWin(), 1800);
        timersRef.current.push(tWin);
      } else {
        sound.playMatch();
        setPhase('showing');
        setStatusMsg(`STAGE ${roundIdx + 1} STABILIZED! PREPARING NEXT OVERRIDE...`);
        const tNext = window.setTimeout(() => startRound(roundIdx + 1), 900);
        timersRef.current.push(tNext);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
        return;
      }
      if (phase === 'brief' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startRound(0);
        return;
      }
      if (phase === 'failed' && (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        startRound(roundIdx);
        return;
      }
      const keyMap: Record<string, EmergencyButtonColor> = {
        '1': 'red',
        r: 'red',
        R: 'red',
        '2': 'blue',
        b: 'blue',
        B: 'blue',
        '3': 'green',
        g: 'green',
        G: 'green',
        '4': 'yellow',
        y: 'yellow',
        Y: 'yellow',
      };
      if (keyMap[e.key] && phase === 'input') {
        e.preventDefault();
        handlePress(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="relative w-full h-full bg-[#050816] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Cockpit Background */}
      <img
        src={ASSETS.cockpit}
        alt="Spacecraft cockpit emergency console"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full object-cover pixelated opacity-45 transition-transform ${
          phase === 'landing' ? 'scale-105' : ''
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#040714]/85 via-[#040714]/55 to-[#040714]/95" />

      {/* Top HUD */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between gap-3 mb-4">
        <div className="bg-[#0B1226]/95 border-2 border-[#EF4444] px-4 py-2">
          <div className="font-pixel text-xs text-[#EF4444]">
            MINI-GAME 1 · EMERGENCY LANDING
          </div>
          <div className="font-mono-tabular text-xs text-[#E2E8F0]">
            STAGE {roundIdx + 1} / {ROUND_LENGTHS.length} · DAY 23
          </div>
        </div>

        <button
          type="button"
          onClick={onPause}
          className="px-4 py-2 bg-[#0F172A] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
        >
          PAUSE [P]
        </button>
      </div>

      {/* Main Console */}
      <div className="relative z-10 w-full max-w-3xl bg-[#0B1226]/95 pixel-frame p-5 md:p-7">
        <div className="text-center mb-5">
          <div className="font-pixel text-sm md:text-base text-[#F59E0B]">{statusMsg}</div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {sequence.map((_, i) => (
              <span
                key={i}
                className={`w-4 h-4 border-2 ${
                  i < playerInputs.length
                    ? 'bg-[#22C55E] border-[#BBF7D0]'
                    : 'bg-[#0F172A] border-[#475569]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 4 Emergency Control Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BUTTONS.map((btn) => {
            const isLit = litButton === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                disabled={phase !== 'input'}
                onClick={() => handlePress(btn.id)}
                aria-label={`${btn.label} (${btn.system})`}
                className={`p-4 md:p-5 border-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer pixel-btn transition-transform ${
                  isLit
                    ? `${btn.litBg} ${btn.border} scale-105 text-[#090D16]`
                    : `${btn.baseBg} ${btn.border} text-[#F8FAFC] hover:brightness-110`
                } ${phase !== 'input' ? 'opacity-90' : ''}`}
              >
                <span className="font-pixel text-sm md:text-base">{btn.label}</span>
                <span className="text-[11px] font-mono-tabular opacity-90">{btn.system}</span>
                <span className="text-[10px] font-mono-tabular px-2 py-0.5 bg-[#090D16]/40">
                  [{btn.keyHint}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Briefing / Failure / Touchdown Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t-2 border-[#1E293B]">
          {phase === 'brief' && (
            <>
              <p className="text-xs md:text-sm text-[#CBD5E1]">
                Watch the flashing cockpit buttons and repeat the exact sequence to stabilize the ship for lunar landing.
              </p>
              <button
                type="button"
                data-start="true"
                onClick={() => startRound(0)}
                className="shrink-0 px-6 py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
              >
                ACTIVATE OVERRIDE
              </button>
            </>
          )}

          {phase === 'failed' && (
            <>
              <p className="text-xs md:text-sm text-[#FCA5A5]">
                Sequence mismatch! Stay calm and try this override stage again.
              </p>
              <button
                type="button"
                onClick={() => startRound(roundIdx)}
                className="shrink-0 px-6 py-3 bg-[#EF4444] hover:bg-[#F87171] text-[#FFFFFF] font-pixel text-xs md:text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
              >
                RETRY STAGE [R]
              </button>
            </>
          )}

          {phase === 'landing' && (
            <div className="w-full text-center font-pixel text-sm text-[#22C55E]">
              STABILIZATION COMPLETE · DESCENDING TO MOON SURFACE...
            </div>
          )}

          {(phase === 'showing' || phase === 'input') && (
            <div className="w-full text-center text-xs font-mono-tabular text-[#94A3B8]">
              Use mouse/tap or keys 1-4 (R / B / G / Y)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
