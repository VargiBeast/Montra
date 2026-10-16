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
import "./styles/plus.css";
import "./styles/layout-clearance.css";
import "./styles/icon-motion.css";
import "./styles/marketing.css";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/i18n";

// Capacitor native (iOS/Android): open the status bar overlay and hide the splash when ready.
void (async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* StatusBar plugin optional in web builds */
  }
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* SplashScreen plugin optional in web builds */
  }
})();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <CurrencyProvider>
          <AppRoutes />
          <ConsentBanner />
          <AnalyticsTracker />
        </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
