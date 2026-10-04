import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import "./styles/preference-fix.css";
import "./styles/layout-fix.css";
import { CurrencyProvider } from "./lib/currency";
import { LanguageProvider } from "./lib/i18n";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
      console.warn("Montra could not register its offline app shell.", error);
    });
  });
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
    <LanguageProvider>
      <CurrencyProvider>
        <RepairLiteralEscapes />
        <App />
      </CurrencyProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
