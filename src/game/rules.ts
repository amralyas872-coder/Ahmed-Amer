import { COMPONENT_CATALOG, EQUIPMENT_MATCH_PAIRS, INITIAL_REPAIR_SYSTEMS } from './storyData';
import type {
  ComponentId,
  RepairSystemId,
  RepairSystemSlot,
  SaveState,
  SystemStatus,
} from './types';

export const SAVE_STORAGE_KEY = 'jack_forgotten_explorers_save_v1';

export type EmergencyButtonColor = 'red' | 'blue' | 'green' | 'yellow';

export const EMERGENCY_COLORS: EmergencyButtonColor[] = ['red', 'blue', 'green', 'yellow'];

export function createInitialSaveState(): SaveState {
  return {
    version: 1,
    missionDay: 23,
    screen: 'intro_cutscene',
    storyStep: 'intro_malfunction',
    completedMiniGames: [],
    discoveredMachines: [],
    talkedMachines: [],
    collectedComponents: [],
    installedComponents: [],
    inventory: [],
    discoveries: [],
    lunarSuppliesCollected: {
      oxygen: 0,
      energyCells: 0,
      repairParts: 0,
    },
    lunarSamplesCollected: 0,
    marsDiscoveriesRecorded: [],
    chapter5TurnedBackOnce: false,
    endingReached: false,
  };
}

export function serializeSaveState(state: SaveState): string {
  return JSON.stringify(state);
}

export function deserializeSaveState(raw: string | null): SaveState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return null;
    }
    const base = createInitialSaveState();
    return {
      ...base,
      ...parsed,
      completedMiniGames: Array.isArray(parsed.completedMiniGames) ? parsed.completedMiniGames : [],
      discoveredMachines: Array.isArray(parsed.discoveredMachines) ? parsed.discoveredMachines : [],
      talkedMachines: Array.isArray(parsed.talkedMachines) ? parsed.talkedMachines : [],
      collectedComponents: Array.isArray(parsed.collectedComponents)
        ? parsed.collectedComponents
        : [],
      installedComponents: Array.isArray(parsed.installedComponents)
        ? parsed.installedComponents
        : [],
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      discoveries: Array.isArray(parsed.discoveries) ? parsed.discoveries : [],
      marsDiscoveriesRecorded: Array.isArray(parsed.marsDiscoveriesRecorded)
        ? parsed.marsDiscoveriesRecorded
        : [],
    };
  } catch {
    return null;
  }
}

export function getRepairSystemsFromInstalled(
  installedComponents: ComponentId[]
): RepairSystemSlot[] {
  return INITIAL_REPAIR_SYSTEMS.map((slot) => {
    const installedForSlot = slot.requiredComponents.filter((comp) =>
      installedComponents.includes(comp)
    );
    let status: SystemStatus = 'damaged';
    if (installedForSlot.length === slot.requiredComponents.length) {
      status = 'operational';
    } else if (installedForSlot.length > 0) {
      status = 'partial';
    }
    // Special story progression: installing Universal Power Coupler partially restores Electrical Power
    // until Diagnostic Sensor Pack calibrates the grid, OR let's make Electrical Power operational once Coupler
    // is installed, and show partial stabilization when Lunar Traction is installed!
    // Wait: let's follow the brief carefully:
    // After Mini-game 2 + installing Power Coupler: "POWER SYSTEM: PARTIALLY RESTORED"
    // After Lunar missions (Mini-game 4 + installing Diagnostic Sensor Pack & Comms Relay):
    // "SPACECRAFT STATUS: FLIGHT CAPABLE" / "LUNAR REPAIR COMPLETE"
    // After Mars missions (Solar Charging Controller + Deep-Space Nav Beacon):
    // All 6 systems ONLINE / "MISSION STATUS: READY FOR EARTH RETURN"
    if (slot.id === 'electrical_power') {
      if (installedComponents.includes('solar_charging_controller')) {
        status = 'operational';
      } else if (installedComponents.includes('universal_power_coupler')) {
        status = 'partial';
      }
    }
    if (slot.id === 'navigation') {
      if (installedComponents.includes('deep_space_nav_beacon')) {
        status = 'operational';
      } else if (installedComponents.includes('lunar_traction_module')) {
        status = 'partial';
      }
    }
    return {
      ...slot,
      installedComponents: installedForSlot,
      status,
    };
  });
}

export function canInstallComponentIntoSlot(
  componentId: ComponentId,
  slotId: RepairSystemId,
  installedComponents: ComponentId[],
  collectedComponents: ComponentId[]
): { ok: boolean; reason?: string } {
  if (!collectedComponents.includes(componentId)) {
    return { ok: false, reason: 'Component not yet collected.' };
  }
  if (installedComponents.includes(componentId)) {
    return { ok: false, reason: 'Component is already installed.' };
  }
  const item = COMPONENT_CATALOG[componentId];
  if (!item || item.targetSystem !== slotId) {
    return { ok: false, reason: 'This component belongs to a different spacecraft system.' };
  }
  return { ok: true };
}

export function computeShipRepairPercentage(installedComponents: ComponentId[]): number {
  const total = INITIAL_REPAIR_SYSTEMS.length;
  const count = Math.min(total, new Set(installedComponents).size);
  return Math.round((count / total) * 100);
}

