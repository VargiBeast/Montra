import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Gift,
  ImagePlus,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import type { WishlistItem, WishlistItemInput } from "../types/wishlist";
import type { SavingsGoal } from "../types/savingsGoal";
import { formatMoney, validateProductUrl } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage, useTranslation } from "../lib/i18n";
import { currencyChoices, normalizeDisplayCurrency, type DisplayCurrency } from "../lib/preferences";

interface WishlistPageProps {
  items: WishlistItem[];
  goals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onSave: (input: WishlistItemInput, existing?: WishlistItem) => Promise<void>;
  onDelete: (item: WishlistItem) => Promise<void>;
  getImageUrl: (path: string) => Promise<string>;
  onRetry?: () => void;
}

const FALLBACK: Record<string, string> = {};

export function WishlistPage({
  items,
  goals,
  isLoading,
  error,
  onBack,
  onSave,
  onDelete,
  getImageUrl,
  onRetry,
}: WishlistPageProps) {
  const translate = useTranslation();
  const t = (key: string, values?: Record<string, string | number>) => {
    const value = translate(key, values);
    if (value !== "\u2014") return value;
    return FALLBACK[key] ?? key;
  };
  const { language } = useLanguage();
  const { currency: displayCurrency, convertFromBase, convertToBase } = useDisplayCurrency();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WishlistItem | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [itemCurrency, setItemCurrency] = useState<DisplayCurrency>(displayCurrency);
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [goalId, setGoalId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const goalMap = useMemo(() => {
    const map = new Map<string, SavingsGoal>();
    for (const g of goals) map.set(g.id, g);
    return map;
  }, [goals]);

  const totals = useMemo(() => {
    let allBase = 0;
    let remainingBase = 0;
    for (const item of items) {
      const base = convertToBase(Number(item.price) || 0, item.currency || "NOK");
      allBase += base;
      if (!item.purchased) remainingBase += base;
    }
    return {
      all: convertFromBase(allBase, displayCurrency),
      remaining: convertFromBase(remainingBase, displayCurrency),
    };
  }, [items, convertToBase, convertFromBase, displayCurrency]);

  function formatItemPrice(item: WishlistItem) {
    const amount = Number(item.price) || 0;
    return formatMoney(amount, item.currency || "NOK", language, amount);
  }

  function formatDisplay(amount: number) {
    return formatMoney(amount, displayCurrency, language, amount);
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setPrice("");
    setItemCurrency(displayCurrency);
    setUrl("");
    setDetails("");
    setPurchased(false);
    setGoalId("");
    setImageFile(null);
    setRemoveImage(false);
    setImagePreview(null);
    setFormError(null);
  }

  function openEdit(item: WishlistItem) {
    setCreating(false);
    setEditing(item);
    setName(item.name);
    setPrice(String(item.price));
    setItemCurrency(normalizeDisplayCurrency(item.currency || "NOK"));
    setUrl(item.url ?? "");
    setDetails(item.details ?? "");
    setPurchased(item.purchased);
    const linkedId = item.savings_goal_id ?? "";
    setGoalId(linkedId && goals.some((g) => g.id === linkedId) ? linkedId : "");
    setImageFile(null);
    setRemoveImage(false);
    setImagePreview(null);
    setFormError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
    setImageFile(null);
    setImagePreview(null);
  }

  function onPickImage(file: File | null) {
    setImageFile(file);
    setRemoveImage(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError(t("wishlistNameRequired"));
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      setFormError(t("wishlistPriceInvalid"));
      return;
    }
    const link = validateProductUrl(url);
    if (link.error) {
      setFormError(t(link.error));
      return;
    }
    const input: WishlistItemInput = {
      name,
      price: Number(price),
      currency: itemCurrency,
      url: link.url,
      details: details.trim() || null,
      purchased,
      savings_goal_id: goalId || null,
      image: imageFile,
      removeImage: removeImage && !imageFile,
    };
    setBusy(true);
    try {
      await onSave(input, editing ?? undefined);
      closeForm();
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : "Could not save item.";
      const translated = t(msg);
      setFormError(translated !== "\u2014" && translated !== msg ? translated : msg);
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(item: WishlistItem) {
    setBusy(true);
    try {
      await onDelete(item);
      setConfirmDelete(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Could not delete item.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePurchased(item: WishlistItem) {
    setBusy(true);
    try {
      await onSave(
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
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Could not update item.");
    } finally {
      setBusy(false);
    }
  }

  const showForm = creating || Boolean(editing);

  return (
    <main className="page-content wishlist-page">
      <div className="page-header wishlist-header">
        <button type="button" className="icon-button" aria-label={t("back")} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="greeting">{t("wishlistGreeting")}</p>
          <h1 className="page-title">{t("wishlist")}</h1>
        </div>
        <button type="button" className="primary-button wishlist-add" onClick={openCreate}>
          <Plus size={16} />
          {t("wishlistAdd")}
        </button>
      </div>

      {error && (
        <div className="panel stack-notice savings-inline-error">
          <p className="form-error">{error}</p>
          {onRetry && (
            <button type="button" className="secondary-button" onClick={onRetry}>
              {t("wishlistRetry")}
            </button>
          )}
        </div>
      )}
      {formError && !showForm && <p className="form-error stack-notice">{formError}</p>}

      {!isLoading && items.length > 0 && (
        <section className="panel section-panel wishlist-totals">
          <div>
            <span className="eyebrow">{t("wishlistTotal")}</span>
            <strong>{formatDisplay(totals.all)}</strong>
          </div>
          <div>
            <span className="eyebrow">{t("wishlistTotalRemaining")}</span>
            <strong>{formatDisplay(totals.remaining)}</strong>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="loading-block panel">{t("loading")}</div>
      ) : items.length === 0 && !showForm ? (
        <section className="panel section-panel">
          <div className="empty-state">
            <span className="empty-art">
              <Gift size={22} />
            </span>
            <h3>{t("wishlistEmptyTitle")}</h3>
            <p>{t("wishlistEmptyBody")}</p>
            <button type="button" className="primary-button" onClick={openCreate}>
              {t("wishlistAdd")}
            </button>
          </div>
        </section>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              goal={item.savings_goal_id ? goalMap.get(item.savings_goal_id) : undefined}
              priceLabel={formatItemPrice(item)}
              getImageUrl={getImageUrl}
              t={t}
              onEdit={() => openEdit(item)}
              onDelete={() => setConfirmDelete(item)}
              onTogglePurchased={() => void togglePurchased(item)}
              busy={busy}
            />
          ))}
        </div>
      )}

      {showForm && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={closeForm}>
          <div
            className="modal-sheet panel wishlist-form-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wishlist-form-title">{editing ? t("wishlistEdit") : t("wishlistAdd")}</h2>
            <form className="stack-md" onSubmit={(e) => void submitForm(e)}>
              <label className="form-field">
                <span>{t("wishlistName")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("wishlistNamePlaceholder")}
                  required
                  maxLength={120}
                  autoFocus
                />
              </label>
              <div className="wishlist-form-row">
                <label className="form-field">
                  <span>{t("wishlistPrice")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>{t("wishlistCurrency")}</span>
                  <select value={itemCurrency} onChange={(e) => setItemCurrency(normalizeDisplayCurrency(e.target.value))}>
                    {currencyChoices.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field">
                <span>{t("wishlistImage")}</span>
                <p className="analytics-hint">{t("wishlistImageHint")}</p>
                {(imagePreview || (editing?.image_path && !removeImage && !imageFile)) && (
                  <div className="wishlist-form-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" />
                    ) : (
                      <ExistingImage path={editing!.image_path!} getImageUrl={getImageUrl} />
                    )}
                  </div>
                )}
                <div className="wishlist-image-actions">
                  <label className="secondary-button wishlist-file-label">
                    <ImagePlus size={16} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                    />
                    {t("wishlistImage")}
                  </label>
                  {(imageFile || (editing?.image_path && !removeImage)) && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        onPickImage(null);
                        if (editing?.image_path) setRemoveImage(true);
                      }}
                    >
                      {t("wishlistRemoveImage")}
                    </button>
                  )}
                </div>
              </div>
              <label className="form-field">
                <span>{t("wishlistUrl")}</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t("wishlistUrlPlaceholder")}
                  inputMode="url"
                />
              </label>
              <label className="form-field">
                <span>{t("wishlistDetails")}</span>
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t("wishlistDetailsPlaceholder")}
                  maxLength={240}
                />
              </label>
              <label className="form-field">
                <span>{t("wishlistSavingsGoal")}</span>
                <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
                  <option value="">{t("wishlistNoGoal")}</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              {editing && (
                <label className="form-field wishlist-purchased-field">
                  <span className="wishlist-check-row">
                    <input type="checkbox" checked={purchased} onChange={(e) => setPurchased(e.target.checked)} />
                    {t("wishlistPurchased")}
                  </span>
                </label>
              )}
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={closeForm} disabled={busy}>
                  {t("wishlistCancel")}
                </button>
                <button type="submit" className="primary-button" disabled={busy}>
                  {t("wishlistSave")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {confirmDelete && createPortal(
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-sheet panel"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{t("wishlistDelete")}</h2>
            <p>{t("wishlistDeleteConfirm")}</p>
            <p>
              <strong>{confirmDelete.name}</strong>
            </p>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmDelete(null)} disabled={busy}>
                {t("wishlistCancel")}
              </button>
              <button type="button" className="danger-button" disabled={busy} onClick={() => void doDelete(confirmDelete)}>
                {t("wishlistDelete")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </main>
  );
}

function ExistingImage({
  path,
  getImageUrl,
}: {
  path: string;
  getImageUrl: (path: string) => Promise<string>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void getImageUrl(path)
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [path, getImageUrl]);
  if (!src) return <div className="wishlist-img-placeholder" />;
  return <img src={src} alt="" />;
}

function WishlistCard({
  item,
  goal,
  priceLabel,
  getImageUrl,
  t,
  onEdit,
  onDelete,
  onTogglePurchased,
  busy,
}: {
  item: WishlistItem;
  goal?: SavingsGoal;
  priceLabel: string;
  getImageUrl: (path: string) => Promise<string>;
  t: (key: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
  busy: boolean;
}) {
  return (
    <article className={`panel wishlist-card ${item.purchased ? "is-purchased" : ""}`}>
      <div className="wishlist-card-media">
        {item.image_path ? (
          <ExistingImage path={item.image_path} getImageUrl={getImageUrl} />
        ) : (
          <div className="wishlist-img-placeholder">
            <Gift size={22} />
          </div>
        )}
        {item.purchased && (
          <span className="wishlist-purchased-badge">
            <Check size={12} /> {t("wishlistPurchased")}
          </span>
        )}
      </div>
      <div className="wishlist-card-body">
        <div className="wishlist-card-top">
        <strong className={`wishlist-card-name ${item.purchased ? "is-purchased" : ""}`}>{item.name}</strong>
          <strong className="wishlist-card-price">{priceLabel}</strong>
        </div>
        {item.details && <p className="wishlist-card-details">{item.details}</p>}
        {goal && (
          <p className="wishlist-goal-chip">
            <Target size={14} aria-hidden="true" />
            <span>
              {t("wishlistSavingFor")}: {goal.name}
            </span>
          </p>
        )}
        <div className="wishlist-card-actions">
          {item.url ? (
            <a className="text-button wishlist-link-btn" href={item.url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> {t("wishlistOpenProduct")}
            </a>
          ) : null}
          <button type="button" className="text-button" onClick={onEdit} disabled={busy}>
            {t("wishlistEdit")}
          </button>
          <button type="button" className="text-button" onClick={onTogglePurchased} disabled={busy}>
            {item.purchased ? t("wishlistMarkNotPurchased") : t("wishlistMarkPurchased")}
          </button>
          <button type="button" className="icon-button" aria-label={t("wishlistDelete")} onClick={onDelete} disabled={busy}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
