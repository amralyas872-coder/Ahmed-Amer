import { useEffect, useState } from 'react';
import { ASSETS, MACHINE_PROFILES } from '../game/storyData';
import { sound } from '../game/sound';
import type { DialogueLine, MachineId } from '../game/types';

interface DialogueModalProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

export function DialogueModal({ lines, onComplete }: DialogueModalProps) {
  const [index, setIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [imgError, setImgError] = useState(false);

  const current = lines[index];
  const fullText = current?.text ?? '';
  const isTyping = charCount < fullText.length;

  useEffect(() => {
    setIndex(0);
    setCharCount(0);
    setImgError(false);
  }, [lines]);

  useEffect(() => {
    setImgError(false);
    if (!current) return;
    setCharCount(0);
  }, [index, current]);

  useEffect(() => {
    if (!current || !isTyping) return;
    const timer = window.setTimeout(() => {
      setCharCount((c) => {
        const next = Math.min(fullText.length, c + 2);
        if (next % 6 === 0) {
          const pitch =
            current.speakerId === 'jack'
              ? 360
              : current.speakerId === 'computer'
              ? 540
              : current.speakerId === 'narrator'
              ? 200
              : MACHINE_PROFILES[current.speakerId as MachineId]?.voicePitch ?? 300;
          sound.playVoiceBlip(pitch);
        }
        return next;
      });
    }, 22);
    return () => window.clearTimeout(timer);
  }, [charCount, isTyping, fullText, current]);

  const handleAdvance = () => {
    sound.unlock();
    if (isTyping) {
      setCharCount(fullText.length);
      return;
    }
    sound.playButton('ui');
    if (index + 1 < lines.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;

  let portraitSrc = ASSETS.jackPortrait;
  if (current.speakerId !== 'jack' && current.speakerId !== 'computer' && current.speakerId !== 'narrator') {
    portraitSrc = MACHINE_PROFILES[current.speakerId]?.portraitSrc ?? ASSETS.jackPortrait;
  }

  const speakerAccent =
    current.speakerId === 'jack'
      ? 'text-[#38BDF8]'
      : current.speakerId === 'computer'
      ? 'text-[#EF4444]'
      : current.speakerId === 'narrator'
      ? 'text-[#CBD5E1]'
      : 'text-[#F59E0B]';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 p-4 md:p-6 flex justify-center pointer-events-auto"
      role="dialog"
      aria-label={`Dialogue with ${current.speaker}`}
    >
      <div className="w-full max-w-4xl bg-[#0B1226]/95 pixel-frame p-4 md:p-5 flex flex-col sm:flex-row gap-4 items-start">
        {/* Portrait Box */}
        <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 bg-[#050816] border-2 border-[#334155] overflow-hidden flex items-center justify-center">
          {current.speakerId === 'computer' ? (
            <div className="font-pixel text-[11px] text-[#EF4444] text-center px-2">
              SYS ALERT
            </div>
          ) : current.speakerId === 'narrator' ? (
            <div className="font-pixel text-[11px] text-[#94A3B8] text-center px-2">
              LOG
            </div>
          ) : !imgError ? (
            <img
              src={portraitSrc}
              alt={current.speaker}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover pixelated"
            />
          ) : (
            <span className="font-pixel text-xs text-[#F59E0B]">{current.speaker}</span>
          )}
        </div>

        {/* Text Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className={`font-pixel text-sm md:text-base tracking-wide ${speakerAccent}`}>
                {current.speaker}
              </span>
              <span className="text-xs font-mono-tabular text-[#64748B]">
                {index + 1} / {lines.length}
              </span>
            </div>

            <p className="text-sm md:text-base text-[#F1F5F9] leading-relaxed">
              {fullText.slice(0, charCount)}
            </p>

            {current.factTag && (
              <div className="mt-2 text-xs font-mono-tabular text-[#38BDF8] border-t border-[#1E293B] pt-1.5">
                {current.factTag}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-pixel text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer py-1 px-2"
            >
              SKIP SCENE
            </button>
            <button
              type="button"
              onClick={handleAdvance}
              className="px-4 py-2 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
            >
              {isTyping ? 'REVEAL' : index + 1 < lines.length ? 'NEXT [SPACE]' : 'CONTINUE [SPACE]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
