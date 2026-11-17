import { validateHousehold } from "./backup.js";

/** Read-only summary; never auto-merge two whole-document revisions. */
export function compareHouseholds(local, remote) {
  validateHousehold(local);
  validateHousehold(remote);
  const sections = ["transactions", "goals", "rules"];
  const result = {};
  for (const key of sections) {
    const a = new Map(local[key].map((x) => [x.id, JSON.stringify(x)]));
    const b = new Map(remote[key].map((x) => [x.id, JSON.stringify(x)]));
    result[key] = {
      onlyLocal: [...a.keys()].filter((id) => !b.has(id)).length,
      onlyRemote: [...b.keys()].filter((id) => !a.has(id)).length,
      changed: [...a.keys()].filter(
        (id) => b.has(id) && a.get(id) !== b.get(id),
      ).length,
    };
  }
  result.settingsChanged =
    JSON.stringify(local.settings) !== JSON.stringify(remote.settings);
  result.membersChanged =
    JSON.stringify(local.members) !== JSON.stringify(remote.members);
  return result;
}
export function canDiscardLocal({ blocked, writing, hasBackup }) {
  return Boolean(blocked && !writing && hasBackup);
}
