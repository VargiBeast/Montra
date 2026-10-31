import { Camera, ImagePlus } from 'lucide-react';
import './ReceiptsPage.css';

export function ReceiptsPage() {
  return (
    <div className="receipts">
      <header className="receipts__header">
        <h1>Receipts</h1>
      </header>

      <div className="receipts__actions">
        <button type="button" className="receipts__action">
          <Camera size={22} />
          <span>Capture</span>
        </button>
        <button type="button" className="receipts__action">
          <ImagePlus size={22} />
          <span>Upload</span>
        </button>
      </div>

      <div className="receipts__empty">
        <p>No receipts yet.</p>
        <p className="receipts__empty-hint">
          Capture or upload a receipt. OCR will help extract details — you always confirm before
          creating a transaction.
        </p>
      </div>
    </div>
  );
}
