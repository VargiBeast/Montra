import { useMemo } from 'react';
import type { Transaction } from '@/types/transaction';
import { formatMoney, toIsoDate } from '@/lib/utils';
import './SpendingInsights.css';

interface Props {
  transactions: Transaction[];
}

/** Real analytics from user transactions — only shown when Plus is active. */
export function SpendingInsights({ transactions }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const startOfMonth = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = toIsoDate(now);

    let income = 0;
    let expenses = 0;
    const byMethod: Record<string, number> = {};

    // Last 6 months expense totals for mini trend
    const monthKeys: string[] = [];
    const monthTotals: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
      monthTotals[key] = 0;
    }

    for (const tx of transactions) {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'in') {
        if (tx.date >= startOfMonth && tx.date <= today) income += amount;
      } else {
        if (tx.date >= startOfMonth && tx.date <= today) {
          expenses += amount;
          const method = (tx.method && tx.method.trim()) || 'Other';
          byMethod[method] = (byMethod[method] ?? 0) + amount;
        }
        const mk = tx.date.slice(0, 7);
        if (mk in monthTotals) monthTotals[mk] += amount;
      }
    }

    const methods = Object.entries(byMethod)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const maxMethod = methods[0]?.[1] ?? 1;
    const maxMonth = Math.max(...monthKeys.map((k) => monthTotals[k]), 1);

    const net = income - expenses;
    const burnRate = expenses;

    return {
      income,
      expenses,
      net,
      burnRate,
      methods,
      maxMethod,
      monthKeys,
      monthTotals,
      maxMonth,
      hasData: transactions.length > 0,
    };
  }, [transactions]);

  if (!data.hasData) {
    return (
      <section className="insights">
        <h2 className="insights__title">Plus insights</h2>
        <p className="insights__empty">
          Add transactions to see spending breakdowns and trends.
        </p>
      </section>
    );
  }

  return (
    <section className="insights">
      <h2 className="insights__title">Plus insights</h2>

      <div className="insights__kpis">
        <div className="insights__kpi">
          <span>This month in</span>
          <strong className="insights__kpi--in">{formatMoney(data.income)}</strong>
        </div>
        <div className="insights__kpi">
          <span>This month out</span>
          <strong className="insights__kpi--out">{formatMoney(data.expenses)}</strong>
        </div>
        <div className="insights__kpi">
          <span>Net</span>
          <strong className={data.net >= 0 ? 'insights__kpi--in' : 'insights__kpi--out'}>
            {formatMoney(data.net)}
          </strong>
        </div>
      </div>

      <div className="insights__block">
        <h3>Spending by payment method</h3>
        {data.methods.length === 0 ? (
          <p className="insights__empty">No expenses this month yet.</p>
        ) : (
          <ul className="insights__bars">
            {data.methods.map(([name, total]) => (
              <li key={name}>
                <div className="insights__bar-meta">
                  <span>{name}</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <div className="insights__bar-track">
                  <div
                    className="insights__bar-fill"
                    style={{ width: `${Math.round((total / data.maxMethod) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="insights__block">
        <h3>Expense trend (6 months)</h3>
        <div className="insights__trend">
          {data.monthKeys.map((k) => {
            const v = data.monthTotals[k];
            const h = Math.max(4, Math.round((v / data.maxMonth) * 64));
            return (
              <div key={k} className="insights__trend-col">
                <div className="insights__trend-bar" style={{ height: h }} title={formatMoney(v)} />
                <span>{k.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
