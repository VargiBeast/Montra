import { ArrowDownLeft, ShoppingBag } from "lucide-react";
import type { Transaction } from "../types/transaction";
import { formatDate, formatMoney } from "../lib/utils";
import { useSignedImage } from "../hooks/useTransactions";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";

interface TransactionRowProps {
  transaction: Transaction;
  getImageUrl: (path: string) => Promise<string>;
  onClick: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, getImageUrl, onClick }: TransactionRowProps) {
  const t = useTranslation();
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const { url } = useSignedImage(transaction.image_url, getImageUrl);
  const Icon = transaction.image_url ? null : transaction.type === "in" ? ArrowDownLeft : ShoppingBag;
  const amount = Number(transaction.amount);
  const formatted = formatMoney(amount, currency, language, convertFromBase(amount, currency));
  const sign = transaction.type === "in" ? "+" : "\u2212";
  const typeLabel = transaction.type === "in" ? t("moneyIn") : t("purchase");
  const methodOrType = transaction.method?.trim() || typeLabel;

  return (
    <button
      className={`transaction-row transaction-row--${transaction.type}`}
      type="button"
      onClick={() => onClick(transaction)}
      aria-label={`${transaction.name}, ${typeLabel}, ${sign}${formatted}, ${formatDate(transaction.date, language)}`}
    >
      <span className={`transaction-thumb transaction-thumb--${transaction.type}`} aria-hidden="true">
        {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : Icon ? <Icon size={18} strokeWidth={1.85} /> : <ShoppingBag size={18} />}
      </span>
      <span className="transaction-main">
        <span className="transaction-name">{transaction.name}</span>
        <span className="transaction-sub">
          <span className="transaction-meta">{methodOrType}</span>
          <span className="transaction-meta-sep" aria-hidden="true">
            ·
          </span>
          <span className="transaction-date">{formatDate(transaction.date, language)}</span>
        </span>
      </span>
      <span className={`transaction-value transaction-value--${transaction.type}`}>
        <span className="transaction-sign" aria-hidden="true">
          {sign}
        </span>
        <span className="transaction-amount">{formatted}</span>
      </span>
    </button>
  );
}
