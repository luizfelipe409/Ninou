import * as storage from "../storage/local-storage.js";
import { createEventBus } from "../core/event-bus.js";
import { createAppState } from "../core/app-state.js";
import { createLogger } from "../core/logger.js";
import { createRoutineRepository } from "../repositories/routine-repository.js";
import { createProfileRepository } from "../repositories/profile-repository.js";

const VERSION = "78.4.1";
const bus = createEventBus();
const logger = createLogger({ namespace: "ninou", minLevel: "info" });
const state = createAppState({
  version: VERSION,
  ready: false,
  online: navigator.onLine,
  visibility: document.visibilityState,
  bootPhase: "architecture-ready",
}, bus);

const repositories = Object.freeze({
  routine: createRoutineRepository({ storage }),
  profile: createProfileRepository({ storage }),
});

window.addEventListener("online", () => state.setState({ online: true }, { source: "browser" }));
window.addEventListener("offline", () => state.setState({ online: false }, { source: "browser" }));
document.addEventListener("visibilitychange", () => state.setState({ visibility: document.visibilityState }, { source: "browser" }));
window.addEventListener("ninou:storage-error", (event) => logger.warn("storage_error", event.detail || {}));
window.addEventListener("error", (event) => logger.error("window_error", { message: event.message, source: event.filename, line: event.lineno }));
window.addEventListener("unhandledrejection", (event) => logger.error("unhandled_rejection", event.reason));

const architecture = Object.freeze({ version: VERSION, bus, state, logger, storage, repositories });
Object.defineProperty(window, "NinouArchitecture", { value: architecture, configurable: false, enumerable: false, writable: false });
document.documentElement.dataset.ninouArchitecture = VERSION;
logger.info("architecture_ready", { version: VERSION });

export default architecture;
