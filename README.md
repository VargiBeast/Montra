# 💰 Montra

<p align="center">
  <strong>Privat konto- & kjøpslogg</strong> · web + iOS/Android<br/>
  Spor inn/ut · kvitteringer · wishlist · sparemål — data isolert per bruker
</p>

<p align="center">
  <a href="https://montra.cash"><img src="https://img.shields.io/badge/Live-montra.cash-2d8f6f?style=for-the-badge" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Status-Private%20%2F%20Proprietary-6b7280?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Stack-React%2019%20%2B%20Supabase-367c9b?style=for-the-badge" alt="Stack" />
</p>

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

> 🔒 All brukerdata er isolert per konto. Bilder ligger privat i Storage og ryddes automatisk ved slett/erstat.

---

## 🚀 Quick start

```bash
npm install
cp .env.example .env   # sett VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev            # → lokal Vite-server
```

| Kommando | Hva |
|----------|-----|
| `npm run dev` | Utviklingsserver |
| `npm run build` | Typecheck + produksjonsbuild |
| `npm test` | Node-tester |
| `npm run preview` | Forhåndsvis build lokalt |

**Native (Capacitor):** iOS/Android-prosjektene ligger under `ios/` og `android/`. Native-bygg åpner app-shell på `/app`.

---

## 🧱 Tech stack

| Lag | Teknologi |
|-----|-----------|
| ⚛️ Frontend | React 19 · TypeScript · Vite |
| 🧭 Routing | React Router |
| 🎨 Ikoner | Lucide React |
| 🔐 Backend / Auth | Supabase (Auth, Postgres, Storage) |
| 👁️ OCR | Tesseract.js (client) |
| 💳 Plus (prep) | Stripe Checkout via Edge Function |
| ☁️ Deploy | Vercel → **montra.cash** |

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
- Bilde-paths valideres til `{userId}/…` (ingen path traversal)

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
  styles/        # globals + layout
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

Se `AUTH_SETUP.md` for redirect-URLer og e-postinnstillinger i Supabase Dashboard.

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
| 🖼️ | Private buckets + signed URLs (~1t) |
| 🛡️ | Vercel security headers (XSS, frame, COOP, …) |

---

## 🌱 Environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Aldri commit ekte verdier. Sett samme navn i Vercel for prod/preview.

---

## 💎 Montra Plus

Infrastruktur er på plass (Checkout Edge Function, `plus_entitlements`, feature gating).  
**Live billing er ikke aktivert i klienten ennå** — se `STRIPE_INTEGRATION_TODO.md`.

---

## 🗺️ Roadmap (realistisk)

- [ ] Fullføre Stripe Dashboard + live Checkout-verifisering  
- [ ] Mer test-dekning på kritiske flows  
- [ ] Valgfri bildekomprimering før upload  
- [ ] Fortsatt polish på insights / onboarding / Plus  

---

## 📜 Lisens

**Privat / proprietary.** Alle rettigheter forbeholdt.  
Ikke distribuer, fork eller republiser uten eksplisitt tillatelse.

---

<p align="center">
  Made with 💚 · <a href="https://montra.cash">montra.cash</a>
</p>
