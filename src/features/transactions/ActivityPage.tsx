import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import './ActivityPage.css';

export function ActivityPage() {
  const [params] = useSearchParams();
  const showAdd = params.get('action') === 'add';

  return (
    <div className="activity">
      <header className="activity__header">
        <h1>Activity</h1>
        <div className="activity__tools">
          <button type="button" className="activity__icon-btn" aria-label="Search">
            <Search size={20} />
          </button>
          <button type="button" className="activity__icon-btn" aria-label="Filter">
            <Filter size={20} />
          </button>
        </div>
      </header>

      {showAdd && (
        <div className="activity__add-banner">
          Transaction form will open here. Full create/edit flow is being implemented.
        </div>
      )}

      <div className="activity__empty">
        <p>No transactions yet.</p>
        <p className="activity__empty-hint">
          Tap the + button to add your first income or expense.
        </p>
      </div>
    </div>
  );
}
