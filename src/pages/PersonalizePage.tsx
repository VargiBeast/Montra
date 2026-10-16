import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  LayoutList,
  Lock,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  ACCENT_PRESETS,
  LAYOUT_STYLES,
  applyAccentTheme,
  moveSection,
  normalizeHexColor,
  type AccentTheme,
  type HomeLayoutStyle,
  type HomeSectionId,
  type PersonalizationSettings,
  writePersonalization,
} from "../lib/personalization";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";

interface PersonalizePageProps {
  hasPlus: boolean;
  userId: string | null;
  settings: PersonalizationSettings;
  onChange: (next: PersonalizationSettings) => void;
  onBack: () => void;
  onOpenPlus: () => void;
}

const SECTION_META: Record<HomeSectionId, { titleKey: string; bodyKey: string }> = {
  planning: { titleKey: "personalizeSectionPlanning", bodyKey: "personalizeSectionPlanningBody" },
  analytics: { titleKey: "personalizeSectionAnalytics", bodyKey: "personalizeSectionAnalyticsBody" },
  activity: { titleKey: "personalizeSectionActivity", bodyKey: "personalizeSectionActivityBody" },
};

const FALLBACK: Record<string, string> = {
  personalizeTitle: "Personalize Montra",
  personalizeSubtitle: "Themes, layout density, and Home sections — Montra Plus.",
  personalizeLockedTitle: "Personalization is a Plus feature",
  personalizeLockedBody:
    "Unlock themes, layout styles, and Home section order with Montra Plus.",
  personalizeOpenPlus: "Explore Montra Plus",
  personalizeHomeTitle: "Home sections",
  personalizeHomeBody: "Balance stays on top. Toggle and reorder the rest.",
  personalizeSectionPlanning: "Planning",
  personalizeSectionPlanningBody: "Savings goals and wishlist on Home",
  personalizeSectionAnalytics: "Analytics card",
  personalizeSectionAnalyticsBody: "Shortcut to analytics or the Plus preview",
  personalizeSectionActivity: "Recent activity",
  personalizeSectionActivityBody: "Latest transactions on Home",
  personalizeShow: "Show",
  personalizeHide: "Hide",
  personalizeMoveUp: "Move up",
  personalizeMoveDown: "Move down",
  personalizeAccentTitle: "Color themes",
  personalizeAccentBody: "Full look-and-feel presets. Emerald matches a modern dark-green fintech vibe.",
  personalizeAccentDefault: "Void",
  personalizeAccentEmerald: "Emerald",
  personalizeAccentForest: "Forest",
  personalizeAccentOcean: "Ocean",
  personalizeAccentDusk: "Dusk",
  personalizeAccentAurora: "Aurora",
  personalizeAccentRose: "Rose",
  personalizeAccentSunset: "Sunset",
  personalizeAccentMidnight: "Midnight",
  personalizeAccentChampagne: "Champagne",
  personalizeAccentSlate: "Slate",
  personalizeAccentNeon: "Neon",
  personalizeAccentCustom: "Custom color",
  personalizeAccentCustomBody: "Pick any accent. Glass and gradients follow.",
  personalizeAccentCustomLabel: "Custom accent color",
  personalizeLayoutTitle: "Layout style",
  personalizeLayoutBody: "How Home density and balance card feel.",
  personalizeLayoutBalanced: "Balanced",
  personalizeLayoutHero: "Hero",
  personalizeLayoutCompact: "Compact",
  personalizeLayoutCards: "Cards",
  plusBack: "Back",
};

