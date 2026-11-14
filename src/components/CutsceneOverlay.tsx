import { useEffect, useState } from 'react';
import {
  ASSETS,
  MACHINE_PROFILES,
} from '../game/storyData';
import { sound } from '../game/sound';
import type { MachineId } from '../game/types';

interface IntroCutsceneProps {
  onFinishToMiniGame1: () => void;
}

export function IntroCutscene({ onFinishToMiniGame1 }: IntroCutsceneProps) {
  const [step, setStep] = useState(0);

  const scenes = [
    {
      title: 'DEEP SPACE · MISSION DAY 23 OF 90',
      subtitle: 'Routine Expedition Cruise',
      body: 'Astronaut Jack sits inside his spacecraft, surrounded by the endless silence of the cosmos. Earth is a tiny blue marble far behind him. Everything seems calm...',
      alarm: false,
    },
    {
      title: 'CRITICAL SYSTEM FAILURE!',
      subtitle: 'ENGINE CONTROL: DAMAGED · NAVIGATION: OFFLINE · STABILITY: CRITICAL',
      body: 'Suddenly, the engines shudder violently! Red warning lights flash across Jack’s visor as a piercing alarm fills the cabin. The spacecraft begins spinning out of control!',
      alarm: true,
    },
    {
      title: 'EXTERNAL RESCUE ESTIMATE: ~10 YEARS',
      subtitle: 'Emergency Survival Calculation',
      body: 'The emergency computer calculates that waiting for an outside rescue mission could take ten years. Jack grips the controls tightly. He refuses to give up—he must trigger an emergency landing on the Moon!',
      alarm: true,
    },
  ];

  const current = scenes[step];

  useEffect(() => {
    if (current.alarm) {
      sound.playAlarm();
    }
  }, [step, current.alarm]);

  const handleNext = () => {
    sound.unlock();
    sound.playButton('ui');
    if (step + 1 < scenes.length) {
      setStep((s) => s + 1);
    } else {
      onFinishToMiniGame1();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="relative w-full h-full bg-[#040714] flex items-center justify-center p-4 overflow-hidden">
      <img
        src={ASSETS.cockpit}
        alt="Inside Jack's spacecraft cockpit"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full object-cover pixelated opacity-45 ${
          current.alarm ? 'animate-pulse' : ''
        }`}
      />
      <div
        className={`absolute inset-0 ${
          current.alarm
            ? 'bg-gradient-to-t from-[#450A0A]/80 via-[#040714]/70 to-[#040714]/90'
            : 'bg-gradient-to-t from-[#040714]/90 via-[#040714]/60 to-[#040714]/90'
        }`}
      />

      <div className="relative z-10 max-w-2xl w-full bg-[#0B1226]/95 pixel-frame p-6 md:p-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`font-pixel text-xs md:text-sm ${
              current.alarm ? 'text-[#EF4444]' : 'text-[#38BDF8]'
            }`}
          >
            {current.title}
          </span>
          <span className="font-mono-tabular text-xs text-[#94A3B8]">
            {step + 1} / {scenes.length}
          </span>
        </div>

        <div className="text-xs font-mono-tabular text-[#F59E0B] mb-3">{current.subtitle}</div>

        <p className="text-sm md:text-base text-[#F1F5F9] leading-relaxed">{current.body}</p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFinishToMiniGame1}
            className="text-xs font-pixel text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
          >
            SKIP INTRO
          </button>
          <button
            type="button"
            data-start="true"
            onClick={handleNext}
            className="px-6 py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
          >
            {step + 1 < scenes.length ? 'NEXT [SPACE]' : 'TAKE EMERGENCY CONTROLS'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Chapter5DecisionProps {
  onChooseMars: () => void;
  onTurnedBackNote: () => void;
  turnedBackOnce: boolean;
}

export function Chapter5DecisionScreen({
  onChooseMars,
  onTurnedBackNote,
  turnedBackOnce,
}: Chapter5DecisionProps) {
  const [hesitated, setHesitated] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#050816] flex items-center justify-center p-4 overflow-y-auto">
      <img
        src={ASSETS.titleSplitArt}
        alt="The Moon and Mars"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pixelated opacity-35"
      />
      <div className="absolute inset-0 bg-[#040714]/80" />

      <div className="relative z-10 max-w-3xl w-full bg-[#0B1226]/95 pixel-frame p-6 md:p-8">
        <div className="font-pixel text-xs text-[#38BDF8] mb-2">CHAPTER 5 · A HARD DECISION</div>
        <h2 className="font-pixel text-lg md:text-xl text-[#F8FAFC]">
          GO HOME ALONE — OR RESCUE THE MARS ROVERS?
        </h2>

        <p className="mt-3 text-sm md:text-base text-[#CBD5E1] leading-relaxed">
          Your spacecraft is finally flight-capable! For the first time since Day 23, returning to
          Earth’s warm sunlight and blue skies is within reach. Yet Apollo Comms detected faint
          echoes from Mars: <strong>Sojourner</strong>, <strong>Spirit</strong>, and{' '}
          <strong>Opportunity</strong> are trapped beneath red Martian dust, silent and alone.
        </p>

        {(hesitated || turnedBackOnce) && (
          <div className="mt-4 bg-[#451A03]/60 border-2 border-[#F59E0B] p-4 text-sm text-[#FEF3C7] leading-relaxed">
            Jack pauses with his hand on the Earth return thruster. He remembers sitting hopeless
            beside a cold gray lunar boulder on Day 23—and how Eagle, LRV, ALSEP, Surveyor, and
            Apollo Comms never abandoned him.
            <div className="mt-2 font-pixel text-xs text-[#F59E0B]">
              JACK: &ldquo;You helped me when I was lost. Now it is my turn to help your friends.&rdquo;
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              setHesitated(true);
              onTurnedBackNote();
            }}
            className="p-4 text-left bg-[#0F172A] hover:bg-[#1E293B] border-2 border-[#475569] cursor-pointer pixel-btn"
          >
            <div className="font-pixel text-xs text-[#94A3B8]">CHOICE 1</div>
            <div className="font-pixel text-sm text-[#F8FAFC] mt-1">RETURN HOME NOW</div>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Head straight back to Earth safely, leaving the Martian rovers behind in the dust.
            </p>
          </button>

          <button
            type="button"
            data-start="true"
            onClick={() => {
              sound.playVictory();
              onChooseMars();
            }}
            className="p-4 text-left bg-[#451A03]/70 hover:bg-[#7C2D12]/80 border-2 border-[#F59E0B] cursor-pointer pixel-btn"
          >
            <div className="font-pixel text-xs text-[#F59E0B]">CHOICE 2 · EXPEDITION</div>
            <div className="font-pixel text-sm text-[#FEF3C7] mt-1">CONTINUE TO MARS</div>
            <p className="text-xs text-[#FDE68A] mt-1.5">
              Risk the journey to Mars with Eagle to awaken Sojourner, Spirit, and Opportunity!
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarsTransitCutscene({ onArrive }: { onArrive: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onArrive, 2600);
    return () => window.clearTimeout(id);
  }, [onArrive]);

  return (
    <div className="relative w-full h-full bg-[#1C0A0C] flex items-center justify-center p-4 overflow-hidden">
      <img
        src={ASSETS.marsLandscape}
        alt="Approaching Mars"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pixelated opacity-65"
      />
      <div className="relative z-10 max-w-xl w-full bg-[#0B1226]/90 pixel-frame p-6 text-center">
        <div className="font-pixel text-xs text-[#F59E0B]">TRANS-MARS INJECTION COMPLETE</div>
        <h2 className="font-pixel text-lg md:text-xl text-[#F8FAFC] mt-2">
          DESCENDING TO MARS
        </h2>
        <p className="mt-2 text-sm text-[#CBD5E1]">
          Jack and Eagle enter the butterscotch Martian atmosphere to search for Sojourner, Spirit,
          and Opportunity...
        </p>
        <button
          type="button"
          onClick={onArrive}
          className="mt-5 px-6 py-2.5 bg-[#EA580C] text-[#FFFFFF] font-pixel text-xs border-2 border-[#FFEDD5] cursor-pointer pixel-btn"
        >
          LAND ON MARS
        </button>
      </div>
    </div>
  );
}

export function EndingCutscene({ onReturnToTitle }: { onReturnToTitle: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    sound.setMusicMood('ending');
    const t1 = window.setTimeout(() => setStage(1), 2200);
    const t2 = window.setTimeout(() => setStage(2), 4500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const allMachines: MachineId[] = [
    'eagle',
    'lrv',
    'alsep',
    'surveyor',
    'apollo_comms',
    'sojourner',
    'spirit',
    'opportunity',
  ];

  return (
    <div className="relative w-full h-full bg-[#050816] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          stage >= 1
            ? 'bg-gradient-to-b from-[#0C4A6E] via-[#0284C7]/40 to-[#052E16]'
            : 'bg-gradient-to-b from-[#040714] via-[#1C0A0C] to-[#040714]'
        }`}
      />

      <div className="relative z-10 max-w-4xl w-full bg-[#0B1226]/95 pixel-frame p-6 md:p-8 text-center">
        {stage === 0 && (
          <>
            <div className="font-pixel text-xs text-[#38BDF8]">ALL SYSTEMS ONLINE</div>
            <h2 className="font-pixel text-xl md:text-2xl text-[#F8FAFC] mt-2">
              LAUNCHING FROM MARS TOWARD EARTH
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#CBD5E1] max-w-xl mx-auto">
              Mars grows smaller behind the glowing thrusters as Earth grows bright and blue ahead.
              The mission clock advances toward Day 123...
            </p>
          </>
        )}

        {stage === 1 && (
          <>
            <div className="font-pixel text-xs text-[#22C55E]">ATMOSPHERIC ENTRY · DAY 123</div>
            <h2 className="font-pixel text-xl md:text-2xl text-[#F8FAFC] mt-2">
              WELCOME BACK TO EARTH
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#CBD5E1] max-w-xl mx-auto">
              Through bright blue skies, Jack touches down safely on green Earth. He is no longer
              the frightened astronaut who sat alone in lunar dust.
            </p>
          </>
        )}

        {stage >= 2 && (
          <>
            <div className="font-pixel text-xs text-[#F59E0B]">MISSION COMPLETE — DAY 123</div>
            <h2 className="font-pixel text-xl md:text-3xl text-[#F8FAFC] mt-2">
              &ldquo;NO EXPLORER SHOULD EVER BE FORGOTTEN.&rdquo;
            </h2>
            <p className="mt-3 text-sm text-[#CBD5E1] max-w-2xl mx-auto">
              Every machine Jack met—Eagle, the LRV, ALSEP, Surveyor, Apollo Comms, Sojourner,
              Spirit, and Opportunity—helped bring him home safely, and their real NASA science
              lives on.
            </p>

            {/* All 8 Rescued / Remembered Machines Gallery */}
            <div className="mt-5 grid grid-cols-4 sm:grid-cols-8 gap-2">
              {allMachines.map((id) => {
                const m = MACHINE_PROFILES[id];
                return (
                  <div
                    key={id}
                    className="bg-[#050816] border-2 border-[#334155] p-1.5 flex flex-col items-center"
                  >
                    <img
                      src={m.portraitSrc}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover pixelated"
                    />
                    <span className="mt-1 font-pixel text-[9px] text-[#F59E0B] truncate w-full">
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onReturnToTitle}
                className="px-6 py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
              >
                RETURN TO MAIN MENU
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
