import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage, useTranslation, writeLanguage } from "../../lib/i18n";
import { useDisplayCurrency } from "../../lib/currency";
import {
  languageChoices,
  currencyChoices,
  type DisplayCurrency,
  type PreferenceLocale,
} from "../../lib/preferences";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

export function ProfilePageNew() {
  const auth = useAuth();
  const navigate = useNavigate();
  const t = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useDisplayCurrency();
  const [busy, setBusy] = useState(false);

  const label = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== "—" && v !== key ? v : fallback;
  };

  if (auth.isLoading || !auth.user) {
    return <LoadingState label={label("loading", "Loading…")} />;
  }

  const user = auth.user;
  const email = user.email ?? "—";
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    email.split("@")[0];
  const provider = user.app_metadata?.provider as string | undefined;
  const signInLabel =
    provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Email";

  return (
    <div className="m-anim-in">
      <PageHeader title={label("navProfile", "Profile")} subtitle={label("profileSubtitle", "Account & preferences")} />

      <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--m-accent-soft)",
              color: "var(--m-accent)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            {String(name).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{name}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--m-text-secondary)" }}>{email}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--m-text-muted)" }}>
              {label("profileSignIn", "Sign-in")}: {signInLabel}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md" style={{ marginBottom: 16 }}>
        <label className="m-label" htmlFor="pref-lang">
          {label("settingsLanguage", "Language")}
        </label>
        <select
          id="pref-lang"
          className="m-input"
          value={language}
          onChange={(e) => {
            const next = e.target.value as PreferenceLocale;
            setLanguage(next);
            writeLanguage(next);
            document.documentElement.lang = next.startsWith("zh") ? "zh-Hans" : next;
            document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
          }}
          style={{ marginBottom: 16 }}
        >
          {languageChoices.map((opt) => (
            <option key={opt.locale} value={opt.locale}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="m-label" htmlFor="pref-currency">
          {label("settingsCurrency", "Display currency")}
        </label>
        <select
          id="pref-currency"
          className="m-input"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as DisplayCurrency)}
        >
          {currencyChoices.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.code} — {opt.label}
            </option>
          ))}
        </select>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button variant="secondary" onClick={() => navigate("/app/personalize")}>
          {label("navPersonalize", "Personalize")}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/app/plus")}>
          Montra Plus
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void auth.signOut().then(() => navigate("/login", { replace: true }));
          }}
        >
          {busy ? label("signingOut", "Signing out…") : label("navSignOut", "Sign out")}
        </Button>
      </div>
    </div>
  );
}
