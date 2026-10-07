import { ArrowDownLeft, ExternalLink, Pencil, ShoppingBag, Trash2, X } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatDate, formatMoney, validateProductUrl } from "../lib/utils";
import { useSignedImage } from "../hooks/useTransactions";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface TransactionDetailProps {
  transaction: Transaction | null;
  getImageUrl: (path: string) => Promise<string>;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  deleting: boolean;
}

export function TransactionDetail({ transaction, getImageUrl, onClose, onEdit, onDelete, deleting }: TransactionDetailProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const { url } = useSignedImage(transaction?.image_url, getImageUrl);
  if (!transaction) return null;
  const safeLink =
    transaction.type === "out" && transaction.link
      ? validateProductUrl(transaction.link).url
      : null;
  const linkIsSafe = Boolean(safeLink);
  const Icon = transaction.type === "in" ? ArrowDownLeft : ShoppingBag;
  const amount = Number(transaction.amount);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
        <header className="modal-header">
          <h2 id="transaction-detail-title">{t("transactionDetails")}</h2>
          <button className="icon-button" type="button" aria-label={t("closeDetails")} onClick={onClose}><X size={18} /></button>
        </header>
        <div className="modal-body">
          <div className="detail-hero">
            <span className="transaction-thumb">{url ? <img src={url} alt="" decoding="async" /> : <Icon size={22} />}</span>
            <div>
              <div className="transaction-name">{transaction.name}</div>
              <div className={`detail-amount transaction-value ${transaction.type}`}>{transaction.type === "in" ? "+" : "\u2212"}{formatMoney(amount, currency, language, convertFromBase(amount, currency))}</div>
            </div>
          </div>
          {url && <img className="detail-image" src={url} alt={t("photoFor", { name: transaction.name })} decoding="async" />}
          <div className="profile-detail panel">
            <div className="detail-line"><span>{t("type")}</span><strong>{transaction.type === "out" ? t("purchase") : t("moneyIn")}</strong></div>
            <div className="detail-line"><span>{t("date")}</span><strong>{formatDate(transaction.date, language)}</strong></div>
            <div className="detail-line"><span>{t("paymentMethod")}</span><strong>{transaction.method || t("notAdded")}</strong></div>
          </div>
          {transaction.note && !transaction.note.includes("montra:receipt:") && (
            <div className="detail-note">{transaction.note}</div>
          )}
          <div className="detail-actions">
            {linkIsSafe && <a className="secondary-button" href={safeLink!} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> {t("productLink")}</a>}
            <button className="secondary-button" type="button" onClick={() => onEdit(transaction)}><Pencil size={16} /> {t("edit")}</button>
            <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(transaction)}><Trash2 size={16} /> {deleting ? t("removing") : t("delete")}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
