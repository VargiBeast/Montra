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

const LAST_METHOD_KEY = "montra.lastPaymentMethod";

const FORM_FALLBACK: Record<string, string> = {
  moreDetails: "More details",
  lessDetails: "Less details",
};

function tf(t: (k: string, v?: Record<string, string | number>) => string, key: string, values?: Record<string, string | number>) {
  const value = t(key, values);
  if (value !== "\u2014") return value;
  let text = FORM_FALLBACK[key] ?? key;
  if (values) {
    text = text.replace(/\{(\w+)\}/g, (m, n) => (Object.hasOwn(values, n) ? String(values[n]) : m));
  }
  return text;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readLastMethod(): string {
  try {
    return window.localStorage.getItem(LAST_METHOD_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeLastMethod(value: string) {
  try {
    if (value.trim()) window.localStorage.setItem(LAST_METHOD_KEY, value.trim());
  } catch {
    /* ignore */
  }
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
  const [fieldError, setFieldError] = useState<"name" | "amount" | "link" | "image" | null>(null);
  const [preview, setPreview] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(existing?.type ?? "out");
    setName(existing?.name ?? "");
    if (existing) {
      const displayAmount = convertFromBase(Number(existing.amount), currency);
      setAmount(String(Math.round(displayAmount * 100) / 100));
    } else {
      setAmount("");
    }
    setDate(existing?.date ?? today());
    const lastMethod = existing?.method ?? (existing ? "" : readLastMethod());
    setMethod(lastMethod ?? "");
    setLink(existing?.link ?? "");
    setNote(existing?.note ?? "");
    setImage(null);
    setError("");
    setFieldError(null);
    setPreview("");
    setShowDetails(
      Boolean(
        existing &&
          (existing.method || existing.link || existing.note || existing.image_url),
      ),
    );
  }, [open, existing, currency, convertFromBase]);

  useEffect(() => {
    if (!image) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setFieldError(null);

    if (!name.trim()) {
      setFieldError("name");
      setError(t("transactionNameRequired"));
      return;
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFieldError("amount");
      setError(t("amountRequired"));
      return;
    }
    const productLink = type === "out" ? validateProductUrl(link) : { url: null, error: null };
    if (productLink.error) {
      setFieldError("link");
      setError(productLink.error);
      return;
    }
    if (image) {
      const imageError = validateImage(image);
      if (imageError) {
        setFieldError("image");
        setError(imageError);
        return;
      }
    }

    const amountInBase = convertToBase(numericAmount, currency);
    const safeLink = productLink.url ?? "";
    const trimmedMethod = method.trim();

    try {
      await onSave(
        {
          type,
          name: name.trim(),
          amount: Math.round(amountInBase * 100) / 100,
          date,
          method: trimmedMethod || null,
          link: safeLink || null,
          note: note.trim() || null,
          image,
        },
        existing ?? undefined,
      );
      if (!existing && trimmedMethod) writeLastMethod(trimmedMethod);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("transactionSaveFailed"));
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="modal-sheet transaction-form-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-form-title"
      >
        <header className="modal-header">
          <h2 id="transaction-form-title">
            {existing ? t("editTransactionTitle") : t("addTransactionTitle")}
          </h2>
          <button
            className="icon-button"
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            disabled={busy}
          >
            <X size={18} />
          </button>
        </header>

        <form className="modal-body transaction-form-body" onSubmit={(e) => void submit(e)}>
          <div className="form-field full">
            <label id="transaction-type-label">{t("type")}</label>
            <div className="type-toggle" role="group" aria-labelledby="transaction-type-label">
              <button
                type="button"
                className={type === "out" ? "selected" : ""}
                aria-pressed={type === "out"}
                onClick={() => setType("out")}
              >
                {t("purchase")}
              </button>
              <button
                type="button"
                className={type === "in" ? "selected" : ""}
                aria-pressed={type === "in"}
                onClick={() => setType("in")}
              >
                {t("moneyIn")}
              </button>
            </div>
          </div>

          <div className={`form-field full tx-amount-field ${fieldError === "amount" ? "has-error" : ""}`}>
            <label htmlFor="transaction-amount">{t("amountNok", { currency })}</label>
            <div className="tx-amount-row">
              <span className="tx-amount-currency" aria-hidden="true">
                {currency}
              </span>
              <input
                id="transaction-amount"
                className="tx-amount-input"
                inputMode="decimal"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
                autoFocus={!existing}
                aria-invalid={fieldError === "amount"}
                aria-describedby={fieldError === "amount" ? "transaction-form-error" : undefined}
              />
            </div>
          </div>

          <div className={`form-field full ${fieldError === "name" ? "has-error" : ""}`}>
            <label htmlFor="transaction-name">{t("name")}</label>
            <input
              id="transaction-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={type === "out" ? t("whatDidYouBuy") : t("whereFrom")}
              maxLength={120}
              required
              autoFocus={Boolean(existing)}
              aria-invalid={fieldError === "name"}
            />
          </div>

          <div className="form-field full">
            <label htmlFor="transaction-date">{t("date")}</label>
            <input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="form-field full">
            <label htmlFor="transaction-note">{t("note")}</label>
            <textarea
              id="transaction-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={400}
              rows={2}
            />
          </div>

          <button
            type="button"
            className="text-button tx-details-toggle"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
          >
            {showDetails ? tf(t, "lessDetails") : tf(t, "moreDetails")}
          </button>

          {showDetails && (
            <div className="form-grid tx-details-grid">
              <div className="form-field full">
                <label htmlFor="transaction-method">{t("paymentMethod")}</label>
                <input
                  id="transaction-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  placeholder={t("paymentMethodHint")}
                  maxLength={80}
                />
              </div>
              {type === "out" && (
                <div className={`form-field full ${fieldError === "link" ? "has-error" : ""}`}>
                  <label htmlFor="transaction-link">{t("productLink")}</label>
                  <input
                    id="transaction-link"
                    type="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://\u2026"
                    aria-invalid={fieldError === "link"}
                  />
                </div>
              )}
              <div className={`form-field full ${fieldError === "image" ? "has-error" : ""}`}>
                <label htmlFor="transaction-image">{t("photo")}</label>
                {preview ? (
                  <img className="form-preview" src={preview} alt="" />
                ) : existing?.image_url ? (
                  <p className="form-hint">{t("currentPhotoStays")}</p>
                ) : null}
                <label className="secondary-button file-button">
                  <ImagePlus size={16} />
                  <span>{t("addPhoto")}</span>
                  <input
                    id="transaction-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          )}

          {error && (
            <p id="transaction-form-error" className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions tx-form-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={busy}>
              {t("cancel")}
            </button>
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? t("saving") : existing ? t("saveChanges") : t("saveTransaction")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