export function isLunarRepairComplete(installedComponents: ComponentId[]): boolean {
  const lunarReq: ComponentId[] = [
    'universal_power_coupler',
    'lunar_traction_module',
    'diagnostic_sensor_pack',
    'deep_space_comms_relay',
  ];
  return lunarReq.every((id) => installedComponents.includes(id));
}

export function isShipReadyForEarthReturn(installedComponents: ComponentId[]): boolean {
  const allReq: ComponentId[] = [
    'universal_power_coupler',
    'lunar_traction_module',
    'diagnostic_sensor_pack',
    'deep_space_comms_relay',
    'solar_charging_controller',
    'deep_space_nav_beacon',
  ];
  return allReq.every((id) => installedComponents.includes(id));
}

export function getShipStatusLabel(installedComponents: ComponentId[]): string {
  if (isShipReadyForEarthReturn(installedComponents)) {
    return 'READY FOR EARTH RETURN';
  }
  if (isLunarRepairComplete(installedComponents)) {
    return 'FLIGHT CAPABLE';
  }
  if (installedComponents.includes('universal_power_coupler')) {
    return 'POWER PARTIALLY RESTORED';
  }
  return 'CRITICAL DAMAGE';
}

// Mini-game 1: Simon-says emergency sequence generator & validator
export function generateSimonSequence(
  length: number,
  rng: () => number = Math.random
): EmergencyButtonColor[] {
  const result: EmergencyButtonColor[] = [];
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(rng() * EMERGENCY_COLORS.length);
    result.push(EMERGENCY_COLORS[idx]);
  }
  return result;
}

export function validateSimonInput(
  sequence: EmergencyButtonColor[],
  playerInputs: EmergencyButtonColor[]
): 'incomplete' | 'correct' | 'wrong' {
  for (let i = 0; i < playerInputs.length; i++) {
    if (playerInputs[i] !== sequence[i]) {
      return 'wrong';
    }
  }
  if (playerInputs.length === sequence.length) {
    return 'correct';
  }
  return 'incomplete';
}

// Mini-game 2: Supply collection win condition
export interface SupplyProgress {
  oxygen: number;
  energyCells: number;
  repairParts: number;
}

export const SUPPLY_TARGETS: SupplyProgress = {
  oxygen: 3,
  energyCells: 3,
  repairParts: 4,
};

export function isSupplyMissionComplete(progress: SupplyProgress): boolean {
  return (
    progress.oxygen >= SUPPLY_TARGETS.oxygen &&
    progress.energyCells >= SUPPLY_TARGETS.energyCells &&
    progress.repairParts >= SUPPLY_TARGETS.repairParts
  );
}

// Mini-game 4: Match the Equipment card deck builder
export type MatchDifficulty = 'easy' | 'normal' | 'hard';

export interface EquipmentCard {
  uid: string;
  pairId: string;
  kind: 'instrument' | 'function';
  label: string;
  iconKey: string;
  matched: boolean;
}

export function getPairCountForDifficulty(diff: MatchDifficulty): number {
  if (diff === 'easy') return 4;
  if (diff === 'hard') return 8;
  return 6;
}

export function createEquipmentDeck(
  difficulty: MatchDifficulty,
  rng: () => number = Math.random
): EquipmentCard[] {
  const count = getPairCountForDifficulty(difficulty);
  const selected = EQUIPMENT_MATCH_PAIRS.slice(0, count);
  const cards: EquipmentCard[] = [];
  for (const pair of selected) {
    cards.push({
      uid: `${pair.id}_inst`,
      pairId: pair.id,
      kind: 'instrument',
      label: pair.instrument,
      iconKey: pair.iconKey,
      matched: false,
    });
    cards.push({
      uid: `${pair.id}_func`,
      pairId: pair.id,
      kind: 'function',
      label: pair.functionText,
      iconKey: pair.iconKey,
      matched: false,
    });
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

export function doCardsMatch(a: EquipmentCard, b: EquipmentCard): boolean {
  return a.uid !== b.uid && a.pairId === b.pairId;
}

// Mini-game 5: Solar panel cleaning math
export function computeSolarCleanPercentage(cells: number[]): number {
  if (cells.length === 0) return 0;
  // Each cell stores dust amount from 0 (clean) to 1 (dirty)
  const totalDust = cells.reduce((acc, dust) => acc + Math.max(0, Math.min(1, dust)), 0);
  const cleanRatio = 1 - totalDust / cells.length;
  return Math.round(cleanRatio * 100);
}

export function isSolarPanelCleaned(cells: number[], threshold = 90): boolean {
  return computeSolarCleanPercentage(cells) >= threshold;
}

// Mini-game progression gating
export function getUnlockedMiniGames(state: SaveState): number[] {
  const unlocked = new Set<number>([1]);
  if (state.completedMiniGames.includes(1)) unlocked.add(2);
  if (state.completedMiniGames.includes(2) && state.installedComponents.includes('universal_power_coupler')) {
    unlocked.add(3);
  }
  if (state.completedMiniGames.includes(3) && state.installedComponents.includes('lunar_traction_module')) {
    unlocked.add(4);
  }
  if (state.completedMiniGames.includes(4) && isLunarRepairComplete(state.installedComponents)) {
    unlocked.add(5);
  }
  if (state.completedMiniGames.includes(5) && state.talkedMachines.includes('opportunity')) {
    unlocked.add(6);
  }
  return Array.from(unlocked).sort((a, b) => a - b);
}
