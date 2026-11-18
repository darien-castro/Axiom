export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  swatch: {
    primary: string;
    background: string;
    card: string;
    accent: string;
  };
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const THEMES: Record<string, ThemeMeta> = {
  'Rose Pine': {
    id: 'Rose Pine',
    name: 'Rosé Pine',
    description: 'Warm, pastel, and easy on the eyes',
    swatch: {"primary":"#d7827e","background":"#faf4ed","card":"#fffaf3","accent":"#f2e9e1"},
    light: {
      "--background": "#faf4ed",
      "--foreground": "#575279",
      "--card": "#fffaf3",
      "--card-foreground": "#575279",
      "--popover": "#fffaf3",
      "--popover-foreground": "#575279",
      "--primary": "#d7827e",
      "--primary-foreground": "#faf4ed",
      "--secondary": "#dfdad9",
      "--secondary-foreground": "#575279",
      "--muted": "#f2e9e1",
      "--muted-foreground": "#797593",
      "--accent": "#f2e9e1",
      "--accent-foreground": "#d7827e",
      "--destructive": "#b4637a",
      "--border": "#dfdad9",
      "--input": "#dfdad9",
      "--ring": "#d7827e",
      "--chart-1": "#b4637a",
      "--chart-2": "#286983",
      "--chart-3": "#ea9d34",
      "--chart-4": "#56949f",
      "--chart-5": "#907aa9",
      "--radius": "0.625rem",
      "--sidebar": "#faf4ed",
      "--sidebar-foreground": "#575279",
      "--sidebar-primary": "#d7827e",
      "--sidebar-primary-foreground": "#faf4ed",
      "--sidebar-accent": "#f2e9e1",
      "--sidebar-accent-foreground": "#d7827e",
      "--sidebar-border": "#dfdad9",
      "--sidebar-ring": "#d7827e"
},
    dark: {
      "--background": "#191724",
      "--foreground": "#e0def4",
      "--card": "#1f1d2e",
      "--card-foreground": "#e0def4",
      "--popover": "#1f1d2e",
      "--popover-foreground": "#e0def4",
      "--primary": "#ebbcba",
      "--primary-foreground": "#191724",
      "--secondary": "#26233a",
      "--secondary-foreground": "#e0def4",
      "--muted": "#26233a",
      "--muted-foreground": "#908caa",
      "--accent": "#26233a",
      "--accent-foreground": "#ebbcba",
      "--destructive": "#eb6f92",
      "--border": "#26233a",
      "--input": "#26233a",
      "--ring": "#ebbcba",
      "--chart-1": "#eb6f92",
      "--chart-2": "#31748f",
      "--chart-3": "#f6c177",
      "--chart-4": "#9ccfd8",
      "--chart-5": "#c4a7e7",
      "--sidebar": "#191724",
      "--sidebar-foreground": "#e0def4",
      "--sidebar-primary": "#ebbcba",
      "--sidebar-primary-foreground": "#191724",
      "--sidebar-accent": "#26233a",
      "--sidebar-accent-foreground": "#ebbcba",
      "--sidebar-border": "#26233a",
      "--sidebar-ring": "#ebbcba"
}
  },
  'Nord': {
    id: 'Nord',
    name: 'Nord Arctic',
    description: 'Clean arctic slate and cool blue tones',
    swatch: {"primary":"#5e81ac","background":"#eceff4","card":"#e5e9f0","accent":"#d8dee9"},
    light: {
      "--background": "#eceff4",
      "--foreground": "#2e3440",
      "--card": "#e5e9f0",
      "--card-foreground": "#2e3440",
      "--popover": "#e5e9f0",
      "--popover-foreground": "#2e3440",
      "--primary": "#5e81ac",
      "--primary-foreground": "#eceff4",
      "--secondary": "#d8dee9",
      "--secondary-foreground": "#3b4252",
      "--muted": "#e5e9f0",
      "--muted-foreground": "#4c566a",
      "--accent": "#d8dee9",
      "--accent-foreground": "#5e81ac",
      "--destructive": "#bf616a",
      "--border": "#d8dee9",
      "--input": "#d8dee9",
      "--ring": "#5e81ac",
      "--chart-1": "#bf616a",
      "--chart-2": "#a3be8c",
      "--chart-3": "#ebcb8b",
      "--chart-4": "#81a1c1",
      "--chart-5": "#b48ead",
      "--radius": "0.625rem",
      "--sidebar": "#eceff4",
      "--sidebar-foreground": "#2e3440",
      "--sidebar-primary": "#5e81ac",
      "--sidebar-primary-foreground": "#eceff4",
      "--sidebar-accent": "#d8dee9",
      "--sidebar-accent-foreground": "#5e81ac",
      "--sidebar-border": "#d8dee9",
      "--sidebar-ring": "#5e81ac"
},
    dark: {
      "--background": "#2e3440",
      "--foreground": "#eceff4",
      "--card": "#3b4252",
      "--card-foreground": "#eceff4",
      "--popover": "#3b4252",
      "--popover-foreground": "#eceff4",
      "--primary": "#88c0d0",
      "--primary-foreground": "#2e3440",
      "--secondary": "#434c5e",
      "--secondary-foreground": "#e5e9f0",
      "--muted": "#434c5e",
      "--muted-foreground": "#d8dee9",
      "--accent": "#434c5e",
      "--accent-foreground": "#88c0d0",
      "--destructive": "#bf616a",
      "--border": "#434c5e",
      "--input": "#434c5e",
      "--ring": "#88c0d0",
      "--chart-1": "#bf616a",
      "--chart-2": "#a3be8c",
      "--chart-3": "#ebcb8b",
      "--chart-4": "#81a1c1",
      "--chart-5": "#b48ead",
      "--sidebar": "#2e3440",
      "--sidebar-foreground": "#eceff4",
      "--sidebar-primary": "#88c0d0",
      "--sidebar-primary-foreground": "#2e3440",
      "--sidebar-accent": "#434c5e",
      "--sidebar-accent-foreground": "#88c0d0",
      "--sidebar-border": "#434c5e",
      "--sidebar-ring": "#88c0d0"
}
  },
  'Forest': {
    id: 'Forest',
    name: 'Deep Forest',
    description: 'Natural earthy greens and calm moss tones',
    swatch: {"primary":"#57755b","background":"#f2f5f1","card":"#e6ebe5","accent":"#dde3db"},
    light: {
      "--background": "#f2f5f1",
      "--foreground": "#2b362c",
      "--card": "#e6ebe5",
      "--card-foreground": "#2b362c",
      "--popover": "#e6ebe5",
      "--popover-foreground": "#2b362c",
      "--primary": "#57755b",
      "--primary-foreground": "#ffffff",
      "--secondary": "#dde3db",
      "--secondary-foreground": "#3a4a3c",
      "--muted": "#dde3db",
      "--muted-foreground": "#6b7a6d",
      "--accent": "#dde3db",
      "--accent-foreground": "#57755b",
      "--destructive": "#a85757",
      "--border": "#dde3db",
      "--input": "#dde3db",
      "--ring": "#57755b",
      "--chart-1": "#a85757",
      "--chart-2": "#57755b",
      "--chart-3": "#a89457",
      "--chart-4": "#576b75",
      "--chart-5": "#75576a",
      "--radius": "0.625rem",
      "--sidebar": "#f2f5f1",
      "--sidebar-foreground": "#2b362c",
      "--sidebar-primary": "#57755b",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#dde3db",
      "--sidebar-accent-foreground": "#57755b",
      "--sidebar-border": "#dde3db",
      "--sidebar-ring": "#57755b"
},
    dark: {
      "--background": "#1a1f1b",
      "--foreground": "#dfe6e0",
      "--card": "#232b24",
      "--card-foreground": "#dfe6e0",
      "--popover": "#232b24",
      "--popover-foreground": "#dfe6e0",
      "--primary": "#82a688",
      "--primary-foreground": "#1a1f1b",
      "--secondary": "#2f3a31",
      "--secondary-foreground": "#c3ccc5",
      "--muted": "#2f3a31",
      "--muted-foreground": "#89998b",
      "--accent": "#2f3a31",
      "--accent-foreground": "#82a688",
      "--destructive": "#cc7070",
      "--border": "#2f3a31",
      "--input": "#2f3a31",
      "--ring": "#82a688",
      "--chart-1": "#cc7070",
      "--chart-2": "#82a688",
      "--chart-3": "#cca770",
      "--chart-4": "#708bcc",
      "--chart-5": "#a870cc",
      "--sidebar": "#1a1f1b",
      "--sidebar-foreground": "#dfe6e0",
      "--sidebar-primary": "#82a688",
      "--sidebar-primary-foreground": "#1a1f1b",
      "--sidebar-accent": "#2f3a31",
      "--sidebar-accent-foreground": "#82a688",
      "--sidebar-border": "#2f3a31",
      "--sidebar-ring": "#82a688"
}
  },
  'Ocean': {
    id: 'Ocean',
    name: 'Dusty Ocean',
    description: 'Calm oceanic blue-grey and soft steel',
    swatch: {"primary":"#5a798c","background":"#f1f4f6","card":"#e6ebef","accent":"#d1d7de"},
    light: {
      "--background": "#f1f4f6",
      "--foreground": "#2b343d",
      "--card": "#e6ebef",
      "--card-foreground": "#2b343d",
      "--popover": "#e6ebef",
      "--popover-foreground": "#2b343d",
      "--primary": "#5a798c",
      "--primary-foreground": "#ffffff",
      "--secondary": "#d1d7de",
      "--secondary-foreground": "#3b4652",
      "--muted": "#d1d7de",
      "--muted-foreground": "#6c7985",
      "--accent": "#d1d7de",
      "--accent-foreground": "#5a798c",
      "--destructive": "#ad5c63",
      "--border": "#d1d7de",
      "--input": "#d1d7de",
      "--ring": "#5a798c",
      "--chart-1": "#ad5c63",
      "--chart-2": "#658c6d",
      "--chart-3": "#b09163",
      "--chart-4": "#5a798c",
      "--chart-5": "#7d6b8c",
      "--radius": "0.625rem",
      "--sidebar": "#f1f4f6",
      "--sidebar-foreground": "#2b343d",
      "--sidebar-primary": "#5a798c",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#d1d7de",
      "--sidebar-accent-foreground": "#5a798c",
      "--sidebar-border": "#d1d7de",
      "--sidebar-ring": "#5a798c"
},
    dark: {
      "--background": "#1b2229",
      "--foreground": "#d1d7de",
      "--card": "#232b33",
      "--card-foreground": "#d1d7de",
      "--popover": "#232b33",
      "--popover-foreground": "#d1d7de",
      "--primary": "#779db3",
      "--primary-foreground": "#1b2229",
      "--secondary": "#323d47",
      "--secondary-foreground": "#e6ebef",
      "--muted": "#323d47",
      "--muted-foreground": "#8a98a6",
      "--accent": "#323d47",
      "--accent-foreground": "#779db3",
      "--destructive": "#d46e76",
      "--border": "#323d47",
      "--input": "#323d47",
      "--ring": "#779db3",
      "--chart-1": "#d46e76",
      "--chart-2": "#84b38e",
      "--chart-3": "#d6b27c",
      "--chart-4": "#779db3",
      "--chart-5": "#9f87b3",
      "--sidebar": "#1b2229",
      "--sidebar-foreground": "#d1d7de",
      "--sidebar-primary": "#779db3",
      "--sidebar-primary-foreground": "#1b2229",
      "--sidebar-accent": "#323d47",
      "--sidebar-accent-foreground": "#779db3",
      "--sidebar-border": "#323d47",
      "--sidebar-ring": "#779db3"
}
  },
  'MacOS': {
    id: 'MacOS',
    name: 'macOS Slate',
    description: 'Cupertino minimalist grey and system blue',
    swatch: {"primary":"#0071e3","background":"#f5f5f7","card":"#ffffff","accent":"#e8f0fe"},
    light: {
      "--background": "#f5f5f7",
      "--foreground": "#1d1d1f",
      "--card": "#ffffff",
      "--card-foreground": "#1d1d1f",
      "--popover": "#ffffff",
      "--popover-foreground": "#1d1d1f",
      "--primary": "#0071e3",
      "--primary-foreground": "#ffffff",
      "--secondary": "#e8e8ed",
      "--secondary-foreground": "#1d1d1f",
      "--muted": "#f5f5f7",
      "--muted-foreground": "#86868b",
      "--accent": "#e8f0fe",
      "--accent-foreground": "#0071e3",
      "--destructive": "#ff3b30",
      "--border": "#d2d2d7",
      "--input": "#e5e5ea",
      "--ring": "#0071e3",
      "--chart-1": "#0071e3",
      "--chart-2": "#34c759",
      "--chart-3": "#ff9500",
      "--chart-4": "#af52de",
      "--chart-5": "#ff2d55",
      "--radius": "0.625rem",
      "--sidebar": "#f2f2f7",
      "--sidebar-foreground": "#1d1d1f",
      "--sidebar-primary": "#0071e3",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#e5e5ea",
      "--sidebar-accent-foreground": "#0071e3",
      "--sidebar-border": "#d2d2d7",
      "--sidebar-ring": "#0071e3"
},
    dark: {
      "--background": "#1e1e1e",
      "--foreground": "#f5f5f7",
      "--card": "#282828",
      "--card-foreground": "#f5f5f7",
      "--popover": "#282828",
      "--popover-foreground": "#f5f5f7",
      "--primary": "#0a84ff",
      "--primary-foreground": "#ffffff",
      "--secondary": "#323232",
      "--secondary-foreground": "#ebebf5",
      "--muted": "#323232",
      "--muted-foreground": "#8e8e93",
      "--accent": "#3a3a3c",
      "--accent-foreground": "#0a84ff",
      "--destructive": "#ff453a",
      "--border": "#38383a",
      "--input": "#38383a",
      "--ring": "#0a84ff",
      "--chart-1": "#0a84ff",
      "--chart-2": "#30d158",
      "--chart-3": "#ff9f0a",
      "--chart-4": "#bf5af2",
      "--chart-5": "#ff375f",
      "--sidebar": "#1e1e1e",
      "--sidebar-foreground": "#f5f5f7",
      "--sidebar-primary": "#0a84ff",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#323232",
      "--sidebar-accent-foreground": "#0a84ff",
      "--sidebar-border": "#38383a",
      "--sidebar-ring": "#0a84ff"
}
  },
  'Twilight': {
    id: 'Twilight',
    name: 'Twilight Amethyst',
    description: 'Deep mystical amethyst and dusky lavender',
    swatch: {"primary":"#7e6796","background":"#f7f5fa","card":"#f0ebf5","accent":"#e6dfee"},
    light: {
      "--background": "#f7f5fa",
      "--foreground": "#2e2936",
      "--card": "#f0ebf5",
      "--card-foreground": "#2e2936",
      "--popover": "#f0ebf5",
      "--popover-foreground": "#2e2936",
      "--primary": "#7e6796",
      "--primary-foreground": "#ffffff",
      "--secondary": "#e6dfee",
      "--secondary-foreground": "#3e3846",
      "--muted": "#e6dfee",
      "--muted-foreground": "#6b6475",
      "--accent": "#e6dfee",
      "--accent-foreground": "#7e6796",
      "--destructive": "#ab5462",
      "--border": "#e6dfee",
      "--input": "#e6dfee",
      "--ring": "#7e6796",
      "--chart-1": "#ab5462",
      "--chart-2": "#6b826b",
      "--chart-3": "#a88c60",
      "--chart-4": "#657b9c",
      "--chart-5": "#8c6a99",
      "--radius": "0.625rem",
      "--sidebar": "#f7f5fa",
      "--sidebar-foreground": "#2e2936",
      "--sidebar-primary": "#7e6796",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#e6dfee",
      "--sidebar-accent-foreground": "#7e6796",
      "--sidebar-border": "#e6dfee",
      "--sidebar-ring": "#7e6796"
},
    dark: {
      "--background": "#1e1b24",
      "--foreground": "#e6e0f0",
      "--card": "#26222d",
      "--card-foreground": "#e6e0f0",
      "--popover": "#26222d",
      "--popover-foreground": "#e6e0f0",
      "--primary": "#9d86b8",
      "--primary-foreground": "#1e1b24",
      "--secondary": "#332d3b",
      "--secondary-foreground": "#d1c9db",
      "--muted": "#332d3b",
      "--muted-foreground": "#9a92a3",
      "--accent": "#332d3b",
      "--accent-foreground": "#9d86b8",
      "--destructive": "#cc6677",
      "--border": "#332d3b",
      "--input": "#332d3b",
      "--ring": "#9d86b8",
      "--chart-1": "#cc6677",
      "--chart-2": "#859e85",
      "--chart-3": "#c2a67a",
      "--chart-4": "#7c95b8",
      "--chart-5": "#a883b5",
      "--sidebar": "#1e1b24",
      "--sidebar-foreground": "#e6e0f0",
      "--sidebar-primary": "#9d86b8",
      "--sidebar-primary-foreground": "#1e1b24",
      "--sidebar-accent": "#332d3b",
      "--sidebar-accent-foreground": "#9d86b8",
      "--sidebar-border": "#332d3b",
      "--sidebar-ring": "#9d86b8"
}
  },
};

export const THEME_LIST = Object.values(THEMES);

export function applyTheme(themeId: string, isDark: boolean) {
  if (typeof document === 'undefined') return;
  const theme = THEMES[themeId] || THEMES['Rose Pine'];
  const vars = isDark ? theme.dark : theme.light;

  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val);
  }

  try {
    localStorage.setItem('axiom-theme', themeId);
    localStorage.setItem('axiom-dark-mode', isDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  } catch {
    // ignore localstorage errors
  }
}

export function getSavedTheme(): string {
  if (typeof window === 'undefined') return 'Rose Pine';
  try {
    return localStorage.getItem('axiom-theme') || 'Rose Pine';
  } catch {
    return 'Rose Pine';
  }
}

export function getSavedDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('axiom-dark-mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}
