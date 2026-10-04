import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import type { Transaction, TransactionInput } from "../types/transaction";
import { validateImage, validateProductUrl } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useTranslation } from "../lib/i18n";

interface TransactionFormProps {
  open: boolean;
  existing?: Transaction | null;
  busy: boolean;
  onClose: () => void;
  onSave: (input: TransactionInput, existing?: Transaction) => Promise<void>;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function TransactionForm({ open, existing, busy, onClose, onSave }: TransactionFormProps) {
  const t = useTranslation();
  const { currency, convertFromBase, convertToBase } = useDisplayCurrency();
  const [type, setType] = useState<"in" | "out">("out");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(existing?.type ?? "out");
    setName(existing?.name ?? "");
    // Show amount in the current display currency
    if (existing) {
      const displayAmount = convertFromBase(Number(existing.amount), currency);
      setAmount(String(Math.round(displayAmount * 100) / 100));
    } else {
      setAmount("");
    }
    setDate(existing?.date ?? today());
    setMethod(existing?.method ?? "");
    setLink(existing?.link ?? "");
    setNote(existing?.note ?? "");
    setImage(null);
    setError("");
    setPreview("");
  }, [open, existing, currency, convertFromBase]);

  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!name.trim()) { setError(t("transactionNameRequired")); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError(t("amountRequired")); return; }
    const productLink = type === "out" ? validateProductUrl(link) : { url: null, error: null };
    if (productLink.error) { setError(productLink.error); return; }
    if (image) {
      const imageError = validateImage(image);
      if (imageError) { setError(imageError); return; }
    }
    // Convert from display currency back to base (NOK) for storage
    const amountInBase = convertToBase(numericAmount, currency);
    const safeLink = productLink.url ?? "";
    try {
      await onSave({
        type,
        name: name.trim(),
        amount: Math.round(amountInBase * 100) / 100,
        date,
        method: method.trim() || null,
        link: safeLink || null,
        note: note.trim() || null,
        image,
      }, existing ?? undefined);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("transactionSaveFailed"));
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title">
        <header className="modal-header">
          <h2 id="transaction-form-title">{existing ? t("editTransactionTitle") : t("addTransactionTitle")}</h2>
          <button className="icon-button" type="button" aria-label={t("close")} onClick={onClose} disabled={busy}><X size={18} /></button>
        </header>
        <form className="modal-body" onSubmit={submit}>
          <div className="form-field full" style={{ marginBottom: 16 }}>
            <label>{t("type")}</label>
            <div className="type-toggle">
              <button type="button" className={type === "out" ? "selected" : ""} onClick={() => setType("out")}>{t("purchase")}</button>
              <button type="button" className={type === "in" ? "selected" : ""} onClick={() => setType("in")}>{t("moneyIn")}</button>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="transaction-name">{t("name")}</label>
              <input id="transaction-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={type === "out" ? t("whatDidYouBuy") : t("whereFrom")} maxLength={120} required />
            </div>
            <div className="form-field">
              <label htmlFor="transaction-amount">{t("amountNok", { currency })}</label>
              <input id="transaction-amount" inputMode="decimal" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-field">
              <label htmlFor="transaction-date">{t("date")}</label>
              <input id="transaction-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </div>
            <div className="form-field full">
              <label htmlFor="transaction-method">{t("paymentMethod")}</label>
              <input id="transaction-method" value={method} onChange={(event) => setMethod(event.target.value)} placeholder={t("paymentMethodHint")} maxLength={80} />
            </div>
            {type === "out" && <div className="form-field full">
              <label htmlFor="transaction-link">{t("productLink")}</label>
              <input id="transaction-link" type="url" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://…" />
            </div>}
            <div className="form-field full">
              <label htmlFor="transaction-note">{t("note")}</label>
              <textarea id="transaction-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("notePlaceholder")} maxLength={1500} />
            </div>
            {type === "out" && <div className="form-field full">
              <label htmlFor="transaction-image">{t("photo")}</label>
              {preview && <div className="image-preview" style={{ marginBottom: 9 }}><img src={preview} alt="Selected transaction" /></div>}
              {!preview && existing?.image_url && <p className="transaction-sub" style={{ margin: "0 0 5px" }}>{t("currentPhotoStays")}</p>}
              <label className="file-picker" htmlFor="transaction-image"><ImagePlus size={17} />{image?.name ?? t("addPhoto")}
                <input id="transaction-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
              </label>
            </div>}
          </div>
          {error && <p className="form-error" role="alert" style={{ marginBottom: 0 }}>{error}</p>}
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>{t("cancel")}</button>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? t("saving") : existing ? t("saveChanges") : t("saveTransaction")}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
