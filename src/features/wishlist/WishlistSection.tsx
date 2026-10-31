import { useState, type FormEvent } from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { formatMoney } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import './WishlistSection.css';

export function WishlistSection() {
  const { items, loading, save, remove } = useWishlist();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await save({
        name: name.trim(),
        description: null,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        priority: null,
        link: null,
        savings_goal_id: null,
        image: null,
      });
      setName('');
      setPrice('');
      setOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wish">
      <div className="wish__header">
        <h2>Wishlist</h2>
        <button type="button" className="wish__add" onClick={() => setOpen(true)}>
          <Plus size={18} /> Add
        </button>
      </div>

      {loading ? (
        <p className="wish__empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="wish__empty">No wishlist items yet.</p>
      ) : (
        <ul className="wish__list">
          {items.map((item) => (
            <li key={item.id} className="wish__item">
              <div>
                <span className="wish__name">{item.name}</span>
                {item.price != null && (
                  <span className="wish__price">{formatMoney(item.price)}</span>
                )}
              </div>
              <button type="button" onClick={() => confirm('Delete?') && remove(item)}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="wish__modal">
          <form onSubmit={handleCreate} className="wish__form">
            <h3>New wishlist item</h3>
            <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input inputMode="decimal" placeholder="Price (optional)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <div className="wish__actions">
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
