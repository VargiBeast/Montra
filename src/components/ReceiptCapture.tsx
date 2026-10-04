import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import type { Receipt } from "../types/receipt";
import { useTranslation } from "../lib/i18n";
import { prepareReceiptImage } from "../lib/receiptImage";
import { recognizeReceiptText } from "../lib/localOcr";
import { parseReceiptText } from "../lib/receiptParse";
import { validateImage } from "../lib/utils";

interface ReceiptCaptureProps {
  open: boolean;
  currency: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<Receipt>;
  onSave: (receipt: Receipt, fields: { merchant: string; totalAmount: number | null; currency: string; receiptDate: string; status: "reviewed" | "confirmed" }) => Promise<void>;
}

type Step = "choose" | "camera" | "processing" | "review";

export function ReceiptCapture({ open, currency, onClose, onUpload, onSave }: ReceiptCaptureProps) {
  const t = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptCurrency, setReceiptCurrency] = useState(currency);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function reset() {
    stopCamera();
    setStep("choose");
    setError("");
    setPreviewUrl("");
    setReceipt(null);
    setMerchant("");
    setAmount("");
    setReceiptCurrency(currency);
    setDate("");
    setBusy(false);
  }

  useEffect(() => {
    if (!open) reset();
    return () => stopCamera();
    // Reset only when the sheet opens or closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("cameraUnavailable"));
      fileInput.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setStep("camera");
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      }, 0);
    } catch {
      setError(t("cameraDenied"));
      setStep("choose");
    }
  }

  async function processFile(file: File) {
    setBusy(true);
    setError("");
    setStep("processing");
    stopCamera();
    const imageError = validateImage(file);
    if (imageError) {
      setError(t(imageError));
      setStep("choose");
      setBusy(false);
      return;
    }
    try {
      const prepared = await prepareReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(prepared));
      const created = await onUpload(prepared);
      setReceipt(created);
      let text = "";
      try {
        text = await recognizeReceiptText(prepared);
      } catch (reason) {
        console.error("Local OCR failed.", reason);
        setError(t("ocrFailed"));
      }
      const parsed = parseReceiptText(text, currency);
      setMerchant(parsed.merchant);
      setAmount(parsed.totalAmount == null ? "" : String(parsed.totalAmount));
      setReceiptCurrency(parsed.currency || currency);
      setDate(parsed.receiptDate);
      try {
        await onSave(created, {
          merchant: parsed.merchant,
          totalAmount: parsed.totalAmount,
          currency: parsed.currency || currency,
          receiptDate: parsed.receiptDate,
          status: "reviewed",
        });
      } catch (reason) {
        console.error("Could not mark receipt reviewed.", reason);
        setError(t("receiptSaveFailed"));
      }
      setStep("review");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("receiptUploadFailed"));
      setStep("choose");
    } finally {
      setBusy(false);
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError(t("cameraUnavailable"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      setError(t("cameraUnavailable"));
      return;
    }
    await processFile(new File([blob], "receipt-scan.jpg", { type: "image/jpeg" }));
  }

  async function confirm() {
    if (!receipt) return;
    const parsedAmount = amount.trim() ? Number(amount.replace(",", ".")) : null;
    if (amount.trim() && (!Number.isFinite(parsedAmount) || (parsedAmount ?? 0) <= 0)) {
      setError(t("amountRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(receipt, {
        merchant: merchant.trim(),
        totalAmount: parsedAmount,
        currency: receiptCurrency.trim().toUpperCase() || currency,
        receiptDate: date,
        status: "confirmed",
      });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("receiptSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className={`modal-sheet ${step === "camera" ? "scanner-sheet" : ""}`} role="dialog" aria-modal="true" aria-labelledby="receipt-capture-title">
        <header className="modal-header">
          <h2 id="receipt-capture-title">{step === "review" ? t("reviewReceipt") : t("addReceipt")}</h2>
          <button className="icon-button" type="button" aria-label={t("close")} onClick={onClose} disabled={busy}><X size={18} /></button>
        </header>
        <div className="modal-body">
          {error && <p className="form-error" role="alert">{error}</p>}
          {step === "choose" && (
            <div className="receipt-choice">
              <p className="transaction-sub">{t("addReceiptChoice")}</p>
              <button className="primary-button" type="button" onClick={() => void startCamera()}><Camera size={17} /> {t("scanReceipt")}</button>
              <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()}><ImagePlus size={17} /> {t("uploadPhoto")}</button>
            </div>
          )}
          {step === "camera" && (
            <div className="scanner">
              <div className="scanner-stage">
                <video ref={videoRef} playsInline muted autoPlay />
                <div className="scanner-frame" aria-hidden="true" />
              </div>
              <p className="scanner-hint">{t("placeReceiptInFrame")}</p>
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => { stopCamera(); setStep("choose"); }}>{t("cancel")}</button>
                <button className="primary-button scanner-capture" type="button" onClick={() => void capture()}>{t("captureReceipt")}</button>
              </div>
            </div>
          )}
          {step === "processing" && (
            <div className="empty-state">
              <div className="loading-block" style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 12px" }} />
              <h3>{t("readingReceipt")}</h3>
              <p>{t("receiptProcessing")}</p>
            </div>
          )}
          {step === "review" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
              {previewUrl && <img className="detail-image" src={previewUrl} alt={t("receiptPhoto")} />}
              <p className="transaction-sub">{t("receiptReadyToReview")}</p>
              <label className="form-field"><span>{t("receiptMerchant")}</span><input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder={t("merchantPlaceholder")} /></label>
              <label className="form-field"><span>{t("receiptAmount")}</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
              <label className="form-field"><span>{t("currency")}</span><input value={receiptCurrency} maxLength={8} onChange={(event) => setReceiptCurrency(event.target.value.toUpperCase())} /></label>
              <label className="form-field"><span>{t("date")}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <div className="form-actions">
                <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>{t("cancel")}</button>
                <button className="primary-button" type="submit" disabled={busy}>{busy ? t("saving") : t("confirmReceipt")}</button>
              </div>
            </form>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void processFile(file);
            }}
          />
        </div>
      </section>
    </div>
  );
}
