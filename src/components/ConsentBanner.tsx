import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useLanguage, useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
import {
  readStoredConsent,
  updateAnalyticsConsent,
} from "../lib/gtm";

/**
 * Custom analytics consent banner (Consent Mode v2).
 * Accept and Reject are equally clear — no dark patterns.
 */
export function ConsentBanner() {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string) => fillMissingCopy(key, translate(key), language);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readStoredConsent() === null);
  }, []);

  function accept() {
    updateAnalyticsConsent(true);
    setVisible(false);
  }

  function reject() {
    updateAnalyticsConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="consent-banner" role="dialog" aria-labelledby="consent-banner-title" aria-live="polite">
      <div className="consent-banner-inner panel">
        <div className="consent-banner-icon" aria-hidden="true">
          <Shield size={20} />
        </div>
        <div className="consent-banner-copy">
          <strong id="consent-banner-title">{t("consentTitle")}</strong>
          <p>{t("consentBody")}</p>
        </div>
        <div className="consent-banner-actions">
          <button type="button" className="secondary-button" onClick={reject}>
            {t("consentReject")}
          </button>
          <button type="button" className="primary-button" onClick={accept}>
            {t("consentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
