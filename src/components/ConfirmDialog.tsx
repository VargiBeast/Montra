import { AlertTriangle } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { fillMissingCopy } from "../lib/missingCopy";
import { useLanguage } from "../lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const translate = useTranslation();
  const { language } = useLanguage();
  const t = (key: string) => fillMissingCopy(key, translate(key), language);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop confirm-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        className="modal-sheet confirm-dialog-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </h2>
        <p id="confirm-dialog-body" className="confirm-dialog-body">
          {body}
        </p>
        <div className="confirm-dialog-actions">
          <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>
            {cancelLabel ?? t("cancel")}
          </button>
          <button
            type="button"
            className={`primary-button ${destructive ? "is-danger" : ""}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? t("deleting") : confirmLabel ?? t("delete")}
          </button>
        </div>
      </section>
    </div>
  );
}
