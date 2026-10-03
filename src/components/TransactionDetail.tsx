import { ArrowDownLeft, ExternalLink, Pencil, ShoppingBag, Trash2, X } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatDate, formatMoney, validateProductUrl } from "../lib/utils";
import { useSignedImage } from "../hooks/useTransactions";

interface TransactionDetailProps {
  transaction: Transaction | null;
  getImageUrl: (path: string) => Promise<string>;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  deleting: boolean;
}

export function TransactionDetail({ transaction, getImageUrl, onClose, onEdit, onDelete, deleting }: TransactionDetailProps) {
  const { url } = useSignedImage(transaction?.image_url, getImageUrl);
  if (!transaction) return null;
  const safeLink =
    transaction.type === "out" && transaction.link
      ? validateProductUrl(transaction.link).url
      : null;
  const linkIsSafe = Boolean(safeLink);
  const Icon = transaction.type === "in" ? ArrowDownLeft : ShoppingBag;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
        <header className="modal-header">
          <h2 id="transaction-detail-title">Transaction details</h2>
          <button className="icon-button" type="button" aria-label="Close details" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="modal-body">
          <div className="detail-hero">
            <span className="transaction-thumb">{url ? <img src={url} alt="" /> : <Icon size={22} />}</span>
            <div>
              <div className="transaction-name">{transaction.name}</div>
              <div className={`detail-amount transaction-value ${transaction.type}`}>{transaction.type === "in" ? "+" : "−"}{formatMoney(Number(transaction.amount))}</div>
            </div>
          </div>
          {url && <img className="detail-image" src={url} alt={`Photo for ${transaction.name}`} />}
          <div className="profile-detail panel">
            <div className="detail-line"><span>Type</span><strong>{transaction.type === "out" ? "Purchase" : "Money in"}</strong></div>
            <div className="detail-line"><span>Date</span><strong>{formatDate(transaction.date)}</strong></div>
            <div className="detail-line"><span>Payment method</span><strong>{transaction.method || "Not added"}</strong></div>
          </div>
          {transaction.note && <div className="detail-note">{transaction.note}</div>}
          <div className="detail-actions">
            {linkIsSafe && <a className="secondary-button" href={safeLink!} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Product link</a>}
            <button className="secondary-button" type="button" onClick={() => onEdit(transaction)}><Pencil size={16} /> Edit</button>
            <button className="danger-button" type="button" disabled={deleting} onClick={() => onDelete(transaction)}><Trash2 size={16} /> {deleting ? "Removing…" : "Delete"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}