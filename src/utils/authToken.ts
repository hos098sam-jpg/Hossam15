import { auth } from '../auth';
import { getStableBrowserFingerprint } from './deviceFingerprint';

const SERVER_TOKEN_STORAGE_KEY = 'al_motafalsifa_auth_token';
const SESSION_TOKEN_STORAGE_KEY = 'al_motafalsifa_current_session_token';
const LEGACY_SESSION_ID_KEY = 'al_motafalsifa_device_session_id';

let memorySessionToken: string | null = null;

export function saveSessionToken(token: string | null | undefined): void {
  const clean = typeof token === 'string' ? token.trim() : '';
  memorySessionToken = clean || null;
  try {
    if (typeof window === 'undefined') return;
    if (clean) {
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, clean);
      localStorage.setItem(LEGACY_SESSION_ID_KEY, clean);
      localStorage.setItem('al_motafalsifa_session_login_ts', String(Date.now()));
    } else {
      localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_ID_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getSessionToken(): string | null {
  if (memorySessionToken) return memorySessionToken;
  try {
    if (typeof window === 'undefined') return null;
    const val =
      localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_SESSION_ID_KEY);
    if (val && val.trim()) {
      memorySessionToken = val.trim();
      return memorySessionToken;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearSessionToken(): void {
  memorySessionToken = null;
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SESSION_ID_KEY);
    localStorage.removeItem('al_motafalsifa_session_login_ts');
  } catch {
    // ignore
  }
}

export function saveServerAuthToken(token: string | null | undefined): void {
  try {
    if (typeof window === 'undefined') return;
    const clean = typeof token === 'string' ? token.trim() : '';
    if (clean) {
      localStorage.setItem(SERVER_TOKEN_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(SERVER_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function getSavedServerAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem(SERVER_TOKEN_STORAGE_KEY);
    return val && val.trim() ? val.trim() : null;
  } catch {
    return null;
  }
}

export function clearServerAuthToken(): void {
  clearSessionToken();
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SERVER_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function getClientAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const fbToken = await currentUser.getIdToken().catch(() => null);
      if (fbToken && fbToken.trim()) {
        return fbToken.trim();
      }
    }
  } catch {
    // fallback to server-issued HMAC token
  }
  return getSavedServerAuthToken();
}

export async function getClientAuthHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const token = await getClientAuthToken();
  const sessionToken = getSessionToken();
  const fingerprint = typeof window !== 'undefined' ? getStableBrowserFingerprint() : '';

  const headers: Record<string, string> = {
    ...extra,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  if (fingerprint) {
    headers['x-device-fingerprint'] = fingerprint;
  }
  return headers;
}

