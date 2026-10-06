/**
 * Montra Plus personalization — Home layout + accent glass variants.
 * Stored in localStorage per user id (same pattern as theme).
 * No Supabase schema change: user_preferences only has locale/currency.
 */

export type HomeSectionId = "planning" | "analytics" | "activity";

export type AccentTheme = "default" | "forest" | "dusk" | "aurora";

export interface PersonalizationSettings {
  sectionOrder: HomeSectionId[];
  showPlanning: boolean;
  showAnalytics: boolean;
  showActivity: boolean;
  accent: AccentTheme;
}

export const DEFAULT_PERSONALIZATION: PersonalizationSettings = {
  sectionOrder: ["planning", "analytics", "activity"],
  showPlanning: true,
  showAnalytics: true,
  showActivity: true,
  accent: "default",
};

const STORAGE_PREFIX = "montra.personalization.";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function isSectionId(value: unknown): value is HomeSectionId {
  return value === "planning" || value === "analytics" || value === "activity";
}

function isAccent(value: unknown): value is AccentTheme {
  return value === "default" || value === "forest" || value === "dusk" || value === "aurora";
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

  return {
    sectionOrder,
    showPlanning: typeof input.showPlanning === "boolean" ? input.showPlanning : true,
    showAnalytics: typeof input.showAnalytics === "boolean" ? input.showAnalytics : true,
    showActivity: typeof input.showActivity === "boolean" ? input.showActivity : true,
    accent: isAccent(input.accent) ? input.accent : "default",
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

export function applyAccentTheme(accent: AccentTheme): void {
  if (typeof document === "undefined") return;
  if (accent === "default") {
    document.documentElement.removeAttribute("data-accent");
  } else {
    document.documentElement.dataset.accent = accent;
  }
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
