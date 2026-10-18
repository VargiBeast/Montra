import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWishlist } from "../../hooks/useWishlist";
import { useSavingsGoals } from "../../hooks/useSavingsGoals";
import { useDisplayCurrency } from "../../lib/currency";
import { readLanguage } from "../../lib/i18n";
import { formatMoney } from "../../lib/utils";
import type { WishlistItem, WishlistItemInput } from "../../types/wishlist";
import { PageHeader } from "../ui/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";

export function WishlistPageNew() {
  const auth = useAuth();
  const wishlist = useWishlist(auth.user?.id);
  const goals = useSavingsGoals(auth.user?.id);
  const { currency } = useDisplayCurrency();
  const locale = readLanguage();

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState("");

  function openCreate() {
    setName("");
    setPrice("");
    setUrl("");
    setDetails("");
    setFormError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(price);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setFormError("Enter a valid price.");
      return;
    }
    const input: WishlistItemInput = {
      name: name.trim(),
      price: num,
      currency,
      url: url.trim() || null,
      details: details.trim() || null,
      purchased: false,
      savings_goal_id: null,
      image: null,
    };
    setBusy(true);
    try {
      await wishlist.save(input);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePurchased(item: WishlistItem) {
    setBusy(true);
    try {
      await wishlist.save(
        {
          name: item.name,
          price: item.price,
          currency: item.currency,
          url: item.url,
          details: item.details,
          purchased: !item.purchased,
          savings_goal_id: item.savings_goal_id,
          image: null,
        },
        item,
      );
    } finally {
      setBusy(false);
    }
  }

  if (auth.isLoading) return <LoadingState label="Loading…" />;

  return (
    <div className="m-anim-in">
      <PageHeader
        title="Wishlist"
        subtitle="Things you want"
        action={
          <Button size="sm" onClick={openCreate}>
            + Item
          </Button>
        }
      />

      {showForm ? (
        <Card padding="lg" className="m-anim-scale" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Add item</h2>
          <form onSubmit={(e) => void submit(e)}>
            <div className="m-field">
              <label className="m-label">Name</label>
              <input className="m-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="m-field">
              <label className="m-label">Price ({currency})</label>
              <input className="m-input" type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="m-field">
              <label className="m-label">Link (optional)</label>
              <input className="m-input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="m-field">
              <label className="m-label">Details (optional)</label>
              <input className="m-input" value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            {formError ? <p role="alert" style={{ color: "var(--m-negative)", fontSize: 13 }}>{formError}</p> : null}
            <div style={{ display: "flex", gap: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {wishlist.isLoading ? (
        <LoadingState label="Loading wishlist…" />
      ) : wishlist.error ? (
        <Card>
          <p role="alert" style={{ color: "var(--m-negative)" }}>
            {wishlist.error}
          </p>
          <Button variant="secondary" onClick={() => void wishlist.refresh()} style={{ marginTop: 12 }}>
            Retry
          </Button>
        </Card>
      ) : wishlist.items.length === 0 && !showForm ? (
        <Card>
          <EmptyState title="Wishlist is empty" description="Save products and ideas here." actionLabel="Add item" onAction={openCreate} />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {wishlist.items.map((item, i) => (
            <Card key={item.id} className={`m-anim-in m-anim-delay-${Math.min(i + 1, 4)}`} padding="md">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      fontSize: 15,
                      textDecoration: item.purchased ? "line-through" : undefined,
                      opacity: item.purchased ? 0.6 : 1,
                    }}
                  >
                    {item.name}
                  </strong>
                  {item.details ? (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--m-text-muted)" }}>{item.details}</p>
                  ) : null}
                </div>
                <strong style={{ whiteSpace: "nowrap" }}>
                  {formatMoney(item.price, item.currency || currency, locale, item.price)}
                </strong>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void togglePurchased(item)}>
                  {item.purchased ? "Mark unbought" : "Mark bought"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete “${item.name}”?`)) void wishlist.remove(item);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {goals.goals.length > 0 ? (
            <p style={{ fontSize: 12, color: "var(--m-text-muted)", margin: "8px 0 0" }}>
              {goals.goals.length} savings goal{goals.goals.length === 1 ? "" : "s"} available to link in a future edit.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
