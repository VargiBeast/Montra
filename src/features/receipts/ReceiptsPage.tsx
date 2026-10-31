import { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { useReceipts } from '@/hooks/useReceipts';
import { formatMoney } from '@/lib/utils';
import './ReceiptsPage.css';

export function ReceiptsPage() {
  const { receipts, loading, error, upload, remove } = useReceipts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setStatus('Running OCR…');
    try {
      await upload(file);
      setStatus('Receipt saved. Review extracted data before creating a transaction.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="receipts">
      <header className="receipts__header">
        <h1>Receipts</h1>
      </header>

      <div className="receipts__actions">
        <button
          type="button"
          className="receipts__action"
          disabled={uploading}
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.accept = 'image/*';
              fileRef.current.capture = 'environment';
              fileRef.current.click();
            }
          }}
        >
          <Camera size={22} />
          <span>Capture</span>
        </button>
        <button
          type="button"
          className="receipts__action"
          disabled={uploading}
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute('capture');
              fileRef.current.click();
            }
          }}
        >
          <ImagePlus size={22} />
          <span>Upload</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {uploading && (
        <div className="receipts__status">
          <Loader2 size={18} className="spin" /> {status}
        </div>
      )}
      {status && !uploading && <div className="receipts__status">{status}</div>}
      {error && <div className="receipts__error">{error}</div>}

      {loading ? (
        <div className="receipts__empty"><p>Loading…</p></div>
      ) : receipts.length === 0 ? (
        <div className="receipts__empty">
          <p>No receipts yet.</p>
          <p className="receipts__empty-hint">
            Capture or upload a receipt. OCR suggests details — you always confirm before creating a transaction.
          </p>
        </div>
      ) : (
        <ul className="receipts__list">
          {receipts.map((r) => (
            <li key={r.id} className="receipts__item">
              <div className="receipts__item-info">
                <span className="receipts__merchant">{r.merchant || 'Receipt'}</span>
                <span className="receipts__meta">
                  {r.date || r.created_at.slice(0, 10)}
                  {r.amount != null ? ` · ${formatMoney(r.amount)}` : ''}
                </span>
                {r.extracted_text && (
                  <p className="receipts__excerpt">{r.extracted_text.slice(0, 120)}…</p>
                )}
              </div>
              <button
                type="button"
                className="receipts__delete"
                aria-label="Delete"
                onClick={async () => {
                  if (confirm('Delete this receipt?')) await remove(r);
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
