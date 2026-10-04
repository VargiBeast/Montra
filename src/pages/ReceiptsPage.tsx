import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Receipt, Sparkles } from "lucide-react";
import type { Receipt as ReceiptRecord } from "../types/receipt";
import { formatDate } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";

interface ReceiptsPageProps {
  receipts: ReceiptRecord[];
  getImageUrl: (path: string) => Promise<string>;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onSelect: (receipt: ReceiptRecord) => void;
}

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

export function ReceiptsPage({ receipts, getImageUrl, uploading, onUpload, onSelect }: ReceiptsPageProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
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

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError("");
    try {
      await onUpload(file);
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : t("receiptUploadFailed"));
    }
  }

  return (
    <main className="page-content">
      <div className="page-header">
        <div>
          <p className="greeting">{t("receiptsGreeting")}</p>
          <h1 className="page-title">{t("receipts")}</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus size={17} />
          {uploading ? t("receiptUploading") : t("addReceipt")}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => void handleFile(event)}
        />
      </div>

      {uploadError && (
        <p className="form-error" role="alert" style={{ marginBottom: 14 }}>
          {uploadError}
        </p>
      )}

      <section className="panel section-panel">
        {receipts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-art">
              <Sparkles size={22} />
            </span>
            <h3>{t("noReceipts")}</h3>
            <p>{t("noReceiptsHint")}</p>
            <button
              className="primary-button"
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <ImagePlus size={17} /> {t("addReceipt")}
            </button>
          </div>
        ) : (
          <div className="transaction-list">
            {receipts.map((receipt) => {
              void ensureThumb(receipt);
              const title =
                receipt.merchant?.trim() ||
                t("receiptUntitled");
              const metaParts = [
                statusLabel(receipt.status, t),
                receipt.receipt_date
                  ? formatDate(receipt.receipt_date, language)
                  : formatDate(receipt.created_at.slice(0, 10), language),
              ];
              if (receipt.total_amount != null && Number.isFinite(Number(receipt.total_amount))) {
                metaParts.push(`${receipt.total_amount} ${receipt.currency}`);
              }
              return (
                <button
                  key={receipt.id}
                  type="button"
                  className="transaction-row"
                  onClick={() => onSelect(receipt)}
                >
                  <span className="transaction-thumb">
                    {thumbs[receipt.id] ? (
                      <img src={thumbs[receipt.id]} alt="" />
                    ) : (
                      <Receipt size={18} />
                    )}
                  </span>
                  <span className="transaction-main">
                    <span className="transaction-name">{title}</span>
                    <span className="transaction-sub">{metaParts.join(" · ")}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
