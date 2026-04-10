const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type AttemptState = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
};

const attempts = new Map<string, AttemptState>();

function getState(key: string): AttemptState {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing) {
    const created: AttemptState = {
      count: 0,
      firstAttemptAt: now,
      blockedUntil: null,
    };
    attempts.set(key, created);
    return created;
  }

  if (existing.blockedUntil && existing.blockedUntil <= now) {
    const reset: AttemptState = {
      count: 0,
      firstAttemptAt: now,
      blockedUntil: null,
    };
    attempts.set(key, reset);
    return reset;
  }

  if (now - existing.firstAttemptAt > WINDOW_MS) {
    existing.count = 0;
    existing.firstAttemptAt = now;
    existing.blockedUntil = null;
  }

  return existing;
}

export function getLoginBlockRemainingMs(key: string): number {
  const state = getState(key);
  if (!state.blockedUntil) {
    return 0;
  }

  return Math.max(state.blockedUntil - Date.now(), 0);
}

export function recordFailedLogin(key: string): void {
  const state = getState(key);
  state.count += 1;

  if (state.count >= MAX_ATTEMPTS) {
    state.blockedUntil = Date.now() + BLOCK_MS;
  }
}

export function clearFailedLogins(key: string): void {
  attempts.delete(key);
}
