import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Lock,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  applyAccentTheme,
  moveSection,
  normalizeHexColor,
  type AccentTheme,
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

const ACCENTS: Exclude<AccentTheme, "custom">[] = ["default", "forest", "dusk", "aurora"];

const SECTION_META: Record<HomeSectionId, { titleKey: string; bodyKey: string }> = {
  planning: { titleKey: "personalizeSectionPlanning", bodyKey: "personalizeSectionPlanningBody" },
  analytics: { titleKey: "personalizeSectionAnalytics", bodyKey: "personalizeSectionAnalyticsBody" },
  activity: { titleKey: "personalizeSectionActivity", bodyKey: "personalizeSectionActivityBody" },
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
    if (!value || value === "\u2014" || value === key) {
      const fallback: Record<string, string> = {
        personalizeTitle: "Personalize Montra",
        personalizeSubtitle: "Shape Home and appearance for how you use Montra.",
        personalizeLockedTitle: "Personalization is a Plus feature",
        personalizeLockedBody:
          "Choose which Home sections you see, reorder them, and pick a Liquid Glass accent. Available with Montra Plus.",
        personalizeOpenPlus: "Explore Montra Plus",
        personalizeHomeTitle: "Home layout",
        personalizeHomeBody: "Balance always stays at the top. Toggle and reorder the rest.",
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
        personalizeAccentTitle: "Glass accent",
        personalizeAccentBody: "Subtle Liquid Glass tints — still Montra, never a different product.",
        personalizeAccentDefault: "Default",
        personalizeAccentForest: "Forest",
        personalizeAccentDusk: "Dusk",
        personalizeAccentAurora: "Aurora",
        personalizeAccentCustom: "Custom",
        personalizeAccentCustomBody: "Pick any accent color. Gradients and glass stay Montra.",
        personalizeAccentCustomLabel: "Custom accent color",
        personalizeSaved: "Personalization saved",
        plusBack: "Back",
      };
      value = fallback[key] ?? key;
    }
    return value;
  };

  function persist(next: PersonalizationSettings) {
    onChange(next);
    if (userId) writePersonalization(userId, next);
    applyAccentTheme(next);
  }

  function toggleSection(id: HomeSectionId, visible: boolean) {
    const next = { ...settings };
    if (id === "planning") next.showPlanning = visible;
    if (id === "analytics") next.showAnalytics = visible;
    if (id === "activity") next.showActivity = visible;
    persist(next);
  }

  function isVisible(id: HomeSectionId): boolean {
    if (id === "planning") return settings.showPlanning;
    if (id === "analytics") return settings.showAnalytics;
    return settings.showActivity;
  }

  function setAccent(accent: AccentTheme) {
    if (accent === "custom") {
      const hex = settings.customColor ?? "#27866d";
      persist({ ...settings, accent: "custom", customColor: hex });
      return;
    }
    persist({ ...settings, accent, customColor: null });
  }

  function setCustomColor(hex: string) {
    const normalized = normalizeHexColor(hex) ?? hex;
    persist({ ...settings, accent: "custom", customColor: normalized });
  }

  function reorder(id: HomeSectionId, direction: "up" | "down") {
    persist({ ...settings, sectionOrder: moveSection(settings.sectionOrder, id, direction) });
  }

  const accentLabel = (a: Exclude<AccentTheme, "custom">) => {
    const map: Record<Exclude<AccentTheme, "custom">, string> = {
      default: t("personalizeAccentDefault"),
      forest: t("personalizeAccentForest"),
      dusk: t("personalizeAccentDusk"),
      aurora: t("personalizeAccentAurora"),
    };
    return map[a];
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
          <p className="greeting">
            <span className="plus-badge is-active">
              <Palette size={12} aria-hidden="true" /> Montra Plus
            </span>
          </p>
          <h1 className="page-title">{t("personalizeTitle")}</h1>
          <p className="plus-subtitle">{t("personalizeSubtitle")}</p>
        </div>
      </div>

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
            const visible = isVisible(id);
            return (
              <li key={id} className={`personalize-section-row ${visible ? "is-on" : "is-off"}`}>
                <div className="personalize-section-copy">
                  <strong>{t(meta.titleKey)}</strong>
                  <span>{t(meta.bodyKey)}</span>
                </div>
                <div className="personalize-section-controls">
                  <div className="personalize-reorder" role="group" aria-label={t(meta.titleKey)}>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t("personalizeMoveUp")}
                      disabled={index === 0}
                      onClick={() => reorder(id, "up")}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t("personalizeMoveDown")}
                      disabled={index === settings.sectionOrder.length - 1}
                      onClick={() => reorder(id, "down")}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`theme-choice personalize-toggle ${visible ? "active" : ""}`}
                    aria-pressed={visible}
                    onClick={() => toggleSection(id, !visible)}
                  >
                    {visible ? t("personalizeShow") : t("personalizeHide")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel section-panel" aria-label={t("personalizeAccentTitle")}>
        <div className="section-heading">
          <h2>
            <Palette size={18} aria-hidden="true" /> {t("personalizeAccentTitle")}
          </h2>
        </div>
        <p className="personalize-hint">{t("personalizeAccentBody")}</p>
        <div className="personalize-accent-grid" role="group" aria-label={t("personalizeAccentTitle")}>
          {ACCENTS.map((accent) => (
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
              value={settings.customColor ?? "#27866d"}
              aria-label={t("personalizeAccentCustomLabel")}
              onChange={(event) => setCustomColor(event.target.value)}
            />
            <input
              type="text"
              className="personalize-color-hex"
              value={settings.customColor ?? ""}
              placeholder="#27866d"
              spellCheck={false}
              aria-label={t("personalizeAccentCustomLabel")}
              onChange={(event) => {
                const v = event.target.value;
                if (normalizeHexColor(v) || v === "" || v.startsWith("#")) {
                  if (normalizeHexColor(v)) setCustomColor(v);
                  else if (v === "") setAccent("default");
                }
              }}
            />
          </label>
        </div>
      </section>
    </main>
  );
}
