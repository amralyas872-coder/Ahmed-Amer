import { useState } from 'react';
import {
  canInstallComponentIntoSlot,
  computeShipRepairPercentage,
  getRepairSystemsFromInstalled,
  getShipStatusLabel,
  isLunarRepairComplete,
  isShipReadyForEarthReturn,
} from '../game/rules';
import { COMPONENT_CATALOG, MACHINE_PROFILES } from '../game/storyData';
import { sound } from '../game/sound';
import type { ComponentId, MachineId, RepairSystemId, SaveState } from '../game/types';

interface SpacecraftHubModalProps {
  save: SaveState;
  initialTab?: 'repair' | 'inventory' | 'log';
  onInstallComponent: (componentId: ComponentId, slotId: RepairSystemId) => void;
  onLaunchToMars?: () => void;
  onLaunchHome?: () => void;
  onClose: () => void;
}

export function SpacecraftHubModal({
  save,
  initialTab = 'repair',
  onInstallComponent,
  onLaunchToMars,
  onLaunchHome,
  onClose,
}: SpacecraftHubModalProps) {
  const [tab, setTab] = useState<'repair' | 'inventory' | 'log'>(initialTab);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>(() => {
    return (
      save.collectedComponents.find((c) => !save.installedComponents.includes(c)) ?? null
    );
  });
  const [diagnosticMsg, setDiagnosticMsg] = useState<string>(
    'Select a recovered component on the left, then click its matching spacecraft system slot to install.'
  );
  const [justInstalledSlot, setJustInstalledSlot] = useState<RepairSystemId | null>(null);

  const repairSystems = getRepairSystemsFromInstalled(save.installedComponents);
  const repairPct = computeShipRepairPercentage(save.installedComponents);
  const statusLabel = getShipStatusLabel(save.installedComponents);
  const availableComponents = save.collectedComponents.filter(
    (c) => !save.installedComponents.includes(c)
  );
  const lunarReady = isLunarRepairComplete(save.installedComponents);
  const earthReady = isShipReadyForEarthReturn(save.installedComponents);

  const handleSlotClick = (slotId: RepairSystemId) => {
    if (!selectedComponent) {
      const slot = repairSystems.find((s) => s.id === slotId);
      setDiagnosticMsg(
        slot
          ? `${slot.label}: ${slot.status.toUpperCase()} — ${slot.description}`
          : 'Select an un-installed component first.'
      );
      return;
    }

    const check = canInstallComponentIntoSlot(
      selectedComponent,
      slotId,
      save.installedComponents,
      save.collectedComponents
    );
    if (!check.ok) {
      sound.playMismatch();
      setDiagnosticMsg(check.reason ?? 'Incompatible system slot.');
      return;
    }

    sound.playInstallWeld();
    setJustInstalledSlot(slotId);
    window.setTimeout(() => setJustInstalledSlot(null), 900);

    const compInfo = COMPONENT_CATALOG[selectedComponent];
    setDiagnosticMsg(`INSTALLED: ${compInfo.name} calibrated and locked into ${slotId.replace('_', ' ').toUpperCase()}.`);
    onInstallComponent(selectedComponent, slotId);

    const nextAvailable = availableComponents.filter((c) => c !== selectedComponent);
    setSelectedComponent(nextAvailable[0] ?? null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040714]/90 flex items-center justify-center p-3 md:p-6 pointer-events-auto"
      role="dialog"
      aria-label="Spacecraft Hub and Mission Log"
    >
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#0B1226] pixel-frame flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-[#0F172A] border-b-2 border-[#334155] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-pixel text-base md:text-lg text-[#F8FAFC]">
              SPACECRAFT HUB · DAY {save.missionDay}
            </h2>
            <p className="text-xs font-mono-tabular text-[#94A3B8] mt-0.5">
              SHIP STATUS: <span className="text-[#F59E0B]">{statusLabel}</span> · {repairPct}% RESTORED
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playButton('ui');
                setTab('repair');
              }}
              className={`px-3 py-2 text-xs font-pixel border-2 cursor-pointer pixel-btn ${
                tab === 'repair'
                  ? 'bg-[#F59E0B] text-[#090D16] border-[#FEF3C7]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:border-[#64748B]'
              }`}
            >
              REPAIR BAY
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton('ui');
                setTab('inventory');
              }}
              className={`px-3 py-2 text-xs font-pixel border-2 cursor-pointer pixel-btn ${
                tab === 'inventory'
                  ? 'bg-[#F59E0B] text-[#090D16] border-[#FEF3C7]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:border-[#64748B]'
              }`}
            >
              INVENTORY ({save.collectedComponents.length}/6)
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton('ui');
                setTab('log');
              }}
              className={`px-3 py-2 text-xs font-pixel border-2 cursor-pointer pixel-btn ${
                tab === 'log'
                  ? 'bg-[#F59E0B] text-[#090D16] border-[#FEF3C7]'
                  : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:border-[#64748B]'
              }`}
            >
              NASA GUIDE
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Spacecraft Hub"
              className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] text-xs font-pixel border-2 border-[#475569] cursor-pointer pixel-btn"
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {tab === 'repair' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Ready-to-Install Components & Telemetry */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#0F172A] border-2 border-[#334155] p-4">
                  <div className="text-xs font-pixel text-[#38BDF8] mb-2">
                    COLLECTED COMPONENTS TO INSTALL
                  </div>
                  {availableComponents.length === 0 ? (
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      No uninstalled components in cargo. Explore and complete machine missions to recover more parts.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {availableComponents.map((compId) => {
                        const comp = COMPONENT_CATALOG[compId];
                        const isSel = selectedComponent === compId;
                        return (
                          <button
                            key={compId}
                            type="button"
                            onClick={() => {
                              sound.playButton('ui');
                              setSelectedComponent(compId);
                            }}
                            className={`text-left p-3 border-2 cursor-pointer pixel-btn ${
                              isSel
                                ? 'bg-[#1E3A8A]/60 border-[#38BDF8] text-[#F8FAFC]'
                                : 'bg-[#090D16] border-[#334155] text-[#CBD5E1] hover:border-[#64748B]'
                            }`}
                          >
                            <div className="font-pixel text-xs text-[#F59E0B]">{comp.name}</div>
                            <div className="text-xs text-[#94A3B8] mt-1">{comp.description}</div>
                            <div className="text-[11px] font-mono-tabular text-[#38BDF8] mt-1.5">
                              Target Slot: {comp.targetSystem?.replace('_', ' ').toUpperCase()}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Diagnostic Console */}
                <div className="bg-[#050816] border-2 border-[#1E293B] p-4">
                  <div className="text-xs font-pixel text-[#F59E0B] mb-1.5">DIAGNOSTIC TERMINAL</div>
                  <p className="text-xs font-mono-tabular text-[#E2E8F0] leading-relaxed">
                    {diagnosticMsg}
                  </p>
                </div>

                {/* Launch Triggers when Milestones Reached */}
                {lunarReady && save.screen === 'explore_moon' && onLaunchToMars && (
                  <button
                    type="button"
                    onClick={onLaunchToMars}
                    className="w-full py-3.5 px-4 bg-[#22C55E] hover:bg-[#4ADE80] text-[#052E16] font-pixel text-sm border-2 border-[#BBF7D0] cursor-pointer pixel-btn"
                  >
                    LUNAR REPAIR COMPLETE — PREPARE LAUNCH
                  </button>
                )}

                {earthReady && save.screen === 'explore_mars' && onLaunchHome && (
                  <button
                    type="button"
                    onClick={onLaunchHome}
                    className="w-full py-3.5 px-4 bg-[#22C55E] hover:bg-[#4ADE80] text-[#052E16] font-pixel text-sm border-2 border-[#BBF7D0] cursor-pointer pixel-btn"
                  >
                    ALL SYSTEMS ONLINE — RETURN TO EARTH (DAY 123)
                  </button>
                )}
              </div>

              {/* Right: Interactive 6-System Spacecraft Diagram */}
              <div className="lg:col-span-7 bg-[#0F172A] border-2 border-[#334155] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-pixel text-xs text-[#E2E8F0]">
                    SIX CORE SPACECRAFT SYSTEMS
                  </span>
                  <span className="font-mono-tabular text-xs text-[#38BDF8]">
                    {save.installedComponents.length} / 6 MODULES INSTALLED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {repairSystems.map((slot) => {
                    const isFlashing = justInstalledSlot === slot.id;
                    const isValidTarget =
                      selectedComponent &&
                      COMPONENT_CATALOG[selectedComponent]?.targetSystem === slot.id;

                    const statusColor =
                      slot.status === 'operational'
                        ? 'text-[#22C55E] border-[#22C55E]/70 bg-[#052E16]/30'
                        : slot.status === 'partial'
                        ? 'text-[#F59E0B] border-[#F59E0B]/70 bg-[#451A03]/30'
                        : 'text-[#EF4444] border-[#EF4444]/60 bg-[#450A0A]/25';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSlotClick(slot.id)}
                        className={`text-left p-3.5 border-2 cursor-pointer pixel-btn transition-transform ${
                          isFlashing
                            ? 'border-[#FACC15] bg-[#713F12]/50 scale-[1.02]'
                            : isValidTarget
                            ? 'border-[#38BDF8] bg-[#0C4A6E]/40'
                            : statusColor
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-xs text-[#F8FAFC]">{slot.label}</span>
                          <span
                            className={`text-[11px] font-mono-tabular font-bold uppercase ${
                              slot.status === 'operational'
                                ? 'text-[#22C55E]'
                                : slot.status === 'partial'
                                ? 'text-[#F59E0B]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {slot.status === 'operational'
                              ? 'ONLINE'
                              : slot.status === 'partial'
                              ? 'PARTIAL'
                              : 'DAMAGED'}
                          </span>
                        </div>
                        <p className="text-xs text-[#CBD5E1] mt-1.5 leading-snug">
                          {slot.description}
                        </p>
                        {isValidTarget && (
                          <div className="mt-2 text-[11px] font-pixel text-[#38BDF8]">
                            CLICK TO INSTALL COMPONENT
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#0F172A] border-2 border-[#334155] p-3">
                  <div className="text-xs font-pixel text-[#38BDF8]">LUNAR SUPPLIES</div>
                  <div className="mt-2 text-sm font-mono-tabular text-[#E2E8F0]">
                    Oxygen: {save.lunarSuppliesCollected.oxygen} · Energy Cells:{' '}
                    {save.lunarSuppliesCollected.energyCells} · Parts:{' '}
                    {save.lunarSuppliesCollected.repairParts}
                  </div>
                </div>
                <div className="bg-[#0F172A] border-2 border-[#334155] p-3">
                  <div className="text-xs font-pixel text-[#F59E0B]">LUNAR SAMPLES</div>
                  <div className="mt-2 text-sm font-mono-tabular text-[#E2E8F0]">
                    {save.lunarSamplesCollected} / 3 Core Samples
                  </div>
                </div>
                <div className="bg-[#0F172A] border-2 border-[#334155] p-3">
                  <div className="text-xs font-pixel text-[#EA580C]">MARS DISCOVERIES</div>
                  <div className="mt-2 text-sm font-mono-tabular text-[#E2E8F0]">
                    {save.marsDiscoveriesRecorded.length} / 3 Recorded
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {save.collectedComponents.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">
                    No major spacecraft hardware components recovered yet.
                  </p>
                ) : (
                  save.collectedComponents.map((id) => {
                    const comp = COMPONENT_CATALOG[id];
                    const installed = save.installedComponents.includes(id);
                    return (
                      <div
                        key={id}
                        className="bg-[#0F172A] border-2 border-[#334155] p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-pixel text-xs text-[#F59E0B]">{comp.name}</span>
                            <span
                              className={`text-[11px] font-mono-tabular ${
                                installed ? 'text-[#22C55E]' : 'text-[#38BDF8]'
                              }`}
                            >
                              {installed ? 'INSTALLED' : 'IN CARGO'}
                            </span>
                          </div>
                          <p className="text-xs text-[#CBD5E1] mt-1.5">{comp.description}</p>
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#94A3B8] mt-3">
                          Source: {comp.sourceMachine} · Day {comp.acquiredOnDay}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-4">
              <div className="bg-[#0F172A] border-2 border-[#0284C7] p-4 text-xs md:text-sm text-[#E2E8F0] leading-relaxed">
                <strong className="font-pixel text-[#38BDF8] block mb-1">
                  HISTORICAL ACCURACY & STORY NOTE
                </strong>
                Jack’s Day 23 malfunction, 10-year rescue estimate, talking machines, and compressed
                123-day Moon-to-Mars rescue are fictional storytelling. The machine names, landing
                dates, scientific instruments, and mission distances below are real NASA history.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(MACHINE_PROFILES) as MachineId[]).map((mId) => {
                  const m = MACHINE_PROFILES[mId];
                  const unlocked = save.discoveredMachines.includes(mId);
                  return (
                    <div
                      key={mId}
                      className="bg-[#0F172A] border-2 border-[#334155] p-4 flex gap-3.5"
                    >
                      <div className="w-16 h-16 shrink-0 bg-[#050816] border-2 border-[#334155] overflow-hidden flex items-center justify-center">
                        {unlocked ? (
                          <img
                            src={m.portraitSrc}
                            alt={m.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover pixelated"
                          />
                        ) : (
                          <span className="font-pixel text-sm text-[#475569]">?</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <h3 className="font-pixel text-xs text-[#F59E0B] leading-snug">
                            {unlocked ? m.fullName : `UNIDENTIFIED (${m.location.toUpperCase()})`}
                          </h3>
                          <div className="text-[11px] font-mono-tabular text-[#94A3B8] mt-0.5">
                            {m.location.toUpperCase()} · {m.era}
                          </div>
                        </div>
                        {unlocked ? (
                          <>
                            <p className="text-xs text-[#E2E8F0] mt-1.5 leading-relaxed">
                              {m.nasaSummary}
                            </p>
                            <ul className="mt-2 space-y-1 text-[11px] text-[#94A3B8] list-disc pl-4">
                              {m.nasaFacts.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-xs text-[#64748B] mt-2">
                            Explore {m.location} to discover this forgotten NASA explorer.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
