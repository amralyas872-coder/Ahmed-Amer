import { useEffect, useState } from 'react';
import {
  createEquipmentDeck,
  doCardsMatch,
  type EquipmentCard,
  type MatchDifficulty,
} from '../../game/rules';
import { sound } from '../../game/sound';

interface MiniGame4Props {
  onWin: () => void;
  onPause: () => void;
}

export function MiniGame4MatchEquipment({ onWin, onPause }: MiniGame4Props) {
  const [difficulty, setDifficulty] = useState<MatchDifficulty>('normal');
  const [deck, setDeck] = useState<EquipmentCard[]>(() => createEquipmentDeck('normal'));
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timerMode, setTimerMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [won, setWon] = useState(false);
  const [failed, setFailed] = useState(false);

  const startNewBoard = (diff: MatchDifficulty, useTimer: boolean) => {
    sound.unlock();
    sound.playButton('ui');
    setDifficulty(diff);
    setTimerMode(useTimer);
    setDeck(createEquipmentDeck(diff));
    setSelected([]);
    setLocked(false);
    setMoves(0);
    setScore(0);
    setTimeLeft(diff === 'hard' ? 110 : diff === 'normal' ? 85 : 60);
    setWon(false);
    setFailed(false);
  };

  useEffect(() => {
    if (!timerMode || won || failed) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          sound.playDefeat();
          setFailed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerMode, won, failed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPause]);

  const handleCardClick = (card: EquipmentCard) => {
    if (locked || won || failed || card.matched || selected.includes(card.uid)) return;
    sound.unlock();
    sound.playFlip();

    const nextSel = [...selected, card.uid];
    setSelected(nextSel);

    if (nextSel.length === 2) {
      setMoves((m) => m + 1);
      const first = deck.find((c) => c.uid === nextSel[0])!;
      const second = card;

      if (doCardsMatch(first, second)) {
        sound.playMatch();
        setScore((s) => s + 100);
        const updated = deck.map((c) =>
          c.uid === first.uid || c.uid === second.uid ? { ...c, matched: true } : c
        );
        setDeck(updated);
        setSelected([]);

        if (updated.every((c) => c.matched)) {
          sound.playVictory();
          setWon(true);
          window.setTimeout(() => onWin(), 1100);
        }
      } else {
        sound.playMismatch();
        setLocked(true);
        window.setTimeout(() => {
          setSelected([]);
          setLocked(false);
        }, 700);
      }
    }
  };

  const matchedPairs = deck.filter((c) => c.matched).length / 2;
  const totalPairs = deck.length / 2;

  return (
    <div className="w-full h-full bg-[#070B19] flex flex-col overflow-y-auto p-3 md:p-6">
      {/* Unified Top Dock */}
      <div className="max-w-5xl w-full mx-auto bg-[#0F172A] pixel-frame p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel text-sm md:text-base text-[#38BDF8]">
            MINI-GAME 4 · MATCH THE EQUIPMENT
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Match each NASA lunar instrument with its scientific function.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#090D16] p-1 border border-[#334155]">
            {(['easy', 'normal', 'hard'] as MatchDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => startNewBoard(d, timerMode)}
                className={`px-2.5 py-1.5 text-[11px] font-pixel cursor-pointer ${
                  difficulty === d
                    ? 'bg-[#F59E0B] text-[#090D16]'
                    : 'text-[#CBD5E1] hover:text-[#FFFFFF]'
                }`}
              >
                {d.toUpperCase()} ({d === 'easy' ? 4 : d === 'normal' ? 6 : 8})
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => startNewBoard(difficulty, !timerMode)}
            className={`px-3 py-2 text-xs font-pixel border-2 cursor-pointer pixel-btn ${
              timerMode
                ? 'bg-[#EF4444]/25 border-[#EF4444] text-[#FCA5A5]'
                : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1]'
            }`}
          >
            {timerMode ? `TIMER: ${timeLeft}S` : 'TIMER: OFF'}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 bg-[#1E293B] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="max-w-5xl w-full mx-auto mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono-tabular text-[#CBD5E1]">
        <span>
          PAIRS CALIBRATED: <strong className="text-[#22C55E]">{matchedPairs}/{totalPairs}</strong>
        </span>
        <span>
          MOVES: <strong className="text-[#F59E0B]">{moves}</strong> · SCORE:{' '}
          <strong className="text-[#38BDF8]">{score}</strong>
        </span>
      </div>

      {/* Card Grid */}
      <div className="max-w-5xl w-full mx-auto mt-3 flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start pb-6">
        {deck.map((card) => {
          const isOpen = card.matched || selected.includes(card.uid);
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleCardClick(card)}
              disabled={card.matched || locked}
              aria-label={isOpen ? card.label : 'Hidden ALSEP Equipment Card'}
              className={`min-h-[108px] md:min-h-[124px] p-3 border-2 text-left flex flex-col justify-between transition-transform duration-150 cursor-pointer ${
                card.matched
                  ? 'bg-[#052E16]/75 border-[#22C55E] text-[#ECFDF5]'
                  : isOpen
                  ? card.kind === 'instrument'
                    ? 'bg-[#1E3A8A]/80 border-[#38BDF8] text-[#F8FAFC]'
                    : 'bg-[#451A03]/80 border-[#F59E0B] text-[#FEF3C7]'
                  : 'bg-[#0F172A] border-[#334155] hover:border-[#64748B] text-[#64748B]'
              }`}
            >
              {isOpen ? (
                <>
                  <span className="font-pixel text-[10px] tracking-wider opacity-85">
                    {card.kind === 'instrument' ? 'INSTRUMENT' : 'FUNCTION'}
                  </span>
                  <span className="text-xs md:text-sm font-semibold leading-snug">
                    {card.label}
                  </span>
                  <span className="text-[10px] font-mono-tabular opacity-75">
                    {card.matched ? 'CALIBRATED' : 'SELECTED'}
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <span className="font-pixel text-base text-[#38BDF8]">NASA</span>
                  <span className="text-[10px] font-mono-tabular text-[#64748B]">ALSEP MODULE</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Win / Timeout Overlay */}
      {(won || failed) && (
        <div className="fixed inset-0 z-30 bg-[#040714]/85 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B1226] pixel-frame p-6 text-center">
            {won ? (
              <>
                <h3 className="font-pixel text-lg text-[#22C55E]">EQUIPMENT CALIBRATED!</h3>
                <p className="mt-2 text-sm text-[#CBD5E1]">
                  Matched all {totalPairs} NASA instruments in {moves} moves!
                </p>
              </>
            ) : (
              <>
                <h3 className="font-pixel text-lg text-[#EF4444]">CALIBRATION TIMED OUT</h3>
                <p className="mt-2 text-sm text-[#CBD5E1]">
                  The challenge timer expired before all instruments were matched.
                </p>
                <button
                  type="button"
                  onClick={() => startNewBoard(difficulty, timerMode)}
                  className="mt-4 w-full py-3 bg-[#EF4444] text-[#FFFFFF] font-pixel text-sm border-2 border-[#FECACA] cursor-pointer pixel-btn"
                >
                  RETRY CALIBRATION
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
