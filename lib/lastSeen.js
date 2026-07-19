// Merkt sich pro Gerät (localStorage), wann ein Bereich zuletzt angesehen wurde,
// damit "neue" Einträge seit dem letzten Besuch markiert werden können.

export function getLastSeen(key) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`lastSeen:${key}`);
}

export function markSeen(key) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lastSeen:${key}`, new Date().toISOString());
}
