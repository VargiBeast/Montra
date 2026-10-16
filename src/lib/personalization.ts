/**
 * Montra Plus personalization — Home layout + multi-theme accents.
 * Stored in localStorage per user id. No Supabase schema change.
 *
 * Themes set brand tokens (--accent, --purple*). Semantic income green is preserved.
 */

export type HomeSectionId = "planning" | "analytics" | "activity";

export type AccentTheme =
  | "default"
  | "emerald"
  | "forest"
  | "ocean"
  | "dusk"
  | "aurora"
  | "rose"
  | "sunset"
  | "midnight"
  | "champagne"
  | "slate"
  | "neon"
  | "custom";

export type HomeLayoutStyle = "balanced" | "hero" | "compact" | "cards";

export interface ThemePalette {
  accent: string;
  bright: string;
  deep: string;
}

export interface PersonalizationSettings {
  sectionOrder: HomeSectionId[];
  showPlanning: boolean;
  showAnalytics: boolean;
  showActivity: boolean;
  accent: AccentTheme;
  customColor: string | null;
  layoutStyle: HomeLayoutStyle;
}

export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  sectionOrder: ["planning", "analytics", "activity"],
  showPlanning: true,
  showAnalytics: true,
  showActivity: true,
  accent: "default",
  customColor: null,
  layoutStyle: "balanced",
};

export const THEME_PALETTES: Record<Exclude<AccentTheme, "custom" | "default">, ThemePalette> = {
  emerald: { accent: "#10b981", bright: "#34d399", deep: "#047857" },
  forest: { accent: "#1f7a55", bright: "#34a87a", deep: "#145c3f" },
  ocean: { accent: "#0ea5e9", bright: "#38bdf8", deep: "#0369a1" },
  dusk: { accent: "#8b5cf6", bright: "#a78bfa", deep: "#6d28d9" },
  aurora: { accent: "#2a9d8f", bright: "#5eead4", deep: "#0f766e" },
  rose: { accent: "#f43f5e", bright: "#fb7185", deep: "#be123c" },
  sunset: { accent: "#f59e0b", bright: "#fbbf24", deep: "#d97706" },
  midnight: { accent: "#6366f1", bright: "#818cf8", deep: "#4338ca" },
  champagne: { accent: "#c9a227", bright: "#e8c547", deep: "#9a7209" },
  slate: { accent: "#64748b", bright: "#94a3b8", deep: "#475569" },
  neon: { accent: "#a3e635", bright: "#bef264", deep: "#65a30d" },
};

export const ACCENT_PRESETS: Exclude<AccentTheme, "custom">[] = [
  "default",
  "emerald",
  "forest",
  "ocean",
  "dusk",
  "aurora",
  "rose",
  "sunset",
  "midnight",
  "champagne",
  "slate",
  "neon",
];

export const LAYOUT_STYLES: HomeLayoutStyle[] = ["balanced", "hero", "compact", "cards"];

export const ACCENT_PRESET_COLORS: Record<Exclude<AccentTheme, "custom">, string | null> = {
  default: null,
  emerald: THEME_PALETTES.emerald.accent,
  forest: THEME_PALETTES.forest.accent,
  ocean: THEME_PALETTES.ocean.accent,
  dusk: THEME_PALETTES.dusk.accent,
  aurora: THEME_PALETTES.aurora.accent,
  rose: THEME_PALETTES.rose.accent,
  sunset: THEME_PALETTES.sunset.accent,
  midnight: THEME_PALETTES.midnight.accent,
  champagne: THEME_PALETTES.champagne.accent,
  slate: THEME_PALETTES.slate.accent,
  neon: THEME_PALETTES.neon.accent,
};

const STORAGE_PREFIX = "montra.personalization.";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function isSectionId(value: unknown): value is HomeSectionId {
  return value === "planning" || value === "analytics" || value === "activity";
}

function isAccent(value: unknown): value is AccentTheme {
  return (
    value === "default" ||
    value === "emerald" ||
    value === "forest" ||
    value === "ocean" ||
    value === "dusk" ||
    value === "aurora" ||
    value === "rose" ||
    value === "sunset" ||
    value === "midnight" ||
    value === "champagne" ||
    value === "slate" ||
    value === "neon" ||
    value === "custom"
  );
}

function isLayoutStyle(value: unknown): value is HomeLayoutStyle {
  return value === "balanced" || value === "hero" || value === "compact" || value === "cards";
}

export function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(raw);
  if (short) {
    const s = short[1];
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  }
  const full = /^#([0-9a-fA-F]{6})$/.exec(raw);
  if (full) return `#${full[1].toLowerCase()}`;
  return null;
}

export function resolveAccentColor(settings: PersonalizationSettings): string | null {
  if (settings.accent === "custom") {
    return normalizeHexColor(settings.customColor);
  }
  if (settings.accent === "default") return null;
  return ACCENT_PRESET_COLORS[settings.accent] ?? null;
}

