import assert from "node:assert/strict";
import { createEventBus } from "../js/core/event-bus.js";
import { createAppState } from "../js/core/app-state.js";
import { createLogger } from "../js/core/logger.js";
import { createJsonRepository } from "../js/repositories/json-repository.js";
import { getLatestRoutineLiveState, isRoutineLiveStateNewer, normalizeDayState, stampRoutineLiveState } from "../js/domain/records.js";

const bus = createEventBus();
let received = 0;
const unsubscribe = bus.on("ping", (payload) => { received += payload; });
assert.equal(bus.emit("ping", 2), 1);
unsubscribe();
bus.emit("ping", 2);
assert.equal(received, 2);

const state = createAppState({ ready: false }, bus);
let stateEvents = 0;
state.subscribe(() => { stateEvents += 1; });
state.setState({ ready: true }, { source: "test" });
assert.equal(state.getState().ready, true);
assert.equal(stateEvents, 1);
assert.throws(() => state.setState(null), /objeto/);

const memory = new Map();
const storage = {
  readJson: (key, fallback) => memory.has(key) ? JSON.parse(memory.get(key)) : fallback,
  writeJson: (key, value) => { memory.set(key, JSON.stringify(value)); return true; },
  removeKeys: (keys) => { keys.forEach((key) => memory.delete(key)); return true; },
};
const repository = createJsonRepository({ key: "test", storage, defaultValue: [], validate: Array.isArray });
assert.deepEqual(repository.read(), []);
repository.write([{ id: 1 }]);
assert.deepEqual(repository.read(), [{ id: 1 }]);
repository.update((items) => [...items, { id: 2 }]);
assert.equal(repository.read().length, 2);

const deviceAwake = stampRoutineLiveState({
  mode: "awake",
  activeStartedAt: 1_000,
}, {}, { now: 1_100, mutationId: "device-a-awake" });
const familySleeping = stampRoutineLiveState({
  ...deviceAwake,
  mode: "sleeping",
  activeStartedAt: 2_000,
  activeType: "sono",
  activeDetail: "Timer",
}, deviceAwake, { now: 2_100, mutationId: "device-b-sleeping" });
assert.equal(getLatestRoutineLiveState(deviceAwake, familySleeping).mode, "sleeping");
assert.equal(getLatestRoutineLiveState(familySleeping, deviceAwake).mode, "sleeping");
assert.equal(isRoutineLiveStateNewer(familySleeping, deviceAwake), true);
assert.equal(isRoutineLiveStateNewer(deviceAwake, familySleeping), false);

const unchangedStaleDevice = stampRoutineLiveState({ ...deviceAwake, dayNotes: "Troca de fralda" }, deviceAwake, {
  now: 3_000,
  mutationId: "device-a-unrelated-change",
});
assert.equal(unchangedStaleDevice.routineStateUpdatedAt, deviceAwake.routineStateUpdatedAt);
assert.equal(getLatestRoutineLiveState(unchangedStaleDevice, familySleeping).mode, "sleeping");

const familyAwakeAgain = stampRoutineLiveState({
  ...familySleeping,
  mode: "awake",
  activeStartedAt: 4_000,
  activeType: "sono",
  activeDetail: "",
}, familySleeping, { now: 4_100, mutationId: "device-b-awake" });
assert.equal(getLatestRoutineLiveState(familySleeping, familyAwakeAgain).mode, "awake");
assert.equal(normalizeDayState(familyAwakeAgain).routineStateMutationId, "device-b-awake");

const sink = { info() {}, warn() {}, error() {}, debug() {} };
const logger = createLogger({ sink });
logger.info("safe", { token: "secret", value: 1 });
assert.equal(logger.recent(1)[0].detail.token, "[redacted]");

console.log("Testes de arquitetura concluídos sem erros.");
