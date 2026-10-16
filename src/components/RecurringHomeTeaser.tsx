import type { RecurringPayment } from "../types/recurringPayment";
import { resolveRecurringCopy } from "../lib/recurringCopy";
import { formatDate, formatMoney } from "../lib/utils";
import { useDisplayCurrency } from "../lib/currency";
import { useLanguage } from "../lib/i18n";

export function RecurringHomeTeaser({
  items,
  onOpen,
}: {
  items: RecurringPayment[];
  onOpen?: () => void;
}) {
  const { language } = useLanguage();
  const { currency, convertFromBase } = useDisplayCurrency();
  const active = items.filter((r) => r.active).slice(0, 3);
  if (active.length === 0) return null;
  const money = (v: number) =>
    formatMoney(v, currency, language, convertFromBase(v, currency));
  const t = (k: Parameters<typeof resolveRecurringCopy>[1]) =>
    resolveRecurringCopy(language, k);

  return (
    <section className="void-month" aria-label={t("homeTitle")}>
      <div className="void-month-head">
        <h2 className="void-month-title">{t("homeTitle")}</h2>
        {onOpen && (
          <button type="button" className="text-button" onClick={onOpen}>
            {t("homeViewAll")}
          </button>
        )}
      </div>
      <p className="life-disclaimer" style={{ margin: "0 0 8px" }}>
        {t("disclaimer")}
      </p>
      <ul className="life-milestone-list">
        {active.map((r) => (
          <li key={r.id}>
            <strong>
              {r.name}{" "}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{t("plannedBadge")}</span>
            </strong>
            <span>
              {t("nextDue")}: {formatDate(r.next_due_date, language)} · {money(r.amount)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
