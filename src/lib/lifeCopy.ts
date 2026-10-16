/** i18n for What If? and Money Journey — all 18 locales. */
export type LifeLocale =
  | "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt"
  | "nl" | "fi" | "pl" | "cs" | "tr" | "ar" | "ja" | "ko" | "zh-Hans";

type Keys =
  | "whatIfTitle" | "whatIfHint" | "whatIfSelectGoal" | "whatIfNoGoals"
  | "whatIfMonthly" | "whatIfRemaining" | "whatIfMonths" | "whatIfMonthsValue"
  | "whatIfReach" | "whatIfComplete" | "whatIfNeedRate"
  | "whatIfVsPlan" | "whatIfEstimate" | "whatIfBeats" | "whatIfBehind"
  | "journeyTitle" | "journeyHint" | "journeyEmpty" | "journeyNoGoals"
  | "journeyMonth" | "journeyIncome" | "journeySpending" | "journeyNet"
  | "journeyGoals" | "journeyStageEarly" | "journeyStageBuilding"
  | "journeyStageHalfway" | "journeyStageAlmost" | "journeyStageReached";

const en: Record<Keys, string> = {
  whatIfTitle: "What if?",
  whatIfHint: "Explore a hypothetical monthly save rate. Estimates only — nothing is saved for you.",
  whatIfSelectGoal: "Choose a goal",
  whatIfNoGoals: "Add a savings goal to explore scenarios.",
  whatIfMonthly: "If I save this much per month",
  whatIfRemaining: "Still to go",
  whatIfMonths: "Estimated months",
  whatIfMonthsValue: "{count} months",
  whatIfReach: "Around",
  whatIfComplete: "Goal already reached",
  whatIfNeedRate: "Enter a monthly amount above zero to see an estimate.",
  whatIfVsPlan: "Deadline plan needs about {amount}/month",
  whatIfEstimate: "Estimate — not a guarantee.",
  whatIfBeats: "Faster than the deadline plan",
  whatIfBehind: "Slower than the deadline plan",
  journeyTitle: "Money journey",
  journeyHint: "Months with real activity and progress on your goals.",
  journeyEmpty: "Log transactions over time to see your journey here.",
  journeyNoGoals: "No savings goals yet.",
  journeyMonth: "Month",
  journeyIncome: "In",
  journeySpending: "Out",
  journeyNet: "Net",
  journeyGoals: "Goals",
  journeyStageEarly: "Getting started",
  journeyStageBuilding: "Building",
  journeyStageHalfway: "Halfway",
  journeyStageAlmost: "Almost there",
  journeyStageReached: "Reached",
};

