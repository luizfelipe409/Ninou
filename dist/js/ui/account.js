import { setText } from "../dom/dom.js";
import { buildSyncStatus } from "../services/account-service.js";

export function renderSyncStatus({ syncTitle, syncText, online, email }) {
  const status = buildSyncStatus({ online, email });
  setText(syncTitle, status.title);
  setText(syncText, status.text);
}
