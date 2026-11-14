/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Chapter5DecisionScreen,
  EndingCutscene,
  IntroCutscene,
  MarsTransitCutscene,
} from './components/CutsceneOverlay';
import { DialogueModal } from './components/DialogueModal';
import { ExplorationCanvas, type InteractTarget } from './components/ExplorationCanvas';
import {
  NasaArchiveModal,
  PauseModal,
  RewardModal,
  SettingsModal,
} from './components/GameModals';
import { SpacecraftHubModal } from './components/SpacecraftHubModal';
import { TitleScreen } from './components/TitleScreen';
import { MiniGame1EmergencyLanding } from './components/minigames/MiniGame1EmergencyLanding';
import { MiniGame2CollectSupplies } from './components/minigames/MiniGame2CollectSupplies';
import { MiniGame3MoonRover } from './components/minigames/MiniGame3MoonRover';
import { MiniGame4MatchEquipment } from './components/minigames/MiniGame4MatchEquipment';
import { MiniGame5CleanSolarPanels } from './components/minigames/MiniGame5CleanSolarPanels';
import { MiniGame6MarsExplorer } from './components/minigames/MiniGame6MarsExplorer';
import {
  SAVE_STORAGE_KEY,
  createInitialSaveState,
  deserializeSaveState,
  isLunarRepairComplete,
  isShipReadyForEarthReturn,
  serializeSaveState,
  type SupplyProgress,
} from './game/rules';
import { sound, type MusicMood } from './game/sound';
import { STORY_DIALOGUES } from './game/storyData';
import type {
  AudioSettings,
  BodyStateAttr,
  ComponentId,
  DialogueLine,
  GameScreenState,
  MachineId,
  RepairSystemId,
  SaveState,
} from './game/types';

type PostDialogueAction =
  | { type: 'none' }
  | { type: 'start_minigame'; id: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'open_hub'; tab?: 'repair' | 'inventory' | 'log' }
  | { type: 'go_chapter5' };

interface ActiveDialogue {
  lines: DialogueLine[];
  after: PostDialogueAction;
}

interface RewardPopupState {
  title: string;
  subtitle: string;
  components: ComponentId[];
  nextHint: string;
  afterDialogueKey?: string;
}

function addUnique<T>(arr: T[], ...items: T[]): T[] {
  const set = new Set(arr);
  for (const item of items) set.add(item);
  return Array.from(set);
}