export function PersonalizePage({
  hasPlus,
  userId,
  settings,
  onChange,
  onBack,
  onOpenPlus,
}: PersonalizePageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string) => {
    let value = fillMissingCopy(key, translate(key), language);
    if (!value || value === "\u2014" || value === key) value = FALLBACK[key] ?? key;
    return value;
  };

  function persist(next: PersonalizationSettings) {
    onChange(next);
    applyAccentTheme(next);
    if (userId) writePersonalization(userId, next);
  }

  function setAccent(accent: AccentTheme) {
    if (accent === "custom") {
      const hex = settings.customColor ?? "#10b981";
      persist({ ...settings, accent: "custom", customColor: hex });
      return;
    }
    persist({ ...settings, accent, customColor: null });
  }

  function setCustomColor(raw: string) {
    const normalized = normalizeHexColor(raw);
    if (!normalized) return;
    persist({ ...settings, accent: "custom", customColor: normalized });
  }

  function setLayout(layoutStyle: HomeLayoutStyle) {
    persist({ ...settings, layoutStyle });
  }

  function toggleSection(id: HomeSectionId, visible: boolean) {
    const key =
      id === "planning" ? "showPlanning" : id === "analytics" ? "showAnalytics" : "showActivity";
    persist({ ...settings, [key]: visible });
  }

  function shiftSection(id: HomeSectionId, direction: "up" | "down") {
    persist({ ...settings, sectionOrder: moveSection(settings.sectionOrder, id, direction) });
  }

  const accentLabel = (a: Exclude<AccentTheme, "custom">) => {
    const map: Record<Exclude<AccentTheme, "custom">, string> = {
      default: t("personalizeAccentDefault"),
      emerald: t("personalizeAccentEmerald"),
      forest: t("personalizeAccentForest"),
      ocean: t("personalizeAccentOcean"),
      dusk: t("personalizeAccentDusk"),
      aurora: t("personalizeAccentAurora"),
      rose: t("personalizeAccentRose"),
      sunset: t("personalizeAccentSunset"),
      midnight: t("personalizeAccentMidnight"),
      champagne: t("personalizeAccentChampagne"),
      slate: t("personalizeAccentSlate"),
      neon: t("personalizeAccentNeon"),
    };
    return map[a];
  };

  const layoutLabel = (s: HomeLayoutStyle) => {
    const map: Record<HomeLayoutStyle, string> = {
      balanced: t("personalizeLayoutBalanced"),
      hero: t("personalizeLayoutHero"),
      compact: t("personalizeLayoutCompact"),
      cards: t("personalizeLayoutCards"),
    };
    return map[s];
  };

  if (!hasPlus) {
    return (
      <main className="page-content personalize-page">
        <div className="page-header plus-page-header">
          <button type="button" className="icon-button" aria-label={t("plusBack")} onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{t("personalizeTitle")}</h1>
          </div>
        </div>
        <section className="panel personalize-locked" aria-label={t("personalizeLockedTitle")}>
          <span className="personalize-locked-icon" aria-hidden="true">
            <Lock size={22} />
          </span>
          <h2>{t("personalizeLockedTitle")}</h2>
          <p>{t("personalizeLockedBody")}</p>
          <button type="button" className="primary-button" onClick={onOpenPlus}>
            <Sparkles size={16} /> {t("personalizeOpenPlus")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-content personalize-page">
      <div className="page-header plus-page-header">
        <button type="button" className="icon-button" aria-label={t("plusBack")} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="greeting">{t("personalizeSubtitle")}</p>
          <h1 className="page-title">{t("personalizeTitle")}</h1>
        </div>
      </div>

      <section className="panel section-panel" aria-label={t("personalizeAccentTitle")}>
        <div className="section-heading">
          <h2>
            <Palette size={18} aria-hidden="true" /> {t("personalizeAccentTitle")}
          </h2>
        </div>
        <p className="personalize-hint">{t("personalizeAccentBody")}</p>
        <div className="personalize-accent-grid personalize-accent-grid-rich" role="group" aria-label={t("personalizeAccentTitle")}>
          {ACCENT_PRESETS.map((accent) => (
            <button
              key={accent}
              type="button"
              className={`personalize-accent-card accent-preview-${accent} ${settings.accent === accent ? "active" : ""}`}
              aria-pressed={settings.accent === accent}
              onClick={() => setAccent(accent)}
            >
              <span className="personalize-accent-swatch" aria-hidden="true" />
              <strong>{accentLabel(accent)}</strong>
            </button>
          ))}
        </div>
        <div className={`personalize-custom-color ${settings.accent === "custom" ? "is-active" : ""}`}>
          <div className="personalize-custom-color-copy">
            <strong>{t("personalizeAccentCustom")}</strong>
            <span>{t("personalizeAccentCustomBody")}</span>
          </div>
          <label className="personalize-color-field">
            <span className="visually-hidden">{t("personalizeAccentCustomLabel")}</span>
            <input
              type="color"
              className="personalize-color-input"
              value={settings.customColor ?? "#10b981"}
              aria-label={t("personalizeAccentCustomLabel")}
              onChange={(event) => setCustomColor(event.target.value)}
            />
            <input
              type="text"
              className="personalize-color-hex"
              value={settings.customColor ?? ""}
              placeholder="#10b981"
              spellCheck={false}
              aria-label={t("personalizeAccentCustomLabel")}
              onChange={(event) => {
                const v = event.target.value;
                if (normalizeHexColor(v)) setCustomColor(v);
                else if (v === "") setAccent("default");
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel section-panel" aria-label={t("personalizeLayoutTitle")}>
        <div className="section-heading">
          <h2>
            <LayoutList size={18} aria-hidden="true" /> {t("personalizeLayoutTitle")}
          </h2>
        </div>
        <p className="personalize-hint">{t("personalizeLayoutBody")}</p>
        <div className="personalize-layout-grid" role="group" aria-label={t("personalizeLayoutTitle")}>
          {LAYOUT_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className={`personalize-layout-card layout-preview-${style} ${settings.layoutStyle === style ? "active" : ""}`}
              aria-pressed={settings.layoutStyle === style}
              onClick={() => setLayout(style)}
            >
              <span className="personalize-layout-icon" aria-hidden="true">
                <LayoutGrid size={16} />
              </span>
              <strong>{layoutLabel(style)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel section-panel" aria-label={t("personalizeHomeTitle")}>
        <div className="section-heading">
          <h2>
            <LayoutGrid size={18} aria-hidden="true" /> {t("personalizeHomeTitle")}
          </h2>
        </div>
        <p className="personalize-hint">{t("personalizeHomeBody")}</p>
        <ul className="personalize-section-list">
          {settings.sectionOrder.map((id, index) => {
            const meta = SECTION_META[id];
            const visible =
              id === "planning"
                ? settings.showPlanning
                : id === "analytics"
                  ? settings.showAnalytics
                  : settings.showActivity;
            return (
              <li key={id} className="personalize-section-row">
                <div className="personalize-section-copy">
                  <strong>{t(meta.titleKey)}</strong>
                  <span>{t(meta.bodyKey)}</span>
                </div>
                <div className="personalize-section-actions">
                  <button
                    type="button"
                    className={`theme-choice personalize-toggle ${visible ? "active" : ""}`}
                    aria-pressed={visible}
                    onClick={() => toggleSection(id, !visible)}
                  >
                    {visible ? t("personalizeShow") : t("personalizeHide")}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("personalizeMoveUp")}
                    disabled={index === 0}
                    onClick={() => shiftSection(id, "up")}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("personalizeMoveDown")}
                    disabled={index === settings.sectionOrder.length - 1}
                    onClick={() => shiftSection(id, "down")}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
