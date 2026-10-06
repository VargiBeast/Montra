import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import type { Receipt } from "../types/receipt";
import { useTranslation } from "../lib/i18n";
import { prepareReceiptImage } from "../lib/receiptImage";
import { recognizeReceiptText } from "../lib/localOcr";
import { parseReceiptText } from "../lib/receiptParse";
import { validateImage } from "../lib/utils";
import { currencyChoices } from "../lib/preferences";

interface ReceiptCaptureProps {
  open: boolean;
  currency: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<Receipt>;
  onSave: (
    receipt: Receipt,
    fields: {
      merchant: string;
      totalAmount: number | null;
      currency: string;
      receiptDate: string;
      status: "reviewed" | "confirmed";
      deductFromBalance: boolean;
    },
  ) => Promise<void>;
}

type Step = "choose" | "camera" | "processing" | "review";

function todayIso(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReceiptCapture({ open, currency, onClose, onUpload, onSave }: ReceiptCaptureProps) {
  const t = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string>("");
  const [step, setStep] = useState<Step>("choose");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptCurrency, setReceiptCurrency] = useState(currency);
  const [date, setDate] = useState("");
  const [deductFromBalance, setDeductFromBalance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  function revokePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraReady(false);
  }

  function reset() {
    stopCamera();
    revokePreview();
    setStep("choose");
    setError("");
    setPreviewUrl("");
    setReceipt(null);
    setMerchant("");
    setAmount("");
    setReceiptCurrency(currency);
    setDate("");
    setDeductFromBalance(false);
    setBusy(false);
    setCameraReady(false);
  }

  useEffect(() => {
    if (!open) reset();
    return () => {
      stopCamera();
      revokePreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (step !== "camera") return;
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    let cancelled = false;
    setCameraReady(false);

    const onReady = () => {
      if (cancelled) return;
      const hasLiveTrack = stream.getVideoTracks().some((track) => track.readyState === "live");
      if (hasLiveTrack && video.videoWidth > 0) {
        setCameraReady(true);
      }
    };

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    const playVideo = async () => {
      if (cancelled) return;
      try {
        await video.play();
        onReady();
      } catch (reason) {
        console.warn("Montra camera play failed.", reason);
        window.setTimeout(() => {
          if (cancelled) return;
          void video.play().then(onReady).catch((retryReason) => {
            console.warn("Montra camera retry play failed.", retryReason);
          });
        }, 120);
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void playVideo();
    } else {
      video.addEventListener("loadedmetadata", () => void playVideo(), { once: true });
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("playing", onReady, { once: true });
    }

    const poll = window.setInterval(() => {
      if (cancelled) return;
      if (video.videoWidth > 0) {
        setCameraReady(true);
        window.clearInterval(poll);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [step]);

  async function startCamera() {
    setError("");
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("cameraUnavailable"));
      return;
    }

    const constraintAttempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      { video: { facingMode: "environment" }, audio: false },
      { video: { facingMode: { ideal: "user" } }, audio: false },
      { video: true, audio: false },
    ];

    let acquired: MediaStream | null = null;
    let lastError: unknown = null;
    for (const constraints of constraintAttempts) {
      try {
        acquired = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (reason) {
        lastError = reason;
      }
    }

    if (!acquired) {
      console.warn("Montra getUserMedia failed.", lastError);
      const name = lastError && typeof lastError === "object" && "name" in lastError
        ? String((lastError as { name?: string }).name)
        : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(t("cameraDenied"));
      } else {
        setError(t("cameraUnavailable"));
      }
      setStep("choose");
      return;
    }

    const liveTracks = acquired.getVideoTracks().filter((track) => track.readyState === "live");
    if (liveTracks.length === 0) {
      acquired.getTracks().forEach((track) => track.stop());
      setError(t("cameraUnavailable"));
      setStep("choose");
      return;
    }

    streamRef.current = acquired;
    setStep("camera");
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
      revokePreview();
      const objectUrl = URL.createObjectURL(prepared);
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
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
      const resolvedCurrency = parsed.currency || currency;
      const known = currencyChoices.some((choice) => choice.code === resolvedCurrency);
      setMerchant(parsed.merchant);
      setAmount(parsed.totalAmount == null ? "" : String(parsed.totalAmount));
      setReceiptCurrency(known ? resolvedCurrency : currency);
      setDate(parsed.receiptDate || todayIso());
      setDeductFromBalance(false);
      try {
        await onSave(created, {
          merchant: parsed.merchant,
          totalAmount: parsed.totalAmount,
          currency: known ? resolvedCurrency : currency,
          receiptDate: parsed.receiptDate || todayIso(),
          status: "reviewed",
          deductFromBalance: false,
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
    if (deductFromBalance && (parsedAmount == null || parsedAmount <= 0)) {
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
        receiptDate: date || todayIso(),
        status: "confirmed",
        deductFromBalance,
      });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("receiptSaveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const displayAmount = amount.trim() || "0";
  const displayCurrency = receiptCurrency || currency;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className={`modal-sheet ${step === "camera" ? "scanner-sheet" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-capture-title"
      >
        <header className="modal-header">
          <h2 id="receipt-capture-title">{step === "review" ? t("reviewReceipt") : step === "camera" ? t("scanReceipt") : step === "processing" ? t("readingReceipt") : t("addReceipt")}</h2>
          <button className="icon-button" type="button" aria-label={t("close")} onClick={onClose} disabled={busy}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {step === "choose" && (
            <div className="receipt-choice">
              <p className="receipt-choice-lead">{t("addReceiptChoice")}</p>
              <button className="receipt-choice-card" type="button" onClick={() => void startCamera()}>
                <span className="receipt-choice-icon" aria-hidden="true">
                  <Camera size={20} />
                </span>
                <span className="receipt-choice-copy">
                  <strong>{t("scanReceipt")}</strong>
                  <span>{t("placeReceiptInFrame")}</span>
                </span>
              </button>
              <button className="receipt-choice-card" type="button" onClick={() => fileInput.current?.click()}>
                <span className="receipt-choice-icon" aria-hidden="true">
                  <ImagePlus size={20} />
                </span>
                <span className="receipt-choice-copy">
                  <strong>{t("uploadPhoto")}</strong>
                  <span>{t("receiptReadyToReview")}</span>
                </span>
              </button>
            </div>
          )}
          {step === "camera" && (
            <div className="scanner">
              <div className="scanner-stage">
                <video ref={videoRef} playsInline muted autoPlay />
                <div className="scanner-frame" aria-hidden="true" />
                {!cameraReady && (
                  <div className="scanner-loading" aria-live="polite">
                    <div className="loading-block" style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 8px" }} />
                    <span>{t("cameraStarting") === "—" ? "Starting camera…" : t("cameraStarting")}</span>
                  </div>
                )}
              </div>
              <p className="scanner-hint">{t("placeReceiptInFrame")}</p>
              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep("choose");
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  className="primary-button scanner-capture"
                  type="button"
                  disabled={!cameraReady}
                  onClick={() => void capture()}
                >
                  {t("captureReceipt")}
                </button>
              </div>
            </div>
          )}
          {step === "processing" && (
            <div className="empty-state receipt-processing">
              <div className="loading-block" style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 12px" }} />
              <h3>{t("readingReceipt")}</h3>
              <p>{t("receiptProcessing")}</p>
              {previewUrl ? (
                <img className="receipt-processing-preview" src={previewUrl} alt="" />
              ) : null}
            </div>
          )}
          {step === "review" && (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              {previewUrl && <img className="detail-image" src={previewUrl} alt={t("receiptPhoto")} />}
              <div className="receipt-review-banner" role="status">
                <strong>{t("reviewReceipt")}</strong>
                <p>{t("receiptReadyToReview")}</p>
              </div>
              <label className="form-field">
                <span>{t("receiptMerchant")}</span>
                <input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder={t("merchantPlaceholder")} />
              </label>
              <label className="form-field">
                <span>{t("receiptAmount")}</span>
                <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
              </label>
              <label className="form-field">
                <span>{t("currency")}</span>
                <select
                  value={receiptCurrency}
                  onChange={(event) => setReceiptCurrency(event.target.value)}
                  aria-label={t("currency")}
                >
                  {currencyChoices.map((choice) => (
                    <option key={choice.code} value={choice.code}>
                      {choice.code} — {choice.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>{t("date")}</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <div className={`receipt-deduct full ${deductFromBalance ? "is-active" : ""}`}>
                <p className="receipt-deduct-summary" role="status">
                  {t("receiptAmount")}: <strong>{displayAmount} {displayCurrency}</strong>
                  {" · "}
                  {deductFromBalance
                    ? t("receiptWillAffectBalance")
                    : t("receiptWillNotAffectBalance")}
                </p>
                <label className="receipt-deduct-row">
                  <input
                    type="checkbox"
                    checked={deductFromBalance}
                    onChange={(event) => setDeductFromBalance(event.target.checked)}
                  />
                  <span className="receipt-deduct-label">
                    {(() => {
                      const label = t("deductFromBalance", {
                        amount: displayAmount,
                        currency: displayCurrency,
                      });
                      return label === "—" || !label
                        ? `Deduct ${displayAmount} ${displayCurrency} from balance`
                        : label;
                    })()}
                  </span>
                </label>
                <p className="transaction-sub receipt-deduct-hint">
                  {deductFromBalance
                    ? (() => {
                        const hint = t("deductFromBalanceHint");
                        return hint === "—" || !hint
                          ? "Creates one expense in Activity. Confirming again will not create a duplicate."
                          : hint;
                      })()
                    : t("receiptKeepBalanceSafe")}
                </p>
              </div>
              <div className="form-actions">
                <button className="secondary-button" type="button" disabled={busy} onClick={onClose}>
                  {t("cancel")}
                </button>
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? t("saving") : t("confirmReceipt")}
                </button>
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
