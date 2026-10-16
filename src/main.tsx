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
import "./styles/plus.css";
import "./styles/layout-clearance.css";
import "./styles/icon-motion.css";
import "./styles/marketing.css";
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0a1010" : "#e8f2ef");
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
    const repair = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const value = node.nodeValue ?? "";
        if (value.includes("\\u2013") || value.includes("\\u2014")) {
          node.nodeValue = value.replaceAll("\\u2013", "\u2013").replaceAll("\\u2014", "\u2014");
        }
        node = walker.nextNode();
      }
    };
    repair();
    const observer = new MutationObserver(repair);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <SystemThemeSync />
          <RepairLiteralEscapes />
          <AnalyticsTracker />
          <ConsentBanner />
          <AppRoutes />
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
