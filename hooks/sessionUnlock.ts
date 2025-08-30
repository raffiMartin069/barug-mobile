// hooks/sessionUnlock.ts
let unlocked = false

export function isUnlocked() {
  return unlocked
}

export function markUnlocked() {
  unlocked = true
}

export function resetUnlocked() {
  unlocked = false
}
