/**
 * Montra Plus personalization — Home layout + accent (presets + custom hex).
 * Stored in localStorage per user id (same pattern as theme).
 * No Supabase schema change: user_preferences only has locale/currency.
 *
 * Brand layer uses CSS --accent / --accent-soft.
 * Semantic income/success green (--green) is NOT overwritten by custom accents.
 */

export type HomeSectionId = "planning" | "analytics" | "activity";

export type AccentTheme = "default" | "forest" | "dusk" | "aurora" | "custom";

export interface PersonalizationSettings {
  sectionOrder: HomeSectionId[];
  showPlanning: boolean;
  showAnalytics: boolean;
  showActivity: boolean;
  accent: AccentTheme;
  /** Hex color when accent === "custom", e.g. "#3b82f6". Null for presets. */
  customColor: string | null;
}

export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  sectionOrder: ["planning", "analytics", "activity"],
  showPlanning: true,
  showAnalytics: true,
  showActivity: true,
  accent: "default",
  customColor: null,
};

/** Preset accent hex values (brand layer only — never replaces semantic --green). */
export const ACCENT_PRESET_COLORS: Record<Exclude<AccentTheme, "custom">, string | null> = {
  default: null,
  forest: "#1f7a55",
  dusk: "#6b5b95",
  aurora: "#2a9d8f",
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
    value === "forest" ||
    value === "dusk" ||
    value === "aurora" ||
    value === "custom"
  );
}

/** Normalize #RGB / #RRGGBB to #rrggbb or null. */
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

/**
 * Apply brand accent to the document.
 * Sets --accent and --accent-soft for brand UI; does NOT overwrite semantic --green.
 */
export function applyAccentTheme(settings: PersonalizationSettings | AccentTheme): void {
  if (typeof document === "undefined") return;

  const resolved: PersonalizationSettings =
    typeof settings === "string"
      ? { ...DEFAULT_PERSONALIZATION, accent: settings }
      : settings;

  const color = resolveAccentColor(resolved);
  const root = document.documentElement;

  if (!color) {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-soft");
    root.style.removeProperty("--accent-gradient-a");
    root.style.removeProperty("--accent-gradient-b");
    root.removeAttribute("data-accent");
    return;
  }

  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-soft", `color-mix(in srgb, ${color} 18%, transparent)`);
  root.style.setProperty("--accent-gradient-a", `color-mix(in srgb, ${color} 28%, transparent)`);
  root.style.setProperty("--accent-gradient-b", `color-mix(in srgb, ${color} 16%, transparent)`);
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
