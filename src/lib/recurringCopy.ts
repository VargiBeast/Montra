export type RecurringLocale =
  | "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt"
  | "nl" | "fi" | "pl" | "cs" | "tr" | "ar" | "ja" | "ko" | "zh-Hans";

type Keys =
  | "title" | "hint" | "empty" | "add" | "edit" | "save" | "cancel" | "delete"
  | "pause" | "resume" | "name" | "amount" | "type" | "typeIn" | "typeOut"
  | "interval" | "weekly" | "monthly" | "yearly" | "anchor" | "nextDue" | "note"
  | "plannedBadge" | "homeTitle" | "homeEmpty" | "homeViewAll"
  | "paused" | "active" | "disclaimer";

const en: Record<Keys, string> = {
  title: "Planned payments",
  hint: "Track rent, subscriptions and salary schedules. These are plans — not recorded transactions.",
  empty: "No planned payments yet. Add rent, a subscription or a salary schedule.",
  add: "Add planned payment",
  edit: "Edit",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  pause: "Pause",
  resume: "Resume",
  name: "Name",
  amount: "Amount",
  type: "Type",
  typeIn: "Income",
  typeOut: "Expense",
  interval: "Interval",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  anchor: "First / reference date",
  nextDue: "Next due",
  note: "Note",
  plannedBadge: "Planned",
  homeTitle: "Upcoming planned",
  homeEmpty: "No upcoming planned payments",
  homeViewAll: "Manage",
  paused: "Paused",
  active: "Active",
  disclaimer: "Planned amounts are not included in balance, analytics or Money Snapshot until you log them as transactions.",
};

const table: Record<RecurringLocale, Record<Keys, string>> = {
  en,
  nb: {
    ...en,
    title: "Planlagte betalinger",
    hint: "Hold oversikt over husleie, abonnement og lønn. Dette er planer — ikke registrerte transaksjoner.",
    empty: "Ingen planlagte betalinger ennå. Legg til husleie, abonnement eller lønn.",
    add: "Legg til planlagt betaling",
    edit: "Rediger",
    save: "Lagre",
    cancel: "Avbryt",
    delete: "Slett",
    pause: "Pause",
    resume: "Aktiver",
    name: "Navn",
    amount: "Beløp",
    type: "Type",
    typeIn: "Inntekt",
    typeOut: "Utgift",
    interval: "Intervall",
    weekly: "Ukentlig",
    monthly: "Månedlig",
    yearly: "Årlig",
    anchor: "Første / referansedato",
    nextDue: "Neste forfall",
    note: "Notat",
    plannedBadge: "Planlagt",
    homeTitle: "Kommende planlagte",
    homeEmpty: "Ingen kommende planlagte betalinger",
    homeViewAll: "Administrer",
    paused: "Pauset",
    active: "Aktiv",
    disclaimer: "Planlagte beløp inngår ikke i saldo, analyse eller Money Snapshot før du registrerer dem som transaksjoner.",
  },
  sv: { ...en, title: "Planerade betalningar", plannedBadge: "Planerad", homeTitle: "Kommande planerade" },
  da: { ...en, title: "Planlagte betalinger", plannedBadge: "Planlagt", homeTitle: "Kommende planlagte" },
  de: { ...en, title: "Geplante Zahlungen", plannedBadge: "Geplant", homeTitle: "Kommende geplant" },
  fr: { ...en, title: "Paiements planifiés", plannedBadge: "Planifié", homeTitle: "À venir (planifié)" },
  es: { ...en, title: "Pagos planificados", plannedBadge: "Planificado", homeTitle: "Próximos planificados" },
  it: { ...en, title: "Pagamenti pianificati", plannedBadge: "Pianificato", homeTitle: "Prossimi pianificati" },
  pt: { ...en, title: "Pagamentos planeados", plannedBadge: "Planeado", homeTitle: "Próximos planeados" },
  nl: { ...en, title: "Geplande betalingen", plannedBadge: "Gepland", homeTitle: "Aankomend gepland" },
  fi: { ...en, title: "Suunnitellut maksut", plannedBadge: "Suunniteltu", homeTitle: "Tulossa (suunniteltu)" },
  pl: { ...en, title: "Zaplanowane płatności", plannedBadge: "Plan", homeTitle: "Nadchodzące (plan)" },
  cs: { ...en, title: "Plánované platby", plannedBadge: "Plán", homeTitle: "Nadcházející (plán)" },
  tr: { ...en, title: "Planlanan ödemeler", plannedBadge: "Plan", homeTitle: "Yaklaşan planlar" },
  ar: {
    ...en,
    title: "مدفوعات مخططة",
    hint: "تتبع الإيجار والاشتراكات والراتب. هذه خطط — وليست معاملات مسجّلة.",
    empty: "لا توجد مدفوعات مخططة بعد.",
    add: "إضافة دفعة مخططة",
    plannedBadge: "مخطط",
    homeTitle: "المخطط القادم",
    disclaimer: "المبالغ المخططة لا تدخل في الرصيد أو التحليل حتى تسجّلها كمعاملات.",
  },
  ja: { ...en, title: "予定の支払い", plannedBadge: "予定", homeTitle: "今後の予定" },
  ko: { ...en, title: "예정 결제", plannedBadge: "예정", homeTitle: "다가오는 예정" },
  "zh-Hans": { ...en, title: "计划付款", plannedBadge: "计划", homeTitle: "即将到期（计划）" },
};

export function resolveRecurringCopy(language: string, key: Keys): string {
  const normalized =
    language === "zh" || language.startsWith("zh-")
      ? "zh-Hans"
      : language.split("-")[0];
  const bag =
    table[normalized as RecurringLocale] ??
    table[language as RecurringLocale] ??
    table.en;
  return bag[key] ?? table.en[key] ?? key;
}
