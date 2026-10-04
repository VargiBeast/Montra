import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Receipt } from "../types/receipt";
import { formatDate } from "../lib/utils";
import { useLanguage, useTranslation } from "../lib/i18n";

interface ReceiptDetailProps {
  receipt: Receipt | null;
  getImageUrl: (path: string) => Promise<string>;
  onClose: () => void;
  onDelete: (receipt: Receipt) => void;
  deleting: boolean;
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

export function ReceiptDetail({ receipt, getImageUrl, onClose, onDelete, deleting }: ReceiptDetailProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!receipt) {
      setImageUrl("");
      setImageError(false);
      return;
    }
    let active = true;
    setImageUrl("");
    setImageError(false);
    void getImageUrl(receipt.image_path)
      .then((url) => {
        if (active) setImageUrl(url);
      })
      .catch(() => {
        if (active) setImageError(true);
      });
    return () => {
      active = false;
    };
  }, [getImageUrl, receipt]);

  if (!receipt) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="receipt-detail-title">
        <header className="modal-header">
          <h2 id="receipt-detail-title">{t("receiptDetails")}</h2>
          <button className="icon-button" type="button" aria-label={t("close")} onClick={onClose} disabled={deleting}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">
          {imageUrl && !imageError ? (
            <img className="detail-image" src={imageUrl} alt={t("receiptPhoto")} />
          ) : imageError ? (
            <p className="transaction-sub">{t("receiptImageUnavailable")}</p>
          ) : (
            <div className="loading-block" style={{ height: 180, borderRadius: 18, marginBottom: 12 }} />
          )}

          <div className="detail-line">
            <span>{t("receiptStatus")}</span>
            <strong>{statusLabel(receipt.status, t)}</strong>
          </div>
          <div className="detail-line">
            <span>{t("receiptMerchant")}</span>
            <strong>{receipt.merchant?.trim() || t("notAdded")}</strong>
          </div>
          <div className="detail-line">
            <span>{t("receiptAmount")}</span>
            <strong>
              {receipt.total_amount != null && Number.isFinite(Number(receipt.total_amount))
                ? `${receipt.total_amount} ${receipt.currency}`
                : t("notAdded")}
            </strong>
          </div>
          <div className="detail-line">
            <span>{t("date")}</span>
            <strong>
              {receipt.receipt_date
                ? formatDate(receipt.receipt_date, language)
                : formatDate(receipt.created_at.slice(0, 10), language)}
            </strong>
          </div>

          <div className="detail-actions">
            <button
              className="danger-button"
              type="button"
              disabled={deleting}
              onClick={() => onDelete(receipt)}
            >
              <Trash2 size={16} />
              {deleting ? t("removing") : t("delete")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