const table: Record<LifeLocale, Record<Keys, string>> = {
  en,
  nb: {
    ...en,
    whatIfTitle: "Hva om?",
    whatIfHint: "Utforsk et hypotetisk månedlig sparebeløp. Kun estimater — ingenting lagres automatisk.",
    whatIfSelectGoal: "Velg et mål",
    whatIfNoGoals: "Legg til et sparemål for å utforske scenarier.",
    whatIfMonthly: "Hvis jeg sparer så mye i måneden",
    whatIfRemaining: "Gjenstår",
    whatIfMonths: "Estimert antall måneder",
    whatIfMonthsValue: "{count} måneder",
    whatIfReach: "Omtrent",
    whatIfComplete: "Målet er allerede nådd",
    whatIfNeedRate: "Skriv inn et månedlig beløp over null for å se et estimat.",
    whatIfVsPlan: "Tidsplanen krever omtrent {amount}/mnd",
    whatIfEstimate: "Estimat — ikke en garanti.",
    whatIfBeats: "Raskere enn tidsplanen",
    whatIfBehind: "Tregere enn tidsplanen",
    journeyTitle: "Pengehistorikk",
    journeyHint: "Måneder med faktisk aktivitet og fremdrift på målene dine.",
    journeyEmpty: "Logg transaksjoner over tid for å se historikken her.",
    journeyNoGoals: "Ingen sparemål ennå.",
    journeyMonth: "Måned",
    journeyIncome: "Inn",
    journeySpending: "Ut",
    journeyNet: "Netto",
    journeyGoals: "Mål",
    journeyStageEarly: "Kommet i gang",
    journeyStageBuilding: "Bygger",
    journeyStageHalfway: "Halvveis",
    journeyStageAlmost: "Nesten i mål",
    journeyStageReached: "Nådd",
  },
  sv: { ...en, whatIfTitle: "Tänk om?", journeyTitle: "Pengaresa", whatIfEstimate: "Uppskattning — ingen garanti." },
  da: { ...en, whatIfTitle: "Hvad nu hvis?", journeyTitle: "Pengehistorik", whatIfEstimate: "Estimat — ikke en garanti." },
  de: { ...en, whatIfTitle: "Was wäre wenn?", journeyTitle: "Geldreise", whatIfEstimate: "Schätzung — keine Garantie." },
  fr: { ...en, whatIfTitle: "Et si ?", journeyTitle: "Parcours argent", whatIfEstimate: "Estimation — pas une garantie." },
  es: { ...en, whatIfTitle: "¿Y si?", journeyTitle: "Recorrido", whatIfEstimate: "Estimación — no es una garantía." },
  it: { ...en, whatIfTitle: "E se?", journeyTitle: "Percorso", whatIfEstimate: "Stima — non una garanzia." },
  pt: { ...en, whatIfTitle: "E se?", journeyTitle: "Percurso", whatIfEstimate: "Estimativa — não é uma garantia." },
  nl: { ...en, whatIfTitle: "Wat als?", journeyTitle: "Geldreis", whatIfEstimate: "Schatting — geen garantie." },
  fi: { ...en, whatIfTitle: "Entä jos?", journeyTitle: "Rahamatka", whatIfEstimate: "Arvio — ei takuu." },
  pl: { ...en, whatIfTitle: "A co jeśli?", journeyTitle: "Podróż finansowa", whatIfEstimate: "Szacunek — nie gwarancja." },
  cs: { ...en, whatIfTitle: "Co kdyby?", journeyTitle: "Cesta peněz", whatIfEstimate: "Odhad — žádná záruka." },
  tr: { ...en, whatIfTitle: "Ne olur?", journeyTitle: "Para yolculuğu", whatIfEstimate: "Tahmin — garanti değil." },
  ar: {
    ...en,
    whatIfTitle: "ماذا لو؟",
    whatIfHint: "استكشف معدل ادخار شهري افتراضي. تقديرات فقط — لا يُحفظ أي شيء تلقائيًا.",
    whatIfSelectGoal: "اختر هدفًا",
    whatIfNoGoals: "أضف هدف ادخار لاستكشاف السيناريوهات.",
    whatIfMonthly: "إذا ادخرت هذا المبلغ شهريًا",
    whatIfRemaining: "المتبقي",
    whatIfMonths: "الأشهر المقدرة",
    whatIfMonthsValue: "{count} أشهر",
    whatIfReach: "حوالي",
    whatIfComplete: "تم بلوغ الهدف بالفعل",
    whatIfNeedRate: "أدخل مبلغًا شهريًا أكبر من صفر لرؤية تقدير.",
    whatIfVsPlan: "الخطة حتى الموعد تحتاج حوالي {amount}/شهر",
    whatIfEstimate: "تقدير — وليس ضمانًا.",
    whatIfBeats: "أسرع من خطة الموعد",
    whatIfBehind: "أبطأ من خطة الموعد",
    journeyTitle: "رحلة المال",
    journeyHint: "أشهر بنشاط حقيقي وتقدم أهدافك.",
    journeyEmpty: "سجّل المعاملات مع الوقت لرؤية الرحلة هنا.",
    journeyNoGoals: "لا توجد أهداف ادخار بعد.",
    journeyMonth: "الشهر",
    journeyIncome: "دخل",
    journeySpending: "صرف",
    journeyNet: "صافي",
    journeyGoals: "الأهداف",
    journeyStageEarly: "البداية",
    journeyStageBuilding: "بناء",
    journeyStageHalfway: "منتصف الطريق",
    journeyStageAlmost: "قاربنا",
    journeyStageReached: "تحقق",
  },
  ja: { ...en, whatIfTitle: "もしも？", journeyTitle: "マネーの軌跡", whatIfEstimate: "見込み — 保証ではありません。" },
  ko: { ...en, whatIfTitle: "만약?", journeyTitle: "머니 여정", whatIfEstimate: "추정치 — 보장이 아닙니다." },
  "zh-Hans": { ...en, whatIfTitle: "如果？", journeyTitle: "资金历程", whatIfEstimate: "估算 — 非保证。" },
};

export function resolveLifeCopy(language: string, key: Keys): string {
  const normalized =
    language === "zh" || language.startsWith("zh-")
      ? "zh-Hans"
      : language.split("-")[0];
  const bag =
    table[normalized as LifeLocale] ??
    table[language as LifeLocale] ??
    table.en;
  return bag[key] ?? table.en[key] ?? key;
}
