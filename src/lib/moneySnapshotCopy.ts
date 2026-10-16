/** Localized copy for Money Snapshot (Home). Merged into ui via Home fallbacks + optional use. */
export type MoneySnapshotLocale =
  | "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt"
  | "nl" | "fi" | "pl" | "cs" | "tr" | "ar" | "ja" | "ko" | "zh-Hans";

export type MoneySnapshotKeys =
  | "totalBalance"
  | "trackedBalanceNote"
  | "thisMonth"
  | "thisMonthIncome"
  | "thisMonthSpending"
  | "thisMonthNet"
  | "thisMonthEmpty";

export const moneySnapshotCopy: Record<MoneySnapshotLocale, Record<MoneySnapshotKeys, string>> = {
  en: {
    totalBalance: "Tracked balance",
    trackedBalanceNote: "From transactions you logged in Montra — not a bank balance.",
    thisMonth: "This month",
    thisMonthIncome: "Income",
    thisMonthSpending: "Spending",
    thisMonthNet: "Net",
    thisMonthEmpty: "No activity logged this month yet.",
  },
  nb: {
    totalBalance: "Sporbar saldo",
    trackedBalanceNote: "Basert på transaksjoner du har logget i Montra — ikke en banksaldo.",
    thisMonth: "Denne måneden",
    thisMonthIncome: "Inntekt",
    thisMonthSpending: "Utgifter",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Ingen aktivitet logget denne måneden ennå.",
  },
  sv: {
    totalBalance: "Spårbar saldo",
    trackedBalanceNote: "Baserat på transaktioner du loggat i Montra — inte ett banksaldo.",
    thisMonth: "Denna månad",
    thisMonthIncome: "Inkomst",
    thisMonthSpending: "Utgifter",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Ingen aktivitet loggad denna månad ännu.",
  },
  da: {
    totalBalance: "Sporebar saldo",
    trackedBalanceNote: "Baseret på transaktioner, du har logget i Montra — ikke en banksaldo.",
    thisMonth: "Denne måned",
    thisMonthIncome: "Indkomst",
    thisMonthSpending: "Udgifter",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Ingen aktivitet logget denne måned endnu.",
  },
  de: {
    totalBalance: "Erfasster Saldo",
    trackedBalanceNote: "Basierend auf Transaktionen, die du in Montra erfasst hast — kein Banksaldo.",
    thisMonth: "Dieser Monat",
    thisMonthIncome: "Einnahmen",
    thisMonthSpending: "Ausgaben",
    thisMonthNet: "Netto",
    thisMonthEmpty: "In diesem Monat noch keine Aktivität erfasst.",
  },
  fr: {
    totalBalance: "Solde suivi",
    trackedBalanceNote: "Basé sur les transactions que vous avez enregistrées dans Montra — pas un solde bancaire.",
    thisMonth: "Ce mois-ci",
    thisMonthIncome: "Revenus",
    thisMonthSpending: "Dépenses",
    thisMonthNet: "Net",
    thisMonthEmpty: "Aucune activité enregistrée ce mois-ci pour le moment.",
  },
  es: {
    totalBalance: "Saldo registrado",
    trackedBalanceNote: "Basado en las transacciones que registraste en Montra — no es un saldo bancario.",
    thisMonth: "Este mes",
    thisMonthIncome: "Ingresos",
    thisMonthSpending: "Gastos",
    thisMonthNet: "Neto",
    thisMonthEmpty: "Aún no hay actividad registrada este mes.",
  },
  it: {
    totalBalance: "Saldo tracciato",
    trackedBalanceNote: "Basato sulle transazioni che hai registrato in Montra — non è un saldo bancario.",
    thisMonth: "Questo mese",
    thisMonthIncome: "Entrate",
    thisMonthSpending: "Spese",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Nessuna attività registrata questo mese finora.",
  },
  pt: {
    totalBalance: "Saldo registado",
    trackedBalanceNote: "Com base nas transações que registou no Montra — não é um saldo bancário.",
    thisMonth: "Este mês",
    thisMonthIncome: "Receitas",
    thisMonthSpending: "Despesas",
    thisMonthNet: "Líquido",
    thisMonthEmpty: "Ainda não há atividade registada este mês.",
  },
  nl: {
    totalBalance: "Bijgehouden saldo",
    trackedBalanceNote: "Gebaseerd op transacties die je in Montra hebt gelogd — geen banksaldo.",
    thisMonth: "Deze maand",
    thisMonthIncome: "Inkomsten",
    thisMonthSpending: "Uitgaven",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Nog geen activiteit deze maand gelogd.",
  },
  fi: {
    totalBalance: "Seurattu saldo",
    trackedBalanceNote: "Perustuu Montraan kirjaamiisi tapahtumiin — ei pankkisaldo.",
    thisMonth: "Tämä kuukausi",
    thisMonthIncome: "Tulot",
    thisMonthSpending: "Menot",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Ei vielä kirjattua toimintaa tältä kuulta.",
  },
  pl: {
    totalBalance: "Śledzone saldo",
    trackedBalanceNote: "Na podstawie transakcji zapisanych w Montra — to nie saldo bankowe.",
    thisMonth: "Ten miesiąc",
    thisMonthIncome: "Przychody",
    thisMonthSpending: "Wydatki",
    thisMonthNet: "Netto",
    thisMonthEmpty: "Brak aktywności w tym miesiącu.",
  },
  cs: {
    totalBalance: "Sledovaný zůstatek",
    trackedBalanceNote: "Podle transakcí, které jste v Montra zaznamenali — nejde o bankovní zůstatek.",
    thisMonth: "Tento měsíc",
    thisMonthIncome: "Příjmy",
    thisMonthSpending: "Výdaje",
    thisMonthNet: "Čisté",
    thisMonthEmpty: "Tento měsíc zatím žádná aktivita.",
  },
  tr: {
    totalBalance: "Takip edilen bakiye",
    trackedBalanceNote: "Montra’da kaydettiğiniz işlemlere dayanır — banka bakiyesi değildir.",
    thisMonth: "Bu ay",
    thisMonthIncome: "Gelir",
    thisMonthSpending: "Harcama",
    thisMonthNet: "Net",
    thisMonthEmpty: "Bu ay henüz kayıtlı hareket yok.",
  },
  ar: {
    totalBalance: "الرصيد المتتبع",
    trackedBalanceNote: "بناءً على المعاملات التي سجلتها في Montra — وليس رصيدًا مصرفيًا.",
    thisMonth: "هذا الشهر",
    thisMonthIncome: "الدخل",
    thisMonthSpending: "المصروفات",
    thisMonthNet: "الصافي",
    thisMonthEmpty: "لا يوجد نشاط مسجّل هذا الشهر بعد.",
  },
  ja: {
    totalBalance: "記録された残高",
    trackedBalanceNote: "Montraに記録した取引に基づきます。銀行残高ではありません。",
    thisMonth: "今月",
    thisMonthIncome: "収入",
    thisMonthSpending: "支出",
    thisMonthNet: "純額",
    thisMonthEmpty: "今月の記録はまだありません。",
  },
  ko: {
    totalBalance: "추적된 잔액",
    trackedBalanceNote: "Montra에 기록한 거래를 기준으로 합니다. 은행 잔액이 아닙니다.",
    thisMonth: "이번 달",
    thisMonthIncome: "수입",
    thisMonthSpending: "지출",
    thisMonthNet: "순액",
    thisMonthEmpty: "이번 달에 기록된 활동이 아직 없습니다.",
  },
  "zh-Hans": {
    totalBalance: "已记录余额",
    trackedBalanceNote: "基于你在 Montra 中记录的交易，并非银行余额。",
    thisMonth: "本月",
    thisMonthIncome: "收入",
    thisMonthSpending: "支出",
    thisMonthNet: "净额",
    thisMonthEmpty: "本月尚无记录的活动。",
  },
};

export function resolveMoneySnapshotCopy(
  language: string,
  key: MoneySnapshotKeys,
): string | null {
  const normalized = language === "zh" || language.startsWith("zh-") ? "zh-Hans" : language.split("-")[0];
  const table =
    moneySnapshotCopy[normalized as MoneySnapshotLocale] ??
    moneySnapshotCopy[language as MoneySnapshotLocale] ??
    null;
  return table?.[key] ?? null;
}
