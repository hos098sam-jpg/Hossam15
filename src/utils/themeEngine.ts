export interface PlatformThemeConfig {
  enabled: boolean;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export interface ThemePreset {
  id: string;
  label: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  badge?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light-classic',
    label: '☀️ كلاسيك فاتح (نهاري)',
    primaryColor: '#4f46e5',
    bgColor: '#f8fafc',
    textColor: '#0f172a',
    badge: 'افتراضي',
  },
  {
    id: 'royal-motafalsifa',
    label: '🏛️ المتفلسفة الملكي (ذهبي ونيلي)',
    primaryColor: '#d4af37',
    bgColor: '#0d0824',
    textColor: '#f8fafc',
  },
  {
    id: 'dark-slate',
    label: '🌌 كلاسيك داكن (Dark Slate)',
    primaryColor: '#f59e0b',
    bgColor: '#0f172a',
    textColor: '#f8fafc',
  },
  {
    id: 'royal-purple',
    label: '🔮 بنفسجي ملكي عميق',
    primaryColor: '#8b5cf6',
    bgColor: '#090514',
    textColor: '#f8fafc',
  },
  {
    id: 'emerald-green',
    label: '🌿 زمردي هادئ',
    primaryColor: '#10b981',
    bgColor: '#06130e',
    textColor: '#ecfdf5',
  },
  {
    id: 'sky-light',
    label: '🌊 أزرق سماوي مشرق',
    primaryColor: '#0284c7',
    bgColor: '#f0f9ff',
    textColor: '#0c4a6e',
  },
];

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = (hex || '').trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function isLightHex(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55;
}

export function adjustHexColor(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyPlatformThemeColors(
  primaryColor: string,
  bgColor: string,
  textColor?: string,
  persist: boolean = true
): PlatformThemeConfig {
  const p = primaryColor || '#4f46e5';
  const bg = bgColor || '#0d0824';
  const lightBg = isLightHex(bg);
  const txt = textColor || (lightBg ? '#0f172a' : '#f8fafc');
  const surface = lightBg ? '#ffffff' : adjustHexColor(bg, 14);
  const surfaceAlt = lightBg ? adjustHexColor(bg, -8) : adjustHexColor(bg, 24);
  const border = lightBg ? adjustHexColor(bg, -24) : adjustHexColor(bg, 36);
  const muted = lightBg ? '#475569' : '#cbd5e1';
  const primaryContrast = isLightHex(p) ? '#0f172a' : '#ffffff';

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-custom-theme', 'true');
    if (lightBg) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    root.style.setProperty('--theme-primary', p);
    root.style.setProperty('--theme-primary-contrast', primaryContrast);
    root.style.setProperty('--theme-bg', bg);
    root.style.setProperty('--theme-surface', surface);
    root.style.setProperty('--theme-surface-alt', surfaceAlt);
    root.style.setProperty('--theme-text', txt);
    root.style.setProperty('--theme-muted', muted);
    root.style.setProperty('--theme-border', border);
    root.style.setProperty('--motafalsifa-accent', p);
    root.style.setProperty('--motafalsifa-gold', p);

    document.body.style.backgroundColor = bg;
    document.body.style.color = txt;
  }

  if (persist) {
    try {
      localStorage.setItem('sozan_custom_theme_enabled', 'true');
      localStorage.setItem('sozan_primary_color', p);
      localStorage.setItem('sozan_bg_color', bg);
      localStorage.setItem('sozan_text_color', txt);
      localStorage.setItem('theme', lightBg ? 'light' : 'dark');
    } catch {}
  }

  return {
    enabled: true,
    primaryColor: p,
    bgColor: bg,
    textColor: txt,
  };
}

export function resetPlatformThemeColors(persist: boolean = true) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.removeAttribute('data-custom-theme');
    [
      '--theme-primary',
      '--theme-primary-contrast',
      '--theme-bg',
      '--theme-surface',
      '--theme-surface-alt',
      '--theme-text',
      '--theme-muted',
      '--theme-border',
      '--motafalsifa-accent',
      '--motafalsifa-gold',
    ].forEach((prop) => root.style.removeProperty(prop));

    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }

  if (persist) {
    try {
      localStorage.removeItem('sozan_custom_theme_enabled');
      localStorage.removeItem('sozan_primary_color');
      localStorage.removeItem('sozan_bg_color');
      localStorage.removeItem('sozan_text_color');
    } catch {}
  }
}

export function loadSavedThemeColors(): PlatformThemeConfig | null {
  try {
    const enabled = localStorage.getItem('sozan_custom_theme_enabled') === 'true';
    if (!enabled) return null;
    const primaryColor = localStorage.getItem('sozan_primary_color') || '#d4af37';
    const bgColor = localStorage.getItem('sozan_bg_color') || '#0d0824';
    const textColor = localStorage.getItem('sozan_text_color') || '#f8fafc';
    return { enabled: true, primaryColor, bgColor, textColor };
  } catch {
    return null;
  }
}
