# 💰 Montra

<p align="center">
  <strong>Privat konto- & kjøpslogg</strong> · web + iOS/Android<br/>
  Spor inn/ut · kvitteringer · wishlist · sparemål — data isolert per bruker
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Production-Complete-6b7280?style=for-the-badge" alt="Production complete" />
  <img src="https://img.shields.io/badge/Status-Private%20%2F%20Proprietary-4b5563?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%2B%20Supabase-367c9b?style=for-the-badge" alt="Stack" />
</p>

> **📦 Production complete** — Montra er offisielt ferdigstilt som produkt. Aktiv produksjonsutvikling er avsluttet. Repoet bevares som privat referanse og arkiv. Eventuell videre bruk er på eget ansvar.

---

## ✨ Hva Montra gjør

| 🎯 | Område | Kort |
|----|--------|------|
| 💸 | **Transaksjoner** | Inn & ut med beløp, dato, metode, notat, bilde |
| 🧾 | **Kvitteringer** | Foto + valgfri OCR (Tesseract) |
| 🎁 | **Wishlist** | Ting du vil ha — pris, lenke, bilde, kobling til sparemål |
| 🐷 | **Sparemål** | Sett target, følg progresjon |
| 📊 | **Analytics** | Trender & kategorier *(Montra Plus)* |
| 🌍 | **i18n + valuta** | Språk lokalt, preferert visningsvaluta |
| ✨ | **Ikon-motion** | Subtile Lucide-animasjoner (hover, active, open, success) |

> 🔒 All brukerdata er isolert per konto. Bilder ligger privat i Storage og ryddes automatisk ved slett/erstat.

---

## ✨ Icon motion

Alle Lucide-ikoner har lett, konsistent motion i `src/styles/icon-motion.css`:

| Interaksjon | Atferd |
|-------------|--------|
| Nav | Løft + scale; aktiv state med soft glow |
| Plus / legg til | 90° rotasjon på hover |
| Knapper | Mild translate/scale |
| Chevron | Roterer ved `aria-expanded` / `.is-open` |
| Loader | Jevn spin |
| Check | Pop-in entrance |
| Trash, search, share, gift, … | Små kontekstuelle hints |

Respekterer `prefers-reduced-motion`. Ingen ekstra JS-avhengigheter.

---

## 🚀 Quick start (arkiv / lokal)

```bash
npm install
cp .env.example .env   # sett VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

| Kommando | Hva |
|----------|-----|
| `npm run dev` | Utviklingsserver |
| `npm run build` | Typecheck + produksjonsbuild |
| `npm test` | Node-tester |
| `npm run preview` | Forhåndsvis build lokalt |

**Native (Capacitor):** `ios/` og `android/`. Native-bygg åpner app-shell på `/app`.

---

## 🧱 Tech stack

| Lag | Teknologi |
|-----|-----------|
| ⚛️ Frontend | React 19 · TypeScript · Vite |
| 🧭 Routing | React Router |
| 🎨 Ikoner | Lucide React + `icon-motion.css` |
| 🔐 Backend / Auth | Supabase (Auth, Postgres, Storage) |
| 👁️ OCR | Tesseract.js (client) |
| 💳 Plus (prep) | Stripe Checkout via Edge Function |
| ☁️ Deploy (historisk) | Vercel → montra.cash |

---

## 🏗️ Arkitektur

```
Browser (React SPA)
   ├─ Auth (Supabase · PKCE)
   ├─ Data services (tx, receipts, wishlist, goals)
   ├─ Signed image URLs
   └─ Plus entitlement
        ▼
Supabase
   ├─ Postgres (RLS per user_id)
   ├─ Storage (user-scoped buckets)
   └─ Edge Functions (Stripe Checkout, …)
```

- Client har **aldri** service-role / secret keys  
- Alle queries filtreres på `user_id`  
- Bilde-paths valideres til `{userId}/…`

---

## 📂 Prosjektstruktur

```
public/          # ikoner, manifest, service worker
src/
  components/    # UI
  hooks/         # auth, data, Plus
  lib/           # supabase, i18n, currency, …
  pages/         # routes
  services/      # Supabase data + Storage
  styles/        # globals, layout, icon-motion
supabase/
  functions/     # Edge Functions
  migrations/    # SQL
ios/ · android/  # Capacitor
```

---

## 🔑 Auth

- 🔵 Google OAuth  
- ✉️ E-post + passord  
- 🔗 Magic link / OTP (PKCE)

Se `AUTH_SETUP.md` for historiske redirect-URLer.

---

## 🗄️ Storage

| Bucket | Bruk | Path |
|--------|------|------|
| `purchase-images` | Kjøpsbilder | `{userId}/{uuid}.ext` |
| `receipts` | Kvitteringer | `{userId}/{uuid}.ext` |
| `wishlist` | Wishlist-bilder | `{userId}/{uuid}.ext` |

**Cleanup:** slett rad → slett objekt · bytt bilde → slett gammelt · feilet upload → rydd orphan.

---

## 🔐 Sikkerhet (kort)

| ✅ | Regel |
|----|--------|
| 🔑 | Kun publishable key i browser |
| 👤 | All data scoped til `user_id` + RLS |
| 🖼️ | Private buckets + signed URLs |
| 🛡️ | Security headers (XSS, frame, COOP, …) |

---

## 🌱 Environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Aldri commit ekte verdier.

---

## 💎 Montra Plus

Infrastruktur ble forberedt (Checkout Edge Function, `plus_entitlements`, feature gating).  
Live billing ble **ikke** aktivert før produksjon ble avsluttet. Se `STRIPE_INTEGRATION_TODO.md` for historikk.

---

## 🏁 Prosjektstatus

**Produksjon er offisielt ferdigstilt.**  
Ingen planlagt videre feature-utvikling, Stripe-lansering eller aktiv drift som produkt.  
Kodebasen beholdes privat som arkiv og personlig referanse.

---

## 📜 Lisens

**Privat / proprietary.** Alle rettigheter forbeholdt.  
Ikke distribuer, fork eller republiser uten eksplisitt tillatelse.

---

<p align="center">
  Made with 💚 · Montra · Production complete
</p>
