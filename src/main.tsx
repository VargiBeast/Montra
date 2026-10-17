import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AppRoutes } from "./AppRoutes";
import { ConsentBanner } from "./components/ConsentBanner";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import "./styles/globals-base.css";
import "./styles/globals.css";
import "./styles/financial-radar.css";
import "./styles/visual-refresh.css";
import "./styles/visual-refresh-ui.css";
import "./styles/void-layout.css";
import "./styles/personalize-themes.css";
import "./styles/plus.css";
import "./styles/layout-fix.css";
import "./styles/layout-bugfix.css";
import "./styles/reference-polish.css";
import "./styles/money-snapshot.css";
import "./styles/layout-clearance.css";
import "./styles/icon-motion.css";
import "./styles/marketing.css";
import "./styles/emerald-vault.css";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/i18n";

// Capacitor native (iOS/Android): open the app shell at /app, not the marketing homepage.
// Browser visits and non-standalone web remain on /. Installed-PWA redirect stays in index.html.
if (Capacitor.isNativePlatform()) {
  const path = window.location.pathname || "/";
  if (path === "/" || path === "") {
    window.location.replace("/app" + window.location.search + window.location.hash);
  }
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
      console.warn("Montra could not register its offline app shell.", error);
    });
  });
}

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#050806" : "#f3faf6");
}

function readThemePreference(): "light" | "dark" | "system" {
  try {
    const saved = window.localStorage.getItem("saldo-theme") ?? window.localStorage.getItem("saldo_theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}

/** Keeps marketing (and any route outside App) on system light/dark when preference is system. */
function SystemThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function sync() {
      const mode = readThemePreference();
      if (mode === "light") applyTheme(false);
      else if (mode === "dark") applyTheme(true);
      else applyTheme(media.matches);
    }

    sync();
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return null;
}

function RepairLiteralEscapes() {
  useEffect(() => {
    /* no-op placeholder kept for parity with prior main */
  }, []);
  return null;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Montra root element missing");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <SystemThemeSync />
          <RepairLiteralEscapes />
          <AppRoutes />
          <ConsentBanner />
          <AnalyticsTracker />
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
