export type GameScreenState =
  | 'title'
  | 'intro_cutscene'
  | 'minigame_1'
  | 'explore_moon'
  | 'minigame_2'
  | 'minigame_3'
  | 'minigame_4'
  | 'chapter5_decision'
  | 'mars_transit'
  | 'explore_mars'
  | 'minigame_5'
  | 'minigame_6'
  | 'ending_cutscene';

export type BodyStateAttr = 'title' | 'playing' | 'paused' | 'gameover';

export type MachineId =
  | 'eagle'
  | 'lrv'
  | 'alsep'
  | 'surveyor'
  | 'apollo_comms'
  | 'sojourner'
  | 'spirit'
  | 'opportunity';

export type ComponentId =
  | 'universal_power_coupler'
  | 'lunar_traction_module'
  | 'diagnostic_sensor_pack'
  | 'deep_space_comms_relay'
  | 'solar_charging_controller'
  | 'deep_space_nav_beacon';

export type RepairSystemId =
  | 'electrical_power'
  | 'stabilization'
  | 'mechanical_systems'
  | 'navigation'
  | 'communication'
  | 'propulsion_support';

export type SystemStatus = 'damaged' | 'partial' | 'operational';

export type StoryStepId =
  | 'intro_malfunction'
  | 'ch1_moon_arrival'
  | 'ch2_eagle_talk'
  | 'ch2_install_coupler'
  | 'ch3_lrv_talk'
  | 'ch3_install_traction'
  | 'ch4_crater_awakening'
  | 'ch4_install_lunar_pack'
  | 'ch5_decision'
  | 'ch6_mars_arrival'
  | 'ch6_clean_panels_ready'
  | 'ch6_sojourner_talk'
  | 'ch7_spirit_talk'
  | 'ch7_opportunity_talk'
  | 'ch7_final_install'
  | 'ending_day_123';

export interface DialogueLine {
  speaker: string;
  speakerId: 'jack' | 'computer' | 'narrator' | MachineId;
  text: string;
  mood?: 'worried' | 'calm' | 'happy' | 'urgent' | 'nostalgic' | 'brave';
  factTag?: string;
}

export interface MachineProfile {
  id: MachineId;
  name: string;
  fullName: string;
  location: 'Moon' | 'Mars';
  era: string;
  personality: string;
  voicePitch: number;
  portraitSrc: string;
  nasaSummary: string;
  nasaFacts: string[];
  nasaReferenceUrl: string;
  storyRole: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'supply' | 'discovery';
  acquiredOnDay: number;
  sourceMachine: string;
  targetSystem?: RepairSystemId;
}

export interface RepairSystemSlot {
  id: RepairSystemId;
  label: string;
  status: SystemStatus;
  requiredComponents: ComponentId[];
  installedComponents: ComponentId[];
  description: string;
}

export interface AudioSettings {
  muted: boolean;
  sfxVolume: number;
  musicVolume: number;
}

export interface SaveState {
  version: number;
  missionDay: number;
  screen: GameScreenState;
  storyStep: StoryStepId;
  completedMiniGames: number[];
  discoveredMachines: MachineId[];
  talkedMachines: MachineId[];
  collectedComponents: ComponentId[];
  installedComponents: ComponentId[];
  inventory: InventoryItem[];
  discoveries: string[];
  lunarSuppliesCollected: {
    oxygen: number;
    energyCells: number;
    repairParts: number;
  };
  lunarSamplesCollected: number;
  marsDiscoveriesRecorded: string[];
  chapter5TurnedBackOnce: boolean;
  endingReached: boolean;
}
