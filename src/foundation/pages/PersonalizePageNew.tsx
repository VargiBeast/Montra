import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePlusEntitlement } from "../../hooks/usePlusEntitlement";
import {
  ACCENT_PRESETS,
  applyAccentTheme,
  DEFAULT_PERSONALIZATION,
  readPersonalization,
  writePersonalization,
  type AccentTheme,
  type PersonalizationSettings,
} from "../../lib/personalization";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

const PRESET_LABELS: Record<string, string> = {
  default: "Void",
  emerald: "Emerald",
  forest: "Forest",
  ocean: "Ocean",
  dusk: "Dusk",
  aurora: "Aurora",
  rose: "Rose",
  sunset: "Sunset",
  midnight: "Midnight",
  champagne: "Champagne",
  slate: "Slate",
  neon: "Neon",
};

export function PersonalizePageNew() {
  const auth = useAuth();
  const plus = usePlusEntitlement(auth.user?.id);
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PersonalizationSettings>(DEFAULT_PERSONALIZATION);

  useEffect(() => {
    if (!auth.user?.id) return;
    const loaded = readPersonalization(auth.user.id);
    setSettings(loaded);
    applyAccentTheme(loaded);
  }, [auth.user?.id]);

  function persist(next: PersonalizationSettings) {
    setSettings(next);
    applyAccentTheme(next);
    if (auth.user?.id) writePersonalization(auth.user.id, next);
  }

  function setAccent(accent: Exclude<AccentTheme, "custom">) {
    persist({ ...settings, accent, customColor: null });
  }

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  if (!plus.hasPlus) {
    return (
      <div className="m-anim-in">
        <PageHeader title="Personalize" subtitle="Themes & layout" />
        <Card padding="lg" className="m-anim-scale">
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Plus feature</p>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--m-text-secondary)" }}>
            Unlock color themes and Home layout with Montra Plus.
          </p>
          <Button onClick={() => navigate("/app/plus")}>Explore Plus</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="m-anim-in">
      <PageHeader title="Personalize" subtitle="Themes & layout" />
      <Card padding="lg">
        <h2 style={{ margin: "0 0 12px", fontSize: 15 }}>Accent theme</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 8,
          }}
        >
          {ACCENT_PRESETS.map((accent) => (
            <button
              key={accent}
              type="button"
              onClick={() => setAccent(accent)}
              style={{
                padding: "12px 8px",
                borderRadius: 12,
                border:
                  settings.accent === accent ? "1px solid var(--m-accent)" : "1px solid var(--m-border)",
                background: settings.accent === accent ? "var(--m-accent-soft)" : "var(--m-bg-elevated)",
                color: "var(--m-text)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {PRESET_LABELS[accent] ?? accent}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