export default function App() {
  const [save, setSave] = useState<SaveState | null>(() => {
    if (typeof window === 'undefined') return null;
    return deserializeSaveState(window.localStorage.getItem(SAVE_STORAGE_KEY));
  });

  const [screen, setScreen] = useState<GameScreenState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const existing = deserializeSaveState(window.localStorage.getItem(SAVE_STORAGE_KEY));
        return existing && existing.screen !== 'title' ? existing.screen : 'intro_cutscene';
      }
    }
    return 'title';
  });

  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogue | null>(null);
  const [hubOpen, setHubOpen] = useState<{ open: boolean; tab: 'repair' | 'inventory' | 'log' }>({
    open: false,
    tab: 'repair',
  });
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [rewardPopup, setRewardPopup] = useState<RewardPopupState | null>(null);
  const [miniGameKey, setMiniGameKey] = useState(0);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => sound.getSettings());

  // Ensure a valid SaveState exists whenever entering gameplay (including ?autostart=1)
  useEffect(() => {
    if (screen !== 'title' && !save) {
      const fresh = createInitialSaveState();
      setSave(fresh);
      window.localStorage.setItem(SAVE_STORAGE_KEY, serializeSaveState(fresh));
    }
  }, [screen, save]);

  // Persist save changes to localStorage
  useEffect(() => {
    if (save) {
      window.localStorage.setItem(SAVE_STORAGE_KEY, serializeSaveState(save));
    }
  }, [save]);

  // Sync document.body.dataset.state for testability & lifecycle visibility
  useEffect(() => {
    let state: BodyStateAttr = 'playing';
    if (screen === 'title') {
      state = 'title';
    } else if (paused || settingsOpen || archiveOpen) {
      state = 'paused';
    } else if (screen === 'ending_cutscene') {
      state = 'gameover';
    }
    document.body.dataset.state = state;
  }, [screen, paused, settingsOpen, archiveOpen]);

  // Sync adaptive background music mood
  useEffect(() => {
    let mood: MusicMood = 'none';
    if (screen === 'title') mood = 'title';
    else if (screen === 'intro_cutscene' || screen === 'minigame_1') mood = 'malfunction';
    else if (screen === 'ending_cutscene') mood = 'ending';
    else if (activeDialogue) mood = 'dialogue';
    else if (
      screen === 'explore_mars' ||
      screen === 'mars_transit' ||
      screen === 'minigame_5' ||
      screen === 'minigame_6'
    ) {
      mood = 'mars';
    } else if (screen === 'minigame_2' || screen === 'minigame_3' || screen === 'minigame_4') {
      mood = 'explore';
    } else {
      mood = 'moon';
    }
    sound.setMusicMood(mood);
  }, [screen, activeDialogue]);

  const updateSave = useCallback((updater: (prev: SaveState) => SaveState) => {
    setSave((prev) => {
      const base = prev ?? createInitialSaveState();
      return updater(base);
    });
  }, []);

  const handleStartNew = useCallback(() => {
    const fresh = createInitialSaveState();
    setSave(fresh);
    setActiveDialogue(null);
    setHubOpen({ open: false, tab: 'repair' });
    setPaused(false);
    setRewardPopup(null);
    setScreen('intro_cutscene');
  }, []);

  const handleContinue = useCallback(() => {
    const current = save ?? createInitialSaveState();
    setSave(current);
    setActiveDialogue(null);
    setHubOpen({ open: false, tab: 'repair' });
    setPaused(false);
    setRewardPopup(null);
    setScreen(current.screen === 'title' ? 'intro_cutscene' : current.screen);
  }, [save]);

  const handleUpdateAudio = useCallback((next: Partial<AudioSettings>) => {
    sound.updateSettings(next);
    setAudioSettings(sound.getSettings());
  }, []);

  const handleToggleMute = useCallback(() => {
    sound.unlock();
    sound.updateSettings({ muted: !audioSettings.muted });
    setAudioSettings(sound.getSettings());
  }, [audioSettings.muted]);

  const handleResetSave = useCallback(() => {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
    setSave(null);
    setActiveDialogue(null);
    setHubOpen({ open: false, tab: 'repair' });
    setPaused(false);
    setSettingsOpen(false);
    setRewardPopup(null);
    setScreen('title');
  }, []);

  // Objective guidance banner text
  const objectiveText = useMemo(() => {
    if (!save) return 'Explore the lunar surface.';
    if (screen === 'explore_moon') {
      if (!save.completedMiniGames.includes(2)) {
        return 'Walk east and examine the mysterious gold machine emerging from the dust.';
      }
      if (!save.installedComponents.includes('universal_power_coupler')) {
        return 'Return to your Spacecraft Hub and install the Universal Power Coupler.';
      }
      if (!save.completedMiniGames.includes(3)) {
        return 'Travel east past Eagle to wake the Lunar Roving Vehicle (LRV).';
      }
      if (!save.installedComponents.includes('lunar_traction_module')) {
        return 'Install the Lunar Traction & Motor Module in your Spacecraft Hub.';
      }
      if (!save.completedMiniGames.includes(4)) {
        return 'Explore the Ancient Crater in the far east (ALSEP, Surveyor, Apollo Comms).';
      }
      if (!isLunarRepairComplete(save.installedComponents)) {
        return 'Install Diagnostic Sensor Pack & Deep-Space Comms Relay in the Spacecraft Hub.';
      }
      return 'Lunar repair complete! Open Spacecraft Hub to prepare launch.';
    }
    if (screen === 'explore_mars') {
      if (!save.completedMiniGames.includes(5)) {
        return 'Examine the dust-covered rover to clean its solar panels and wake Sojourner.';
      }
      if (!save.talkedMachines.includes('sojourner')) {
        return 'Speak with Sojourner to collect the Solar Charging Controller.';
      }
      if (!save.talkedMachines.includes('spirit')) {
        return 'Head east across Mars to awaken Spirit in Gusev Crater.';
      }
      if (!save.completedMiniGames.includes(6)) {
        return 'Continue east to meet Opportunity and scan 3 Martian discoveries.';
      }
      if (!isShipReadyForEarthReturn(save.installedComponents)) {
        return 'Return to your Spacecraft Hub and install all remaining Mars modules!';
      }
      return 'All 6 systems ONLINE! Open Spacecraft Hub to launch home to Earth (Day 123).';
    }
    return 'Continue your expedition.';
  }, [save, screen]);

  // Exploration interaction handler
  const handleWorldInteract = useCallback(
    (target: InteractTarget) => {
      if (!save) return;
      if (target.kind === 'ship') {
        setHubOpen({ open: true, tab: 'repair' });
        return;
      }

      const id = target.id;
      if (id === 'eagle') {
        updateSave((s) => ({
          ...s,
          discoveredMachines: addUnique(s.discoveredMachines, 'eagle'),
          talkedMachines: addUnique(s.talkedMachines, 'eagle'),
        }));
        if (!save.completedMiniGames.includes(2)) {
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch1_eagle_first_meet,
            after: { type: 'start_minigame', id: 2 },
          });
        } else {
          setActiveDialogue({
            lines: [
              {
                speaker: 'EAGLE',
                speakerId: 'eagle',
                text: 'Stay sharp, Jack. Every part we gather brings you closer to home—and wakes another piece of history.',
                mood: 'calm',
                factTag: 'Apollo 11 Descent Stage remains in the Sea of Tranquility since July 1969.',
              },
            ],
            after: { type: 'none' },
          });
        }
        return;
      }

      if (id === 'lrv') {
        updateSave((s) => ({
          ...s,
          discoveredMachines: addUnique(s.discoveredMachines, 'lrv'),
          talkedMachines: addUnique(s.talkedMachines, 'lrv'),
        }));
        if (!save.completedMiniGames.includes(3)) {
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch3_lrv_meet,
            after: { type: 'start_minigame', id: 3 },
          });
        } else {
          setActiveDialogue({
            lines: [
              {
                speaker: 'LRV',
                speakerId: 'lrv',
                text: 'Those wire-mesh wheels still love lunar dust! Check the Ancient Crater to the east when you install the traction module.',
                mood: 'happy',
              },
            ],
            after: { type: 'none' },
          });
        }
        return;
      }

      if (id === 'alsep' || id === 'surveyor' || id === 'apollo_comms') {
        updateSave((s) => ({
          ...s,
          discoveredMachines: addUnique(
            s.discoveredMachines,
            'alsep',
            'surveyor',
            'apollo_comms'
          ),
          talkedMachines: addUnique(s.talkedMachines, 'alsep', 'surveyor', 'apollo_comms'),
        }));
        if (!save.completedMiniGames.includes(4)) {
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch4_crater_machines,
            after: { type: 'start_minigame', id: 4 },
          });
        } else {
          setActiveDialogue({
            lines: [
              {
                speaker: 'ALSEP',
                speakerId: 'alsep',
                text: 'All crater instruments are calibrated. Head back to your Spacecraft Hub to install your sensor pack and communication relay.',
                mood: 'calm',
              },
            ],
            after: { type: 'none' },
          });
        }
        return;
      }

      if (id === 'sojourner') {
        if (!save.completedMiniGames.includes(5)) {
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch6_mars_arrival,
            after: { type: 'start_minigame', id: 5 },
          });
        } else {
          updateSave((s) => ({
            ...s,
            discoveredMachines: addUnique(s.discoveredMachines, 'sojourner'),
            talkedMachines: addUnique(s.talkedMachines, 'sojourner'),
          }));
          setActiveDialogue({
            lines: [
              {
                speaker: 'SOJOURNER',
                speakerId: 'sojourner',
                text: 'My solar cells are sparkling! Drive east to wake Spirit in Gusev Crater!',
                mood: 'happy',
                factTag: 'Mars Pathfinder & Sojourner landed in Ares Vallis on July 4, 1997.',
              },
            ],
            after: { type: 'none' },
          });
        }
        return;
      }

      if (id === 'spirit') {
        updateSave((s) => ({
          ...s,
          missionDay: Math.max(s.missionDay, 104),
          discoveredMachines: addUnique(s.discoveredMachines, 'spirit'),
          talkedMachines: addUnique(s.talkedMachines, 'spirit'),
        }));
        setActiveDialogue({
          lines: STORY_DIALOGUES.ch7_spirit_meet,
          after: { type: 'none' },
        });
        return;
      }

      if (id === 'opportunity') {
        updateSave((s) => ({
          ...s,
          missionDay: Math.max(s.missionDay, 109),
          discoveredMachines: addUnique(s.discoveredMachines, 'opportunity'),
          talkedMachines: addUnique(s.talkedMachines, 'opportunity'),
        }));
        if (!save.completedMiniGames.includes(6)) {
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch7_opportunity_meet,
            after: { type: 'start_minigame', id: 6 },
          });
        } else {
          setActiveDialogue({
            lines: [
              {
                speaker: 'OPPORTUNITY',
                speakerId: 'opportunity',
                text: 'Your Navigation Beacon is ready! Return to your Spacecraft Hub and bring all systems online for the Day 123 trip home.',
                mood: 'happy',
              },
            ],
            after: { type: 'none' },
          });
        }
      }
    },
    [save, updateSave]
  );

  const handleDialogueComplete = useCallback(() => {
    if (!activeDialogue) return;
    const action = activeDialogue.after;
    setActiveDialogue(null);

    if (action.type === 'start_minigame') {
      const map: Record<1 | 2 | 3 | 4 | 5 | 6, GameScreenState> = {
        1: 'minigame_1',
        2: 'minigame_2',
        3: 'minigame_3',
        4: 'minigame_4',
        5: 'minigame_5',
        6: 'minigame_6',
      };
      setMiniGameKey((k) => k + 1);
      setScreen(map[action.id]);
      updateSave((s) => ({ ...s, screen: map[action.id] }));
    } else if (action.type === 'open_hub') {
      setHubOpen({ open: true, tab: action.tab ?? 'repair' });
    } else if (action.type === 'go_chapter5') {
      setScreen('chapter5_decision');
      updateSave((s) => ({
        ...s,
        screen: 'chapter5_decision',
        storyStep: 'ch5_decision',
        missionDay: Math.max(s.missionDay, 64),
      }));
    }
  }, [activeDialogue, updateSave]);

  // Mini-game Victory Handlers
  const handleWinMiniGame1 = useCallback(() => {
    sound.playVictory();
    updateSave((s) => ({
      ...s,
      missionDay: 23,
      screen: 'explore_moon',
      storyStep: 'ch1_moon_arrival',
      completedMiniGames: addUnique(s.completedMiniGames, 1),
    }));
    setScreen('explore_moon');
    setActiveDialogue({
      lines: STORY_DIALOGUES.intro_after_landing,
      after: { type: 'none' },
    });
  }, [updateSave]);

  const handleWinMiniGame2 = useCallback(
    (supplies: SupplyProgress) => {
      sound.playVictory();
      updateSave((s) => ({
        ...s,
        missionDay: Math.max(s.missionDay, 28),
        screen: 'explore_moon',
        storyStep: 'ch2_install_coupler',
        completedMiniGames: addUnique(s.completedMiniGames, 2),
        collectedComponents: addUnique(s.collectedComponents, 'universal_power_coupler'),
        lunarSuppliesCollected: supplies,
      }));
      setScreen('explore_moon');
      setRewardPopup({
        title: 'SUPPLIES SECURED!',
        subtitle: 'CHAPTER 2 · EAGLE REWARD',
        components: ['universal_power_coupler'],
        nextHint:
          'Return to your Spacecraft Hub [Tab or Ship Hub] and install the Universal Power Coupler in the Electrical Power slot.',
        afterDialogueKey: 'ch2_eagle_reward',
      });
    },
    [updateSave]
  );

  const handleWinMiniGame3 = useCallback(() => {
    sound.playVictory();
    updateSave((s) => ({
      ...s,
      missionDay: Math.max(s.missionDay, 41),
      screen: 'explore_moon',
      storyStep: 'ch3_install_traction',
      completedMiniGames: addUnique(s.completedMiniGames, 3),
      collectedComponents: addUnique(s.collectedComponents, 'lunar_traction_module'),
      lunarSamplesCollected: 3,
    }));
    setScreen('explore_moon');
    setRewardPopup({
      title: 'LUNAR SAMPLES COLLECTED!',
      subtitle: 'CHAPTER 3 · LRV REWARD',
      components: ['lunar_traction_module'],
      nextHint:
        'Install the Lunar Traction & Motor Module in Mechanical Systems to unlock the path to the Ancient Crater.',
      afterDialogueKey: 'ch3_lrv_reward',
    });
  }, [updateSave]);

  const handleWinMiniGame4 = useCallback(() => {
    sound.playVictory();
    updateSave((s) => ({
      ...s,
      missionDay: Math.max(s.missionDay, 60),
      screen: 'explore_moon',
      storyStep: 'ch4_install_lunar_pack',
      completedMiniGames: addUnique(s.completedMiniGames, 4),
      collectedComponents: addUnique(
        s.collectedComponents,
        'diagnostic_sensor_pack',
        'deep_space_comms_relay'
      ),
    }));
    setScreen('explore_moon');
    setRewardPopup({
      title: 'CRATER INSTRUMENTS CALIBRATED!',
      subtitle: 'CHAPTER 4 · ALSEP, SURVEYOR & APOLLO COMMS',
      components: ['diagnostic_sensor_pack', 'deep_space_comms_relay'],
      nextHint:
        'Install both hardware modules in your Spacecraft Hub to achieve Flight Capable status!',
      afterDialogueKey: 'ch4_crater_reward',
    });
  }, [updateSave]);

  const handleWinMiniGame5 = useCallback(() => {
    sound.playVictory();
    updateSave((s) => ({
      ...s,
      missionDay: Math.max(s.missionDay, 96),
      screen: 'explore_mars',
      storyStep: 'ch6_sojourner_talk',
      completedMiniGames: addUnique(s.completedMiniGames, 5),
      discoveredMachines: addUnique(s.discoveredMachines, 'sojourner'),
      talkedMachines: addUnique(s.talkedMachines, 'sojourner'),
      collectedComponents: addUnique(s.collectedComponents, 'solar_charging_controller'),
    }));
    setScreen('explore_mars');
    setRewardPopup({
      title: 'SOLAR ARRAY RESTORED!',
      subtitle: 'CHAPTER 6 · SOJOURNER AWAKENED',
      components: ['solar_charging_controller'],
      nextHint:
        'Sojourner is back online! Follow her lead east across Mars to awaken Spirit and Opportunity.',
      afterDialogueKey: 'ch6_sojourner_meet',
    });
  }, [updateSave]);

  const handleWinMiniGame6 = useCallback(
    (discoveries: string[]) => {
      sound.playVictory();
      updateSave((s) => ({
        ...s,
        missionDay: Math.max(s.missionDay, 112),
        screen: 'explore_mars',
        storyStep: 'ch7_final_install',
        completedMiniGames: addUnique(s.completedMiniGames, 6),
        marsDiscoveriesRecorded: discoveries,
        collectedComponents: addUnique(s.collectedComponents, 'deep_space_nav_beacon'),
      }));
      setScreen('explore_mars');
      setRewardPopup({
        title: 'MARTIAN DISCOVERIES RECORDED!',
        subtitle: 'CHAPTER 7 · ROVER REUNION COMPLETE',
        components: ['deep_space_nav_beacon'],
        nextHint:
          'Return to your Spacecraft Hub and install the Solar Charging Controller & Deep-Space Navigation Beacon to launch home!',
        afterDialogueKey: 'ch7_mars_reward',
      });
    },
    [updateSave]
  );

  // Spacecraft component installation handler
  const handleInstallComponent = useCallback(
    (componentId: ComponentId, _slotId: RepairSystemId) => {
      const currentInstalled = save?.installedComponents ?? [];
      const nextInstalledPreview = addUnique(currentInstalled, componentId);
      const triggeredLunarComplete =
        isLunarRepairComplete(nextInstalledPreview) && !isLunarRepairComplete(currentInstalled);

      updateSave((s) => {
        const nextInstalled = addUnique(s.installedComponents, componentId);
        let nextDay = s.missionDay;
        if (componentId === 'universal_power_coupler') nextDay = Math.max(nextDay, 35);
        if (componentId === 'lunar_traction_module') nextDay = Math.max(nextDay, 50);
        if (isLunarRepairComplete(nextInstalled) && !isLunarRepairComplete(s.installedComponents)) {
          nextDay = Math.max(nextDay, 64);
        }
        return {
          ...s,
          missionDay: nextDay,
          installedComponents: nextInstalled,
        };
      });

      if (triggeredLunarComplete) {
        window.setTimeout(() => {
          setHubOpen({ open: false, tab: 'repair' });
          setActiveDialogue({
            lines: STORY_DIALOGUES.ch5_mars_reveal,
            after: { type: 'go_chapter5' },
          });
        }, 700);
      }
    },
    [save, updateSave]
  );

  const handleLaunchToMars = useCallback(() => {
    setHubOpen({ open: false, tab: 'repair' });
    setScreen('chapter5_decision');
    updateSave((s) => ({ ...s, screen: 'chapter5_decision', storyStep: 'ch5_decision' }));
  }, [updateSave]);

  const handleLaunchHome = useCallback(() => {
    setHubOpen({ open: false, tab: 'repair' });
    setScreen('ending_cutscene');
    updateSave((s) => ({
      ...s,
      missionDay: 123,
      screen: 'ending_cutscene',
      storyStep: 'ending_day_123',
      endingReached: true,
    }));
  }, [updateSave]);

  // Global ESC / P pause shortcut for non-exploration screens
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === 'title' || screen === 'ending_cutscene') return;
      if (hubOpen.open && e.key === 'Escape') {
        e.preventDefault();
        setHubOpen({ open: false, tab: 'repair' });
        return;
      }
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && !activeDialogue && !rewardPopup) {
        if (
          screen === 'minigame_1' ||
          screen === 'minigame_2' ||
          screen === 'minigame_3' ||
          screen === 'minigame_4' ||
          screen === 'minigame_5' ||
          screen === 'minigame_6' ||
          screen === 'chapter5_decision'
        ) {
          e.preventDefault();
          setPaused((p) => !p);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, hubOpen.open, activeDialogue, rewardPopup]);

  const isMiniGameScreen =
    screen === 'minigame_1' ||
    screen === 'minigame_2' ||
    screen === 'minigame_3' ||
    screen === 'minigame_4' ||
    screen === 'minigame_5' ||
    screen === 'minigame_6';

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050816] select-none">
      {screen === 'title' && (
        <TitleScreen
          hasSave={Boolean(save && save.screen !== 'title')}
          savedDay={save?.missionDay ?? 23}
          muted={audioSettings.muted}
          onStartNew={handleStartNew}
          onContinue={handleContinue}
          onOpenArchive={() => setArchiveOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'intro_cutscene' && (
        <IntroCutscene
          onFinishToMiniGame1={() => {
            setMiniGameKey((k) => k + 1);
            setScreen('minigame_1');
            updateSave((s) => ({ ...s, screen: 'minigame_1' }));
          }}
        />
      )}

      {screen === 'minigame_1' && (
        <MiniGame1EmergencyLanding
          key={`mg1-${miniGameKey}`}
          onWin={handleWinMiniGame1}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'explore_moon' && save && (
        <ExplorationCanvas
          planet="moon"
          save={save}
          objectiveText={objectiveText}
          dialogueOpen={Boolean(activeDialogue || rewardPopup)}
          hubOpen={hubOpen.open || paused || settingsOpen}
          onInteract={handleWorldInteract}
          onOpenHub={(tab = 'repair') => setHubOpen({ open: true, tab })}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'minigame_2' && (
        <MiniGame2CollectSupplies
          key={`mg2-${miniGameKey}`}
          onWin={handleWinMiniGame2}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'minigame_3' && (
        <MiniGame3MoonRover
          key={`mg3-${miniGameKey}`}
          onWin={handleWinMiniGame3}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'minigame_4' && (
        <MiniGame4MatchEquipment
          key={`mg4-${miniGameKey}`}
          onWin={handleWinMiniGame4}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'chapter5_decision' && (
        <Chapter5DecisionScreen
          turnedBackOnce={save?.chapter5TurnedBackOnce ?? false}
          onTurnedBackNote={() => updateSave((s) => ({ ...s, chapter5TurnedBackOnce: true }))}
          onChooseMars={() => {
            setScreen('mars_transit');
            updateSave((s) => ({
              ...s,
              missionDay: Math.max(s.missionDay, 85),
              screen: 'mars_transit',
              storyStep: 'ch6_mars_arrival',
            }));
          }}
        />
      )}

      {screen === 'mars_transit' && (
        <MarsTransitCutscene
          onArrive={() => {
            setScreen('explore_mars');
            updateSave((s) => ({ ...s, screen: 'explore_mars', missionDay: Math.max(s.missionDay, 85) }));
            setActiveDialogue({
              lines: STORY_DIALOGUES.ch6_mars_arrival,
              after: { type: 'start_minigame', id: 5 },
            });
          }}
        />
      )}

      {screen === 'explore_mars' && save && (
        <ExplorationCanvas
          planet="mars"
          save={save}
          objectiveText={objectiveText}
          dialogueOpen={Boolean(activeDialogue || rewardPopup)}
          hubOpen={hubOpen.open || paused || settingsOpen}
          onInteract={handleWorldInteract}
          onOpenHub={(tab = 'repair') => setHubOpen({ open: true, tab })}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'minigame_5' && (
        <MiniGame5CleanSolarPanels
          key={`mg5-${miniGameKey}`}
          onWin={handleWinMiniGame5}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'minigame_6' && (
        <MiniGame6MarsExplorer
          key={`mg6-${miniGameKey}`}
          onWin={handleWinMiniGame6}
          onPause={() => setPaused(true)}
        />
      )}

      {screen === 'ending_cutscene' && (
        <EndingCutscene
          onReturnToTitle={() => {
            setScreen('title');
          }}
        />
      )}

      {/* Dialogue Overlay */}
      {activeDialogue && (
        <DialogueModal lines={activeDialogue.lines} onComplete={handleDialogueComplete} />
      )}

      {/* Reward Popup */}
      {rewardPopup && (
        <RewardModal
          title={rewardPopup.title}
          subtitle={rewardPopup.subtitle}
          components={rewardPopup.components}
          nextHint={rewardPopup.nextHint}
          onContinue={() => {
            const key = rewardPopup.afterDialogueKey;
            setRewardPopup(null);
            if (key && STORY_DIALOGUES[key]) {
              setActiveDialogue({
                lines: STORY_DIALOGUES[key],
                after: { type: 'none' },
              });
            }
          }}
        />
      )}

      {/* Spacecraft Hub */}
      {hubOpen.open && save && (
        <SpacecraftHubModal
          save={save}
          initialTab={hubOpen.tab}
          onInstallComponent={handleInstallComponent}
          onLaunchToMars={handleLaunchToMars}
          onLaunchHome={handleLaunchHome}
          onClose={() => setHubOpen({ open: false, tab: 'repair' })}
        />
      )}

      {/* Pause Modal */}
      {paused && (
        <PauseModal
          canRestartMiniGame={isMiniGameScreen}
          canOpenHub={screen === 'explore_moon' || screen === 'explore_mars'}
          onResume={() => setPaused(false)}
          onRestartMiniGame={() => {
            setPaused(false);
            setMiniGameKey((k) => k + 1);
          }}
          onOpenHub={() => {
            setPaused(false);
            setHubOpen({ open: true, tab: 'repair' });
          }}
          onOpenSettings={() => {
            setPaused(false);
            setSettingsOpen(true);
          }}
          onReturnToTitle={() => {
            setPaused(false);
            setActiveDialogue(null);
            setHubOpen({ open: false, tab: 'repair' });
            setScreen('title');
          }}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={audioSettings}
          hasSave={Boolean(save)}
          onUpdateSettings={handleUpdateAudio}
          onResetSave={handleResetSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* NASA Archive Modal */}
      {archiveOpen && (
        <NasaArchiveModal
          discoveredMachines={save?.discoveredMachines ?? []}
          onClose={() => setArchiveOpen(false)}
        />
      )}
    </main>
  );
}
