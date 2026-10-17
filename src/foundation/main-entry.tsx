/**
 * Application entry — foundation shell + legacy feature CSS for wired pages.
 */
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { FoundationRoutes } from "./AppRoutes";
import { CurrencyProvider } from "../lib/currency";
import { LanguageProvider } from "../lib/i18n";
import "./foundation.css";
/* Feature pages still use the established component class names */
import "../styles/globals-base.css";
import "../styles/globals.css";
import "../styles/plus.css";
import "../styles/personalize-themes.css";
import "../styles/marketing.css";

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
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#070a08" : "#f4f7f5");
}

function readThemePreference(): "light" | "dark" | "system" {
  try {
    const saved = window.localStorage.getItem("saldo-theme") ?? window.localStorage.getItem("saldo_theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <SystemThemeSync />
          <FoundationRoutes />
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
