import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useReceipts } from "../../hooks/useReceipts";
import { useDisplayCurrency } from "../../lib/currency";
import { ReceiptsPage } from "../../pages/ReceiptsPage";
import type { Receipt } from "../../types/receipt";
import { LoadingState } from "../ui/LoadingState";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

/**
 * Bridge: receipts list + upload.
 * OCR confirmation still requires explicit user action via update status
 * (never auto-creates transactions).
 */
export function FeatureReceiptsPage() {
  const auth = useAuth();
  const receipts = useReceipts(auth.user?.id);
  const { currency } = useDisplayCurrency();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Receipt | null>(null);

  const onAdd = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploading(true);
      setUploadError(null);
      try {
        const created = await receipts.upload(file, currency);
        setSelected(created);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [receipts, currency],
  );

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {uploadError ? (
        <p role="alert" style={{ color: "var(--m-negative)", marginBottom: 12, fontSize: 13 }}>
          {uploadError}
        </p>
      ) : null}
      {receipts.error ? (
        <Card style={{ marginBottom: 12 }}>
          <p role="alert" style={{ color: "var(--m-negative)", margin: "0 0 8px" }}>
            {receipts.error}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void receipts.refresh()}>
            Retry
          </Button>
        </Card>
      ) : null}
      {selected ? (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            {selected.merchant?.trim() || "Receipt"} · {selected.status}
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--m-text-secondary)" }}>
            Review details before creating a transaction. OCR never posts automatically.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void receipts
                  .update(selected, {
                    merchant: selected.merchant,
                    total_amount: selected.total_amount,
                    currency: selected.currency,
                    receipt_date: selected.receipt_date,
                    status: "reviewed",
                  })
                  .then(() => setSelected(null))
              }
            >
              Mark reviewed
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate("/app/activity")}>
              Go to activity
            </Button>
          </div>
        </Card>
      ) : null}
      <ReceiptsPage
        receipts={receipts.receipts}
        getImageUrl={receipts.getImageUrl}
        uploading={uploading}
        onAdd={onAdd}
        onSelect={setSelected}
      />
    </div>
  );
}
