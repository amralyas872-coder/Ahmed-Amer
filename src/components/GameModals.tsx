import { useState } from 'react';
import { COMPONENT_CATALOG, MACHINE_PROFILES } from '../game/storyData';
import { sound } from '../game/sound';
import type { AudioSettings, ComponentId, MachineId } from '../game/types';

interface PauseModalProps {
  canRestartMiniGame: boolean;
  canOpenHub: boolean;
  onResume: () => void;
  onRestartMiniGame: () => void;
  onOpenHub: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
}

export function PauseModal({
  canRestartMiniGame,
  canOpenHub,
  onResume,
  onRestartMiniGame,
  onOpenHub,
  onOpenSettings,
  onReturnToTitle,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#040714]/90 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Mission Paused"
    >
      <div className="w-full max-w-md bg-[#0B1226] pixel-frame p-6 text-center">
        <div className="font-pixel text-xs text-[#38BDF8] mb-1">SYSTEM STANDBY</div>
        <h2 className="font-pixel text-xl text-[#F8FAFC] mb-5">MISSION PAUSED</h2>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              onResume();
            }}
            className="w-full py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
          >
            RESUME MISSION
          </button>

          {canOpenHub && (
            <button
              type="button"
              onClick={() => {
                sound.playButton('ui');
                onOpenHub();
              }}
              className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#38BDF8] font-pixel text-xs border-2 border-[#0284C7] cursor-pointer pixel-btn"
            >
              OPEN SPACECRAFT HUB
            </button>
          )}

          {canRestartMiniGame && (
            <button
              type="button"
              onClick={() => {
                sound.playButton('ui');
                onRestartMiniGame();
              }}
              className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#F59E0B] font-pixel text-xs border-2 border-[#475569] cursor-pointer pixel-btn"
            >
              RESTART MINI-GAME
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              onOpenSettings();
            }}
            className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#E2E8F0] font-pixel text-xs border-2 border-[#475569] cursor-pointer pixel-btn"
          >
            AUDIO &amp; SETTINGS
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              onReturnToTitle();
            }}
            className="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-[#94A3B8] font-pixel text-xs border-2 border-[#334155] cursor-pointer pixel-btn"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingsModalProps {
  settings: AudioSettings;
  hasSave: boolean;
  onUpdateSettings: (next: Partial<AudioSettings>) => void;
  onResetSave: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  hasSave,
  onUpdateSettings,
  onResetSave,
  onClose,
}: SettingsModalProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040714]/90 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Audio and Game Settings"
    >
      <div className="w-full max-w-md bg-[#0B1226] pixel-frame p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="font-pixel text-base md:text-lg text-[#F8FAFC]">AUDIO &amp; SETTINGS</h2>
          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              onClose();
            }}
            aria-label="Close Settings"
            className="px-3 py-1.5 bg-[#1E293B] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0F172A] border-2 border-[#334155] p-3">
            <span className="font-pixel text-xs text-[#E2E8F0]">MASTER AUDIO</span>
            <button
              type="button"
              onClick={() => {
                sound.unlock();
                onUpdateSettings({ muted: !settings.muted });
              }}
              className={`px-3 py-1.5 font-pixel text-xs border-2 cursor-pointer pixel-btn ${
                settings.muted
                  ? 'bg-[#7F1D1D] text-[#FECACA] border-[#EF4444]'
                  : 'bg-[#14532D] text-[#BBF7D0] border-[#22C55E]'
              }`}
            >
              {settings.muted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>

          <label className="block bg-[#0F172A] border-2 border-[#334155] p-3">
            <div className="flex items-center justify-between text-xs font-pixel text-[#38BDF8] mb-2">
              <span>SFX VOLUME</span>
              <span className="font-mono-tabular">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => {
                sound.unlock();
                onUpdateSettings({ sfxVolume: Number(e.target.value) / 100 });
              }}
              className="w-full accent-[#F59E0B] cursor-pointer"
            />
          </label>

          <label className="block bg-[#0F172A] border-2 border-[#334155] p-3">
            <div className="flex items-center justify-between text-xs font-pixel text-[#F59E0B] mb-2">
              <span>MUSIC VOLUME</span>
              <span className="font-mono-tabular">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => {
                sound.unlock();
                onUpdateSettings({ musicVolume: Number(e.target.value) / 100 });
              }}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
          </label>

          {hasSave && (
            <div className="bg-[#0F172A] border-2 border-[#334155] p-3">
              <div className="font-pixel text-xs text-[#94A3B8] mb-2">MISSION SAVE DATA</div>
              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2 bg-[#450A0A] hover:bg-[#7F1D1D] text-[#FCA5A5] font-pixel text-xs border-2 border-[#EF4444]/60 cursor-pointer pixel-btn"
                >
                  ERASE SAVED PROGRESS
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetSave();
                      setConfirmClear(false);
                    }}
                    className="flex-1 py-2 bg-[#DC2626] text-[#FFFFFF] font-pixel text-xs border-2 border-[#FCA5A5] cursor-pointer pixel-btn"
                  >
                    CONFIRM ERASE
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 bg-[#1E293B] text-[#CBD5E1] font-pixel text-xs border-2 border-[#475569] cursor-pointer pixel-btn"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RewardModalProps {
  title: string;
  subtitle: string;
  components: ComponentId[];
  nextHint: string;
  onContinue: () => void;
}

export function RewardModal({
  title,
  subtitle,
  components,
  nextHint,
  onContinue,
}: RewardModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#040714]/90 flex items-center justify-center p-4"
      role="dialog"
      aria-label={title}
    >
      <div className="w-full max-w-lg bg-[#0B1226] pixel-frame p-6">
        <div className="font-pixel text-xs text-[#22C55E]">{subtitle}</div>
        <h2 className="font-pixel text-lg md:text-xl text-[#F8FAFC] mt-1">{title}</h2>

        <div className="mt-4 space-y-2.5">
          {components.map((id) => {
            const comp = COMPONENT_CATALOG[id];
            return (
              <div key={id} className="bg-[#0F172A] border-2 border-[#F59E0B] p-3">
                <div className="font-pixel text-xs text-[#F59E0B]">{comp.name}</div>
                <p className="text-xs text-[#CBD5E1] mt-1">{comp.description}</p>
                <div className="text-[11px] font-mono-tabular text-[#38BDF8] mt-1">
                  Install in Spacecraft Hub → {comp.targetSystem?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs md:text-sm text-[#E2E8F0] leading-relaxed">{nextHint}</p>

        <button
          type="button"
          onClick={() => {
            sound.playButton('ui');
            onContinue();
          }}
          className="mt-5 w-full py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#090D16] font-pixel text-xs md:text-sm border-2 border-[#FEF3C7] cursor-pointer pixel-btn"
        >
          CONTINUE MISSION
        </button>
      </div>
    </div>
  );
}

interface NasaArchiveModalProps {
  discoveredMachines: MachineId[];
  onClose: () => void;
}

export function NasaArchiveModal({ discoveredMachines, onClose }: NasaArchiveModalProps) {
  const allIds = Object.keys(MACHINE_PROFILES) as MachineId[];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040714]/92 flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-label="NASA Space Hardware Archive"
    >
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#0B1226] pixel-frame flex flex-col overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 bg-[#0F172A] border-b-2 border-[#334155] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-pixel text-base md:text-lg text-[#F8FAFC]">
              NASA HARDWARE ARCHIVE &amp; CREDITS
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Real Moon &amp; Mars explorers featured in Jack’s expedition ({discoveredMachines.length}
              /8 discovered in current save)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playButton('ui');
              onClose();
            }}
            className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] border-2 border-[#475569] font-pixel text-xs text-[#F8FAFC] cursor-pointer pixel-btn"
          >
            CLOSE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="bg-[#0F172A] border-2 border-[#0284C7] p-4 text-xs md:text-sm text-[#E2E8F0] leading-relaxed">
            <strong className="font-pixel text-[#38BDF8] block mb-1">
              FACT VS. STORYTELLING
            </strong>
            The Day 23 malfunction, 10-year rescue estimate, talking spacecraft personalities, and
            123-day Moon-to-Mars journey are fictional storytelling crafted for young explorers. Every
            machine name, mission year, landing site, scientific instrument, and engineering fact
            below comes directly from NASA mission archives.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allIds.map((id) => {
              const m = MACHINE_PROFILES[id];
              const unlocked = discoveredMachines.includes(id);
              return (
                <div
                  key={id}
                  className="bg-[#0F172A] border-2 border-[#334155] p-4 flex gap-3.5"
                >
                  <div className="w-16 h-16 shrink-0 bg-[#050816] border-2 border-[#334155] overflow-hidden flex items-center justify-center">
                    <img
                      src={m.portraitSrc}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover pixelated"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <h3 className="font-pixel text-xs text-[#F59E0B] leading-snug">{m.fullName}</h3>
                      <div className="text-[11px] font-mono-tabular text-[#38BDF8] mt-0.5">
                        {m.location.toUpperCase()} · {m.era}
                      </div>
                    </div>
                    <p className="text-xs text-[#E2E8F0] mt-1.5 leading-relaxed">{m.nasaSummary}</p>
                    <ul className="mt-2 space-y-1 text-[11px] text-[#94A3B8] list-disc pl-4">
                      {m.nasaFacts.map((fact, idx) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono-tabular">
                      <span className={unlocked ? 'text-[#22C55E]' : 'text-[#64748B]'}>
                        {unlocked ? 'DISCOVERED IN EXPEDITION' : 'NOT YET MET IN CURRENT SAVE'}
                      </span>
                      <a
                        href={m.nasaReferenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#38BDF8] hover:underline"
                      >
                        NASA NSSDCA / Science ↗
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#050816] border-2 border-[#334155] p-4 text-xs text-[#94A3B8] leading-relaxed">
            <div className="font-pixel text-xs text-[#F59E0B] mb-1">CREDITS &amp; SOURCES</div>
            Historical facts sourced from NASA Space Science Data Coordinated Archive (NSSDCA) and
            NASA Science Mission pages for Apollo 11, Lunar Roving Vehicle, ALSEP, Surveyor, Mars
            Pathfinder (Sojourner), and Mars Exploration Rovers (Spirit &amp; Opportunity).
          </div>
        </div>
      </div>
    </div>
  );
}
