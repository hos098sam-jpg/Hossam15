import { getClientAuthToken, getSessionToken } from './authToken';
import { getStableBrowserFingerprint } from './deviceFingerprint';

type ForceLogoutCallback = (message?: string) => void;

let isFetchInterceptorInstalled = false;
let activeForceLogoutCallback: ForceLogoutCallback | null = null;

const AUTH_EXEMPT_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/parent-login',
  '/api/auth/login-otp',
  '/api/auth/forgot-password-otp',
  '/api/auth/register-session',
  '/api/auth/session-events',
];

function shouldAttachSessionHeaders(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (typeof window !== 'undefined' && parsed.origin !== window.location.origin) {
      return false;
    }
    if (!parsed.pathname.startsWith('/api/')) return false;
    return !AUTH_EXEMPT_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix));
  } catch {
    return urlStr.startsWith('/api/');
  }
}

/**
 * Installs a global window.fetch interceptor that:
 * 1) Injects x-session-token and x-device-fingerprint on every protected /api/* request
 * 2) Intercepts 401 FORCE_LOGOUT responses and immediately logs out & redirects to login
 */
export function installSessionFetchInterceptor(onForceLogout: ForceLogoutCallback): void {
  activeForceLogoutCallback = onForceLogout;
  if (typeof window === 'undefined' || isFetchInterceptorInstalled) return;
  isFetchInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    let nextInit = init;
    if (shouldAttachSessionHeaders(urlStr)) {
      const sessionToken = getSessionToken();
      const fingerprint = getStableBrowserFingerprint();
      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined)
      );

      if (sessionToken && !headers.has('x-session-token')) {
        headers.set('x-session-token', sessionToken);
      }
      if (fingerprint && !headers.has('x-device-fingerprint')) {
        headers.set('x-device-fingerprint', fingerprint);
      }

      nextInit = {
        ...(init || {}),
        headers,
      };
    }

    const response = await originalFetch(input, nextInit);

    if (response.status === 401 && shouldAttachSessionHeaders(urlStr)) {
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const cloned = response.clone();
          const body = await cloned.json().catch(() => null);
          if (
            body &&
            (body.code === 'FORCE_LOGOUT' ||
              body.forceLogout === true ||
              body.sessionKilled === true ||
              body.code === 'SESSION_KILLED_BY_CONCURRENT_DEVICE')
          ) {
            activeForceLogoutCallback?.(body.error || 'تم تسجيل الدخول من جهاز آخر');
          }
        }
      } catch {
        // ignore clone errors
      }
    }

    return response;
  };
}

/**
 * Connects to the server's Real-Time session channel (WebSocket primary + SSE fallback)
 * to receive immediate `force_logout` eviction events when another device logs in.
 */
export function connectRealtimeSessionWatcher(params: {
  userId: string;
  phone?: string;
  sessionToken: string;
  onForceLogout: ForceLogoutCallback;
}): () => void {
  const { userId, phone, sessionToken, onForceLogout } = params;
  if (typeof window === 'undefined' || !userId || !sessionToken) {
    return () => {};
  }

  let closed = false;
  let ws: WebSocket | null = null;
  let sse: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const fingerprint = getStableBrowserFingerprint();

  const triggerEviction = (msg?: string) => {
    if (closed) return;
    closed = true;
    cleanupSockets();
    onForceLogout(msg || 'تم تسجيل الدخول من جهاز آخر');
  };

  const cleanupSockets = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      try {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      } catch {}
      ws = null;
    }
    if (sse) {
      try {
        sse.onerror = null;
        sse.close();
      } catch {}
      sse = null;
    }
  };

  const startSseFallback = async () => {
    if (closed || typeof EventSource === 'undefined') return;
    try {
      const authToken = await getClientAuthToken();
      if (closed) return;
      const qs = new URLSearchParams({
        userId,
        phone: phone || '',
        sessionToken,
        fp: fingerprint,
      });
      if (authToken) qs.set('authToken', authToken);
      sse = new EventSource(`/api/auth/session-events?${qs.toString()}`);
      sse.addEventListener('force_logout', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data || '{}');
          triggerEviction(payload?.message || 'تم تسجيل الدخول من جهاز آخر');
        } catch {
          triggerEviction('تم تسجيل الدخول من جهاز آخر');
        }
      });
      sse.onerror = () => {
        if (sse) {
          try { sse.close(); } catch {}
          sse = null;
        }
        if (!closed && !reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            void connect();
          }, 5000);
        }
      };
    } catch {
      // ignore SSE errors
    }
  };

  const connect = async () => {
    if (closed) return;
    cleanupSockets();

    try {
      const authToken = await getClientAuthToken();
      if (closed) return;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const qs = new URLSearchParams({
        userId,
        phone: phone || '',
        sessionToken,
        fp: fingerprint,
      });
      if (authToken) qs.set('authToken', authToken);

      const wsUrl = `${proto}//${window.location.host}/ws/session?${qs.toString()}`;
      ws = new WebSocket(wsUrl);

      let opened = false;
      ws.onopen = () => {
        opened = true;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data || '{}'));
          if (data?.event === 'force_logout' || data?.code === 'FORCE_LOGOUT') {
            triggerEviction(data?.message || 'تم تسجيل الدخول من جهاز آخر');
          }
        } catch {}
      };

      ws.onerror = () => {
        if (!opened && !closed) {
          try { ws?.close(); } catch {}
          ws = null;
          void startSseFallback();
        }
      };

      ws.onclose = () => {
        ws = null;
        if (!closed) {
          if (!opened) {
            void startSseFallback();
          } else if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              void connect();
            }, 4000);
          }
        }
      };
    } catch {
      void startSseFallback();
    }
  };

  void connect();

  return () => {
    closed = true;
    cleanupSockets();
  };
}
