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

  return (
    <button className="transaction-row" type="button" onClick={() => onClick(transaction)}>
      <span className="transaction-thumb" aria-hidden="true">
        {url ? <img src={url} alt="" /> : Icon ? <Icon size={19} strokeWidth={1.8} /> : <ShoppingBag size={19} />}
      </span>
      <span className="transaction-main">
        <span className="transaction-name">{transaction.name}</span>
        <span className="transaction-sub">
          {transaction.method || (transaction.type === "in" ? t("moneyIn") : t("purchase"))} · {formatDate(transaction.date, language)}
        </span>
      </span>
      <span className={`transaction-value ${transaction.type}`}>
        {transaction.type === "in" ? "+" : "−"}{formatMoney(amount, currency, language, convertFromBase(amount, currency))}
      </span>
    </button>
  );
}