export function normalizePersonalization(raw: unknown): PersonalizationSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PERSONALIZATION };
  const input = raw as Record<string, unknown>;

  const order = Array.isArray(input.sectionOrder)
    ? (input.sectionOrder.filter(isSectionId) as HomeSectionId[])
    : [...DEFAULT_PERSONALIZATION.sectionOrder];

  const seen = new Set<HomeSectionId>();
  const sectionOrder: HomeSectionId[] = [];
  for (const id of order) {
    if (!seen.has(id)) {
      seen.add(id);
      sectionOrder.push(id);
    }
  }
  for (const id of DEFAULT_PERSONALIZATION.sectionOrder) {
    if (!seen.has(id)) sectionOrder.push(id);
  }

  const customColor = normalizeHexColor(
    typeof input.customColor === "string" ? input.customColor : null,
  );

  let accent: AccentTheme = isAccent(input.accent) ? input.accent : "default";
  if (customColor && accent === "default" && input.accent === undefined) {
    accent = "custom";
  }
  if (accent === "custom" && !customColor) {
    accent = "default";
  }

  return {
    sectionOrder,
    showPlanning: typeof input.showPlanning === "boolean" ? input.showPlanning : true,
    showAnalytics: typeof input.showAnalytics === "boolean" ? input.showAnalytics : true,
    showActivity: typeof input.showActivity === "boolean" ? input.showActivity : true,
    accent,
    customColor: accent === "custom" ? customColor : null,
    layoutStyle: isLayoutStyle(input.layoutStyle) ? input.layoutStyle : "balanced",
  };
}

export function readPersonalization(userId: string | null | undefined): PersonalizationSettings {
  if (!userId || typeof window === "undefined") return { ...DEFAULT_PERSONALIZATION };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_PERSONALIZATION };
    return normalizePersonalization(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PERSONALIZATION };
  }
}

export function writePersonalization(userId: string, settings: PersonalizationSettings): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(normalizePersonalization(settings)));
  } catch {
    /* storage unavailable */
  }
}

function clearThemeProps(root: HTMLElement): void {
  const keys = [
    "--accent",
    "--accent-soft",
    "--accent-gradient-a",
    "--accent-gradient-b",
    "--purple",
    "--purple-bright",
    "--purple-deep",
    "--purple-soft",
    "--purple-glow",
    "--green-mid",
    "--green-deep",
    "--green-soft",
    "--green-glow",
  ];
  for (const key of keys) root.style.removeProperty(key);
}

export function applyAccentTheme(settings: PersonalizationSettings | AccentTheme): void {
  if (typeof document === "undefined") return;

  const resolved: PersonalizationSettings =
    typeof settings === "string"
      ? { ...DEFAULT_PERSONALIZATION, accent: settings }
      : settings;

  const root = document.documentElement;
  root.dataset.homeLayout = resolved.layoutStyle;

  if (resolved.accent === "default") {
    clearThemeProps(root);
    root.removeAttribute("data-accent");
    return;
  }

  let accent: string;
  let bright: string;
  let deep: string;

  if (resolved.accent === "custom") {
    const hex = normalizeHexColor(resolved.customColor);
    if (!hex) {
      clearThemeProps(root);
      root.removeAttribute("data-accent");
      return;
    }
    accent = hex;
    bright = hex;
    deep = hex;
  } else {
    const palette = THEME_PALETTES[resolved.accent as Exclude<AccentTheme, "custom" | "default">];
    if (!palette) {
      clearThemeProps(root);
      root.removeAttribute("data-accent");
      return;
    }
    accent = palette.accent;
    bright = palette.bright;
    deep = palette.deep;
  }

  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-soft", `color-mix(in srgb, ${accent} 16%, transparent)`);
  root.style.setProperty("--accent-gradient-a", `color-mix(in srgb, ${accent} 28%, transparent)`);
  root.style.setProperty("--accent-gradient-b", `color-mix(in srgb, ${accent} 14%, transparent)`);

  root.style.setProperty("--purple", accent);
  root.style.setProperty("--purple-bright", bright);
  root.style.setProperty("--purple-deep", deep);
  root.style.setProperty("--purple-soft", `color-mix(in srgb, ${accent} 14%, transparent)`);
  root.style.setProperty("--purple-glow", `color-mix(in srgb, ${accent} 32%, transparent)`);

  root.style.setProperty("--green-mid", deep);
  root.style.setProperty("--green-deep", deep);
  root.style.setProperty("--green-soft", `color-mix(in srgb, ${accent} 14%, transparent)`);
  root.style.setProperty("--green-glow", `color-mix(in srgb, ${accent} 28%, transparent)`);

  root.dataset.accent = resolved.accent === "custom" ? "custom" : resolved.accent;
}

export function moveSection(
  order: HomeSectionId[],
  id: HomeSectionId,
  direction: "up" | "down",
): HomeSectionId[] {
  const next = [...order];
  const index = next.indexOf(id);
  if (index < 0) return next;
  const swap = direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= next.length) return next;
  [next[index], next[swap]] = [next[swap], next[index]];
  return next;
}
