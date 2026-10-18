import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useReceipts } from "../../hooks/useReceipts";
import { useDisplayCurrency } from "../../lib/currency";
import { formatDate } from "../../lib/utils";
import type { Receipt } from "../../types/receipt";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";

export function ReceiptsPageNew() {
  const auth = useAuth();
  const receipts = useReceipts(auth.user?.id);
  const { currency } = useDisplayCurrency();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Receipt | null>(null);

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
    <div className="m-anim-in">
      <PageHeader
        title="Receipts"
        subtitle="Capture and confirm — never auto-posted"
        action={
          <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : "+ Upload"}
          </Button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {uploadError ? (
        <p role="alert" style={{ color: "var(--m-negative)", fontSize: 13, marginBottom: 12 }}>
          {uploadError}
        </p>
      ) : null}

      {selected ? (
        <Card className="m-anim-scale" style={{ marginBottom: 16 }} padding="md">
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
            {selected.merchant?.trim() || "Receipt"} · {selected.status}
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--m-text-muted)" }}>
            Review before creating a transaction. OCR never posts automatically.
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
              Activity
            </Button>
          </div>
        </Card>
      ) : null}

      {receipts.isLoading ? (
        <LoadingState label="Loading receipts…" />
      ) : receipts.error ? (
        <Card>
          <p role="alert" style={{ color: "var(--m-negative)" }}>
            {receipts.error}
          </p>
          <Button variant="secondary" onClick={() => void receipts.refresh()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </Card>
      ) : receipts.receipts.length === 0 ? (
        <Card>
          <EmptyState
            title="No receipts yet"
            description="Upload a photo. You confirm before any transaction is created."
            actionLabel="Upload receipt"
            onAction={() => fileRef.current?.click()}
          />
        </Card>
      ) : (
        <Card padding="md">
          {receipts.receipts.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                border: "none",
                borderBottom: "1px solid var(--m-border)",
                background: "none",
                color: "inherit",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.merchant?.trim() || "Untitled"}</div>
                <div style={{ fontSize: 12, color: "var(--m-text-muted)", marginTop: 2 }}>
                  {r.status} · {formatDate(r.receipt_date || r.created_at.slice(0, 10))}
                </div>
              </div>
              {r.total_amount != null ? (
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {Number(r.total_amount)} {r.currency}
                </span>
              ) : null}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
