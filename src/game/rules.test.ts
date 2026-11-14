import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canInstallComponentIntoSlot,
  computeShipRepairPercentage,
  computeSolarCleanPercentage,
  createEquipmentDeck,
  createInitialSaveState,
  deserializeSaveState,
  doCardsMatch,
  generateSimonSequence,
  getShipStatusLabel,
  getUnlockedMiniGames,
  isShipReadyForEarthReturn,
  isSolarPanelCleaned,
  isSupplyMissionComplete,
  serializeSaveState,
  validateSimonInput,
} from './rules';

test('save state serialization roundtrip preserves campaign fields', () => {
  const initial = createInitialSaveState();
  initial.missionDay = 45;
  initial.completedMiniGames = [1, 2];
  initial.collectedComponents = ['universal_power_coupler'];
  const parsed = deserializeSaveState(serializeSaveState(initial));
  assert.ok(parsed);
  assert.equal(parsed.missionDay, 45);
  assert.deepEqual(parsed.completedMiniGames, [1, 2]);
  assert.deepEqual(parsed.collectedComponents, ['universal_power_coupler']);
});

test('emergency landing Simon sequence validates correct, wrong, and incomplete', () => {
  const seq = generateSimonSequence(4, () => 0.1);
  assert.equal(seq.length, 4);
  assert.equal(validateSimonInput(seq, [seq[0]]), 'incomplete');
  assert.equal(validateSimonInput(seq, seq), 'correct');
  const wrongColor = seq[0] === 'red' ? 'blue' : 'red';
  assert.equal(validateSimonInput(seq, [wrongColor]), 'wrong');
});

test('supply collection checks exact targets (3 O2, 3 Energy, 4 Parts)', () => {
  assert.equal(isSupplyMissionComplete({ oxygen: 3, energyCells: 3, repairParts: 3 }), false);
  assert.equal(isSupplyMissionComplete({ oxygen: 3, energyCells: 3, repairParts: 4 }), true);
});

test('spacecraft repair system validates slot matching and ship status progression', () => {
  const badSlot = canInstallComponentIntoSlot(
    'universal_power_coupler',
    'navigation',
    [],
    ['universal_power_coupler']
  );
  assert.equal(badSlot.ok, false);

  const goodSlot = canInstallComponentIntoSlot(
    'universal_power_coupler',
    'electrical_power',
    [],
    ['universal_power_coupler']
  );
  assert.equal(goodSlot.ok, true);

  assert.equal(getShipStatusLabel([]), 'CRITICAL DAMAGE');
  assert.equal(getShipStatusLabel(['universal_power_coupler']), 'POWER PARTIALLY RESTORED');
  assert.equal(
    getShipStatusLabel([
      'universal_power_coupler',
      'lunar_traction_module',
      'diagnostic_sensor_pack',
      'deep_space_comms_relay',
    ]),
    'FLIGHT CAPABLE'
  );
  assert.equal(
    computeShipRepairPercentage([
      'universal_power_coupler',
      'lunar_traction_module',
      'diagnostic_sensor_pack',
      'deep_space_comms_relay',
      'solar_charging_controller',
      'deep_space_nav_beacon',
    ]),
    100
  );
  assert.equal(
    isShipReadyForEarthReturn([
      'universal_power_coupler',
      'lunar_traction_module',
      'diagnostic_sensor_pack',
      'deep_space_comms_relay',
      'solar_charging_controller',
      'deep_space_nav_beacon',
    ]),
    true
  );
});

test('equipment matching deck builds correct pair counts and matches instruments to functions', () => {
  const deck = createEquipmentDeck('normal');
  assert.equal(deck.length, 12);
  const inst = deck.find((c) => c.kind === 'instrument')!;
  const func = deck.find((c) => c.pairId === inst.pairId && c.kind === 'function')!;
  const other = deck.find((c) => c.pairId !== inst.pairId)!;
  assert.equal(doCardsMatch(inst, func), true);
  assert.equal(doCardsMatch(inst, other), false);
});

test('solar panel cleaning percentage reaches 90% win threshold accurately', () => {
  const dirty = Array(20).fill(1);
  assert.equal(computeSolarCleanPercentage(dirty), 0);
  assert.equal(isSolarPanelCleaned(dirty), false);

  const almostClean = Array(20).fill(0);
  almostClean[0] = 1;
  almostClean[1] = 1; // 18/20 = 90%
  assert.equal(computeSolarCleanPercentage(almostClean), 90);
  assert.equal(isSolarPanelCleaned(almostClean), true);
});

test('mini-games unlock strictly in story progression order', () => {
  const state = createInitialSaveState();
  assert.deepEqual(getUnlockedMiniGames(state), [1]);
  state.completedMiniGames.push(1);
  assert.deepEqual(getUnlockedMiniGames(state), [1, 2]);
  state.completedMiniGames.push(2);
  assert.deepEqual(getUnlockedMiniGames(state), [1, 2]); // needs installation!
  state.installedComponents.push('universal_power_coupler');
  assert.deepEqual(getUnlockedMiniGames(state), [1, 2, 3]);
});
