import { useState } from "react";
import { Plus, Receipt, Sparkles } from "lucide-react";
import type { Receipt as ReceiptRecord } from "../types/receipt";
import { formatDate } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";

interface ReceiptsPageProps {
  receipts: ReceiptRecord[];
  getImageUrl: (path: string) => Promise<string>;
  uploading: boolean;
  onAdd: () => void;
  onSelect: (receipt: ReceiptRecord) => void;
}

const RECEIPT_FALLBACK: Record<string, string> = {
  receiptsGreeting: "Keep every receipt in one place",
  receipts: "Receipts",
  addReceipt: "Add receipt",
  receiptUploading: "Uploading\u2026",
  noReceipts: "No receipts yet",
  noReceiptsHint:
    "Scan or upload a receipt photo. Montra reads the details so you can review and confirm.",
  receiptUntitled: "Untitled receipt",
  receiptStatusPending: "Pending",
  receiptStatusReviewed: "Reviewed",
  receiptStatusConfirmed: "Confirmed",
  receiptStatusRejected: "Rejected",
};

function statusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case "pending":
      return t("receiptStatusPending");
    case "reviewed":
      return t("receiptStatusReviewed");
    case "confirmed":
      return t("receiptStatusConfirmed");
    case "rejected":
      return t("receiptStatusRejected");
    default:
      return status;
  }
}

export function ReceiptsPage({
  receipts,
  getImageUrl,
  uploading,
  onAdd,
  onSelect,
}: ReceiptsPageProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string) => {
    const value = translate(key);
    return value === "\u2014" ? RECEIPT_FALLBACK[key] ?? key : value;
  };
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  async function ensureThumb(receipt: ReceiptRecord) {
    if (thumbs[receipt.id]) return;
    try {
      const url = await getImageUrl(receipt.image_path);
      setThumbs((prev) => ({ ...prev, [receipt.id]: url }));
    } catch {
      /* signed URL failures surface when opening detail */
    }
  }

  return (
    <main className="page-content receipts-page">
      <div className="page-header">
        <div>
          <p className="greeting">{t("receiptsGreeting")}</p>
          <h1 className="page-title">{t("receipts")}</h1>
        </div>
        <button className="primary-button" type="button" disabled={uploading} onClick={onAdd}>
          <Plus size={17} />
          {uploading ? t("receiptUploading") : t("addReceipt")}
        </button>
      </div>

      <section className="panel section-panel receipts-list-panel">
        {receipts.length === 0 ? (
          <div className="empty-state receipts-empty">
            <span className="empty-art" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <h3>{t("noReceipts")}</h3>
            <p>{t("noReceiptsHint")}</p>
            <button className="primary-button" type="button" disabled={uploading} onClick={onAdd}>
              <Receipt size={17} /> {t("addReceipt")}
            </button>
          </div>
        ) : (
          <ul className="receipt-list">
            {receipts.map((receipt) => {
              void ensureThumb(receipt);
              const title = receipt.merchant?.trim() || t("receiptUntitled");
              const dateLabel = receipt.receipt_date
                ? formatDate(receipt.receipt_date, language)
                : formatDate(receipt.created_at.slice(0, 10), language);
              const hasAmount =
                receipt.total_amount != null && Number.isFinite(Number(receipt.total_amount));
              const status = statusLabel(receipt.status, t);

              return (
                <li key={receipt.id}>
                  <button type="button" className="receipt-card" onClick={() => onSelect(receipt)}>
                    <span className="receipt-card-thumb" aria-hidden="true">
                      {thumbs[receipt.id] ? (
                        <img src={thumbs[receipt.id]} alt="" />
                      ) : (
                        <Receipt size={18} />
                      )}
                    </span>
                    <span className="receipt-card-main">
                      <span className="receipt-card-title">{title}</span>
                      <span className="receipt-card-meta">
                        <span className={`receipt-status-pill receipt-status-pill--${receipt.status}`}>
                          {status}
                        </span>
                        <span className="receipt-card-date">{dateLabel}</span>
                      </span>
                    </span>
                    {hasAmount && (
                      <span className="receipt-card-amount">
                        {Number(receipt.total_amount)} {receipt.currency}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
