# Comores Market — Guide Développeur (référence interne)

> Document d'onboarding/maintenance. Dernière étude du code : 04/10/2026.
> Objectif : comprendre l'architecture, les flux métier et les conventions du projet
> pour intervenir efficacement (web Next.js + app Android WebView + backend Supabase).

---

## 1. Vue d'ensemble

**Comores Market** est la marketplace n°1 des Comores : achat/vente d'annonces
(véhicules, immobilier, mode, tech, etc.) avec :
- Comptes utilisateurs (email/mot de passe, Google OAuth, Magic link).
- Publication et modération IA d'annonces.
- Messagerie temps réel, favoris, notifications, recherches sauvegardées.
- Monétisation : **Boost** d'annonces et **abonnement PRO** vendeur (facture PDF).
- Assistant IA (chatbot « EliteAssistant ») + assistant de rédaction d'annonce.
- PWA installable **et** application Android native (WebView) qui embarque le site.

Le produit existe sous **deux formes** :
1. **Le site web / PWA** → `E:\Labo\Projets\comores-market` (ce repo, Next.js).
2. **L'app Android** → `G:\From Scratch` (projet Android Studio séparé, Kotlin, WebView).

---

## ⚠️ INCIDENT P0 — Modèles IA obsolètes (vérifié par appels API le 04/10/2026)

Tous les modèles Groq utilisés par le code **ne sont plus accessibles** sur le compte :

| Emplacement | Modèle codé | Statut réel (API live) |
|---|---|---|
| `api/chat`, `api/moderate`, `api/rephrase` | `llama-3.3-70b-versatile` | ❌ `model_not_found` |
| Edge `moderate`, Edge `rephrase` | `llama3-70b-8192` | ❌ `model_decommissioned` |
| `api/vision` | `meta-llama/llama-4-scout-17b-16e-instruct` | ❌ `model_not_found` |

Modèles **disponibles et validés** sur le compte :
- `openai/gpt-oss-120b` — texte + JSON OK (le plus performant) ✅
- `openai/gpt-oss-20b` — texte, plus rapide / moins cher
- `qwen/qwen3.8-27b` — multimodal (images) ✅

**Conséquences** : chatbot HS, « Description Prestige » HS, vision HS, et surtout
**modération silencieusement désactivée** (le `catch` renvoie `is_safe:true` → tout passe).

✅ **CORRIGÉ — et GRATUIT (04/10/2026)** : remplacement par `openai/gpt-oss-120b`
(texte) et `qwen/qwen3.8-27b` (vision), **inclus dans l'offre gratuite Groq**
(Free plan confirmé par les en-têtes API du compte : 30 req/min, 1 000 req/jour,
8 000 tokens/min). Fichiers modifiés : `api/chat`, `api/moderate`, `api/rephrase`,
`api/vision` ; les doublons Edge correspondants ont ensuite été supprimés (cf. §5.4).
✅ Validé par appels réels : texte (`gpt-oss-120b`), mode JSON modération
(`gpt-oss-120b`) et vision `image_url` (`qwen/qwen3.8-27b`) fonctionnent.
➡️ **Reste à faire** : redéployer — Edge Functions via `supabase functions deploy …`
et reconstruire/déployer le site pour que le correctif soit actif en production.

---

## 2. Stack technique

| Domaine | Technologie |
|---|---|
| Framework web | **Next.js 16** (App Router, RSC) + **React 19** |
| Langage | **TypeScript 5** (strict) |
| Styles | **Tailwind CSS v4** + CSS custom (`@theme`, `@utility`) |
| Backend / DB / Auth / Storage | **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) |
| IA | **Groq SDK** (`openai/gpt-oss-120b` texte, `qwen/qwen3.8-27b` vision) |
| Emails | **Resend** |
| État/cache client | **@tanstack/react-query** + hooks locaux |
| UI | **lucide-react** (icônes), **framer-motion** (animations), **sonner** (toasts) |
| Drag & drop | **@dnd-kit** (tri des photos d'annonce) |
| PDF | **jspdf** (factures PRO) ; **html2canvas** dispo |
| Images | **browser-image-compression** (WebP côté client) |
| PWA | **next-pwa** (service worker workbox) |
| Tests E2E | **Playwright** (`/tests`) + CI GitHub Actions |
| Déploiement | Vercel/Netlify (env vars) — domaine `www.comores-market.com` |
| Monitoring | **Sentry** (MCP configuré dans `.mcp.json`) |

**Scripts npm** (`package.json`) : `dev` (`next dev --webpack`), `build`, `start`, `lint`.
> ⚠️ Le bundler utilisé est **Webpack** (pas Turbopack) — d'où les flags `--webpack`.

---

## 3. Arborescence (repo web)

```
comores-market/
├── src/
│   ├── app/                     # App Router (pages + API routes)
│   │   ├── page.tsx             # Accueil SSR (classement personnalisé)
│   │   ├── HomePageClient.tsx   # Accueil client (filtres, catégories, catégories)
│   │   ├── layout.tsx           # Layout racine (providers, GA, nav, splash)
│   │   ├── globals.css          # Design tokens + UX native (sélection/drag)
│   │   ├── manifest.ts          # Manifest PWA
│   │   ├── robots.ts, sitemap.ts, not-found.tsx, offline/
│   │   ├── annonce/[id]/        # Détail d'annonce `/annonce/<uuid>` (SSR + SEO + JSON-LD) ; `annonce/page.tsx` = filet de sécurité de l'ancien format
│   │   ├── publier/             # Création d'annonce (formulaire riche + IA)
│   │   ├── modifier/            # Édition d'annonce
│   │   ├── auth/                # Connexion/inscription + callback OAuth
│   │   ├── compte/              # Dashboard (profil, PRO, notifications)
│   │   ├── mes-annonces/        # Annonces de l'utilisateur (+/vues)
│   │   ├── messages/, favoris/, profil/, recherche/
│   │   ├── boost/, pro/         # Monétisation
│   │   ├── admin/               # Back-office
│   │   ├── api/                 # Routes serveur (voir §6)
│   │   └── actions/             # Server Actions (contact, email)
│   ├── components/              # Composants partagés (BottomNav, EliteAssistant…)
│   ├── lib/                     # Logique métier (ranking, personalization, analytics…)
│   ├── utils/                   # Utilitaires (supabase, images, prix, PDF…)
│   └── middleware.ts            # Canonicalisation + protection des routes
├── supabase/                    # Edge Functions + migrations SQL (+ CLI local)
├── public/                      # Assets statiques + service worker généré
├── tests/                       # Tests Playwright
├── android/                     # ⚠️ Résidu (voir §12) : .idea + keystore
└── *.md                         # Rapports (FINAL_REPORT, QA_REPORT, etc.)
```

> Note : `src/hooks/` existe mais est **vide** (nettoyé récemment). Les hooks de
> données sont aujourd'hui gérés directement dans les composants / via `lib/`.

---

## 4. Variables d'environnement

Fichier `.env.local` (non versionné — `.gitignore` ignore `.env*`).

| Variable | Usage | Requis |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serveur uniquement.** Purge du Storage à la suppression de compte. Jamais `NEXT_PUBLIC_` | optionnel |
| `GROQ_API_KEY` | IA (chat, modération, rephrase, vision) | ✅ (fallback safe) |
| `RESEND_API_KEY` | Emails admin (nouvel inscrit) | ✅ |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 | optionnel |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Conversion Google Ads | optionnel |
| `SENTRY_AUTH_TOKEN` | Monitoring Sentry | optionnel |
| `NETLIFY_EMAILS_*` | Emails Netlify | optionnel |

⚠️ **Sécurité** : les clés `GROQ_API_KEY`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN`
sont des secrets. Si elles ont pu fuiter (partage de fichier, capture, commit),
**les révoquer/régénérer**. En production, elles doivent être définies côté hébergeur
(Vercel/Netlify) et jamais committées.

✅ **Google Analytics harmonisé le 04/10/2026** : `layout.tsx` et `analytics.ts` lisent
désormais `NEXT_PUBLIC_GA_ID` (= `G-MRDLKB8904`, l'ID qui mesurait réellement les
données) et `NEXT_PUBLIC_GOOGLE_ADS_ID` (= `AW-16447515729`) — plus aucune valeur en
dur. Le composant `GoogleAnalytics.tsx` (jamais importé) a été supprimé, ainsi qu'un
label de conversion placeholder `VOTRE_LABEL_ICI` dans `PublierClient.tsx`.
⚠️ **Netlify doit bien utiliser `G-MRDLKB8904`** (sinon les données partent ailleurs).

---

## 5. Backend Supabase (schéma, RPC, storage, fonctions)

### 5.1 Tables principales (déduites du code)
- `products` : annonces (title, price, images, description, location_island/_city,
  category_id, sub_category, user_id, whatsapp_number, is_pro, boosted_until, created_at).
- `products_with_details` : **vue** enrichie (classement accueil).
- `profiles` : profil (full_name, avatar_url, is_pro, subscription_end_date,
  phone_number, city, island, facebook_url, instagram_url, description).
- `favorites`, `messages`, `notifications`, `product_views`,
  `search_history`, `product_click_history`, `reports` (déduits de l'usage).

### 5.2 Fonctions RPC (SQL, `security definer`)
- `log_search_history(p_query, p_category_id, p_island, p_results_count, p_visitor_id)`
- `log_product_click(p_product_id, p_source, p_visitor_id)`
- `get_personalization_snapshot(p_visitor_id)` → JSONB (recherches, clics, vues,
  favoris, catégories/sous-catégories/îles préférées, prix moyen).

Migration de référence : `supabase/migrations/20260308_add_personalization_history.sql`
(extension `pgcrypto`, RLS activé, index, grants `anon`/`authenticated`).

### 5.3 Storage (buckets)
- `avatars` (avatars ; aussi `{userId}.jpg|png|webp`)
- `products` (photos d'annonces, dossier par `userId`)
- `messages_images` (images du chat)

### 5.4 Edge Functions : **AUCUNE** (le dossier `supabase/functions/` a été supprimé)

Le projet n'utilise **plus aucune Edge Function**. Tout est passé par les **routes Next.js** :

| Ancien Edge Function | Remplacé par |
|---|---|
| `chat` | `/api/chat` (via `chatWithAI`) |
| `moderate` | `/api/moderate` |
| `rephrase` | `/api/rephrase` |
| `send-email` | `/api/emails/alert-signup` (via `sendAdminAlert`) |
| `delete-user-data` | `/api/account/delete` (purge Storage + suppression du compte) |

> ✅ **Unifié le 04/10/2026** : une seule source de vérité, donc plus aucune divergence
> possible entre le front et le backend. Raison : ces Edge Functions étaient des
> **doublons** des routes API, et cette duplication avait causé une panne invisible
> (modèles Groq retirés → modération silencieusement désactivée).

### 5.5 ⚠️ Leçon retenue : le code déployé ≠ le code du repo

Le 04/10/2026, l'audit a montré que les Edge Functions **déployées** ne correspondaient
pas au code du repo : `delete-user-data` renvoyait `"Hello undefined!"` (placeholder),
`send-email` n'avait aucune validation, et le webhook censé les déclencher était en
erreur (schéma `supabase_functions` manquant).

**Règles à appliquer :**
1. Après toute modif serveur (modèle IA, email…), **vérifier l'endpoint réel déployé**,
   pas seulement le code local ni le build.
2. Supprimer systématiquement tout ce qui n'est plus appelé (code + déploiement).
3. Ne jamais dupliquer une même logique entre une Edge Function et une route API.

---

## 6. Routes API (`src/app/api/`)

| Route | Méthode | Description | Auth |
|---|---|---|---|
| `/api/chat` | POST | Chatbot IA (Groq) + contexte produits Supabase (message <= 1000 car., historique 10 msg) | non, 20 req/10 min/IP |
| `/api/moderate` | POST | Modération IA d'une annonce (JSON) | ✅ JWT |
| `/api/rephrase` | POST | Réécriture de description (<= 5000 car.) | ✅ JWT + 15 req/10 min |
| `/api/vision` | POST | Description d'image (`qwen/qwen3.8-27b`, `imageBase64` data-URL <= ~4 Mo) | ✅ JWT + 10 req/10 min |
| `/api/home-products` | GET | Liste classée/paginée pour l'accueil (`limit` <= 40, `offset` <= 400) | non |
| `/api/personalization/track` | POST | Persiste recherche (`search`) ou clic (`product_click`) | non (visitor_id) |
| `/api/emails/alert-signup` | POST | Email admin « nouvel inscrit » (Resend) | non |
| `/api/account/delete` | POST | Suppression du compte : purge Storage (service role) puis RPC `delete_own_account` | ✅ JWT |

> La route `/api/account/delete` dérive **toujours** l'identifiant de l'utilisateur depuis
> la session (aucun `userId` n'est accepté du client) et utilise la **service role** pour
> contourner le RLS sur le Storage. Une purge en échec n'empêche pas la suppression du compte
> (renvoyé dans `purgeWarning`). Besoin de `SUPABASE_SERVICE_ROLE_KEY`.

Server Actions : `src/app/actions/contact.ts`, `src/app/actions/email.ts`.

---

## 7. Authentification & deep links

- Client : `src/utils/supabase/client.ts` (browser, **client mis en cache**).
- Serveur : `src/utils/supabase/server.ts` (`cookies()`), `static.ts` (SSR public sans cookies).
- `middleware.ts` :
  - Redirige vers `https://www.comores-market.com` (host canonique) en prod.
  - Rafraîchit la session Supabase (cookies).
  - Protège : `/compte`, `/messages`, `/publier`, `/favoris`, `/mes-annonces`, `/admin`.
  - Redirige les connectés hors de `/auth` (sauf `/auth/callback`).
- `/auth/callback` gère 2 cas : `verifyOtp` (token_hash, reset password) et
  `exchangeCodeForSession` (code, OAuth/Magic link).
- **Deep links Android** : schéma `comoresmarket://` et `https://comores-market.com/auth/callback`.
  L'app WebView réécrit `redirect_to` → `comoresmarket://auth-callback` et l'intercepte.

---

## 8. Flux métier clés

### 8.1 Classement de l'accueil — `lib/homepage-ranking.ts`
`getRankedHomepageProducts(filters, visitorId)` :
1. Agrège 3 pools : annonces **boostées**, **PRO** (`PRO_POOL_LIMIT=60`),
   **récentes** (`RECENT_POOL_LIMIT=80`).
2. Récupère un `get_personalization_snapshot` et calcule un **score d'intérêt**.
3. Tri final : **Boost** > **score d'intérêt** > **PRO** > **récence**.
4. Pagination (`limit`/`offset`) → `{ products, hasMore, total }`.

Pondérations : sous-catégorie ×24, catégorie ×18, terme recherché +16,
proximité prix +16/8, île ×12, fraîcheur +8/4 ; pénalités si déjà favori (−35),
cliqué (−18), vu (−12).

### 8.2 Personnalisation — `lib/personalization.ts`
- `visitorId` anonyme en `localStorage` (`cm_visitor_id`).
- `trackSearchHistory` / `trackProductClickHistory` → POST `/api/personalization/track`.
- Snapshot reconstruit côté SQL (`search_history`, `product_click_history`,
  `product_views`, `favorites`).

### 8.3 Publication d'annonce — `app/publier/PublierClient.tsx`
- Limites : **3 annonces gratuites**, **3 photos** (gratuit) / **10** (PRO).
- Champs spécifiques par sous-catégorie (`SPECIFIC_FIELDS`) avec icônes Lucide.
- Photos : compression WebP (`utils/compressImage.ts`), ré-ordonnancement **drag&drop**
  (`@dnd-kit`), upload Storage bucket `products`.
- Anti-contournement : `utils/contentSafety.ts` (`containsContactInfo`) bloque
  téléphones/liens pour les non-PRO.
- IA : « Description Prestige » via `rephraseText` + `moderateContent`.
- Tracking : `trackListingCreated`, `trackAdsConversion`.

### 8.4 Détail d'annonce — `app/annonce/`
- URL : `/annonce/<uuid>`. L'ancien format `/annonce?id=<uuid>` est redirigé en 308 par `middleware.ts` (les autres paramètres, ex. `utm_*`, sont conservés). Les liens internes, le sitemap et les liens déjà partagés / stockés en base (`notifications.link`) restent valides.
- SSR + `generateMetadata` (SEO/OpenGraph, prix KMF + équivalent €, `canonical`) + JSON-LD `Product`. L'annonce lue côté serveur est passée au client (`initialProduct`) : affichage immédiat, sans spinner ni second aller-retour.
- Annonce inexistante / identifiant invalide : page 404 avec `noindex` (le statut HTTP reste 200 tant que le `Suspense` du layout enveloppe les pages ; erreur de lecture Supabase : repli sur le chargement client).
- Galerie plein écran + zoom (`react-zoom-pan-pinch`), carrousel, badges PRO/VEDETTE.
- CTA WhatsApp, favoris, message vendeur, signalement.
- Analytics + historique de clic (`trackProductView`, `trackProductClickHistory`).

### 8.5 Compte & PRO — `app/compte/page.tsx`
- Édition profil, avatar (Storage `avatars`), mot de passe, suppression de compte.
- Statut PRO + jours restants, facture PDF (`utils/generateReceipt.ts`).

### 8.6 Monétisation
- **Boost** (`app/boost/`) : mise en avant temporaire (`boosted_until`).
- **PRO** (`app/pro/`) : abonnement mensuel 2 500 KMF / annuel 25 000 KMF
  (badge, visibilité, 10 photos, WhatsApp direct, stats).

### 8.7 Assistant IA — `components/EliteAssistant.tsx`
- Bouton flottant draggable + panneau chat, format historique Gemini (`parts`).
- Injecte un **contexte de page** dans le message ; appelle `chatWithAI` → route `/api/chat`.

---

## 9. Application Android (WebView) — `G:\From Scratch`

Projet **Android Studio séparé** (Kotlin, Gradle KTS) affichant le site dans une WebView.
- `applicationId` : `com.comoresmarket.app` · `versionName` 1.2.5 (code 18).
- `minSdk` 24, `targetSdk` 36, NDK `abiFilters` (armeabi-v7a, arm64-v8a, x86, x86_64).
- Release : `isMinifyEnabled` + `isShrinkResources`.
- Dépendances : `appcompat`, `constraintlayout`, `core-ktx`, `material`,
  `swiperefreshlayout`, `core-splashscreen`, `browser` (Chrome Custom Tabs).

### MainActivity.kt (points clés)
- `SplashScreen` natif (`Theme.App.Starting`) puis WebView.
- **SwipeRefresh** activé uniquement en haut de page.
- WebView : JS, LocalStorage, cache, `userAgentString += " ComoresMarketApp/1.0"`.
- **Cookies** persistés (`CookieManager.flush()` en `onPause`/`onStop`/`onPageFinished`)
  pour conserver la session Supabase.
- Upload de fichiers natif (`onShowFileChooser` + `ActivityResultContracts`).
- **Interception d'URL** (`shouldOverrideUrlLoading`) :
  - `comoresmarket://` → réécrit vers `https://comores-market.com/...`.
  - Google OAuth / Supabase auth → **Chrome Custom Tab** (`redirect_to` forcé
    vers `comoresmarket://auth-callback`).
  - `wa.me` / `api.whatsapp.com`, `whatsapp:`, `mailto:`, `tel:` → app native.
- **Deep links** (Manifest) : schéma `comoresmarket://` + App Links HTTPS (`autoVerify`)
  sur `/auth/callback`.
- Pont JS : `addJavascriptInterface(MedianBridge, "MedianBridge")` → `showToast()`.
- Bouton retour natif = `webView.goBack()` si possible.

> Changer le site ne nécessite **aucun rebuild Android** : l'app charge la version web.
> Rebuild uniquement si le comportement natif change ou pour publier sur le Play Store.

---

## 10. PWA, design, tests, CI/CD

### 10.1 PWA (`next.config.ts`, `next-pwa`)
- `dest: 'public'`, `register: true`, `skipWaiting: true`, désactivé en dev.
- Precache + fallback offline `/offline`.
- `runtimeCaching` **CacheFirst** sur images Supabase Storage
  (`supabase-images-cache`, 500 entrées, 30 jours).
- Headers sécurité : HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN`.
- Webpack : `splitChunks` (vendor/common/supabase/ui), `runtimeChunk: single`.

### 10.2 Design system (`globals.css`, Tailwind v4 sans `tailwind.config.ts`)
- Brand `#22c55e` / `#16a34a`, mustache `#fbbf24`, fond app `#F8FAFC`,
  fond extérieur `#374151`/`#1f2021`.
- Container mobile `max-w-120` (500 px) centré ; safe areas (`pb-safe`, `pt-safe`).
- Tailwind v4 : `@theme`, `@utility`.
- UX native : sélection/drag désactivés (`*:not(input,textarea)`), `img` en
  `pointer-events:none`, `user-select:text` forcé sur inputs ; `NativeFeatures.tsx`
  bloque le menu contextuel.
- Tokens « calque 0 » dans `@theme` : `brand-50..900`, `ink`, `surface`, `line`, `--radius-card`, `--shadow-card/pop`, durées ; police `font-display` (Plus Jakarta Sans via `next/font`).
- Bibliothèque `components/ui` : `UiButton`, `UiInput`, `UiChip`, `UiSectionTitle` (migration progressive des pages ; `HomePageClient` l'utilise déjà).
- Composants : `PriceTag`, `Skeleton`, `EmptyState`, `FilterModal`, `NotificationBell`,
  `BottomNav`, `SplashScreen`, `CookieBanner`, `ProductSuggestions`.
- `InstallBanner.tsx` **désactivé** (retourne `null`).

### 10.3 Tests & CI
- Playwright : `tests/navigation.spec.ts`, `tests/example.spec.ts`
  (baseURL `localhost:3000`, `webServer: npm run start`). Browsers chromium/firefox/webkit.
- CI : `.github/workflows/playwright.yml`.
- Rapports historiques : `FINAL_REPORT.md`, `QA_REPORT.md`, `OPTIMIZATION_REPORT.md`,
  `DESIGN_AUDIT.md`, `ANALYTICS_SETUP.md`.

### 10.4 Déploiement
- Vercel/Netlify + Supabase (DB/Storage/Edge) + domaine `www.comores-market.com`
  (redirect 308 depuis domaine nu via middleware).
- Variables d'env côté hébergeur (cf. §4).

---

## 11. Conventions & commandes

### Conventions de code
- Alias d'import `@/*` → `./src/*`.
- Composants interactifs = `'use client'` ; logique serveur = `lib/*` (`import 'server-only'`).
- Texte/UI en **français**, commentaires en français.
- Toasts via `sonner` (helpers `lib/toast.ts`).
- Analytics via `lib/analytics.ts` (GA4 `gtag`). Icônes via `lucide-react`.

### Commandes utiles
```powershell
# ⚠️ PowerShell bloque npm.ps1 (ExecutionPolicy) -> utiliser npm.cmd
npm.cmd run dev      # serveur dev (webpack) sur http://localhost:3000
npm.cmd run build    # build de production
npm.cmd run start    # serveur prod (requis par Playwright)
npm.cmd run lint     # ESLint (next lint)
npx.cmd playwright test   # tests E2E
```
> Node installé : **v24.12.0**. `npm.ps1` est refusé par la stratégie d'exécution ;
> toujours préfixer par `npm.cmd` / `npx.cmd` sous PowerShell.

---

## 12. Points d'attention / TODO (relevés lors de l'étude)

1. **Secrets** : `GROQ_API_KEY`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN` en clair dans
   `.env.local` (non versionné). À **régénérer** s'ils ont été partagés/exposés.
2. **Dossier `android/` résiduel** dans le repo web : seulement `.idea/` et
   `app/comores-release.keystore` (clé de signature). Le vrai projet est `G:\From Scratch`.
   → À supprimer du repo (keystore déjà ignoré par `*.keystore`).
3. ✅ **GA harmonisé** : les IDs sont lus via `NEXT_PUBLIC_GA_ID` /
   `NEXT_PUBLIC_GOOGLE_ADS_ID` (valeurs `G-MRDLKB8904` / `AW-16447515729`).
   Vérifier que **Netlify** n'a pas `G-4BK10CRPPP` (sinon les données partent
   dans un property vide).
4. ✅ **Modèles IA** migrés et Edge Functions supprimées (voir l'encadré en haut). La modération reste *fail-open* (erreur Groq = annonce acceptée).
5. Résidu : `src/hooks/` vide.
6. ✅ `images.remotePatterns` restreint à `**.supabase.co`, `lh3.googleusercontent.com` et `www.comores-market.com` : toute nouvelle source d'image doit être ajoutée dans `next.config.ts`.
7. Les RLS Supabase ne sont pas dans le repo (une seule migration) : l'accès admin est contrôlé côté serveur (`admin/page.tsx`) mais l'écriture de `profiles.role` dépend uniquement des RLS — à vérifier dans le dashboard.

---

## 13. Repères rapides

- Accueil : `src/app/page.tsx` → `HomePageClient.tsx`
- Classement : `src/lib/homepage-ranking.ts`
- Auth : `src/app/auth/page.tsx` + `src/app/auth/callback/route.ts` + `src/middleware.ts`
- Publish : `src/app/publier/PublierClient.tsx`
- Détail annonce : `src/app/annonce/[id]/page.tsx` (serveur) + `src/app/annonce/AnnonceClient.tsx` (client)
- API IA : `src/app/api/{chat,moderate,rephrase,vision}/route.ts`
- IA + emails : `src/app/api/{chat,moderate,rephrase,vision,emails/alert-signup}/route.ts` (aucune Edge Function)
- App Android : `G:\From Scratch\app\src\main\java\com\comoresmarket\app\MainActivity.kt`

---

## 14. Performance (audit du 07/10/2026)

- **Bundle JS** : le `splitChunks` personnalisé qui forçait un `vendor` unique (~1,8 Mo) sur toutes les pages a été retiré ; Next découpe par route. Ne pas le réintroduire.
- **Chargement à la demande** : `jspdf` (import dynamique dans `generatePROReceipt`, désormais `async`), `EliteAssistant` / `CookieBanner` / `NativeFeatures` (`components/DeferredWidgets.tsx`, `ssr:false`).
- **Splash** : CSS pur (sans framer-motion), 1 seule fois par session (`sessionStorage`), ~1,2 s au lieu de 2,5 s à chaque visite.
- **Middleware** : aucun appel `auth.getUser()` si aucun cookie `sb-*-auth-token` (visiteurs anonymes = pas de requête réseau).
- **Accueil** : le rafraîchissement personnalisé du premier rendu est immédiat et silencieux (plus de skeleton ni de délai de 400 ms) ; l'écouteur de scroll n'écrit plus de state à chaque évènement.
- **Annonce** : une seule requête Supabase par rendu (`cache()` partagé entre `generateMetadata` et la page).
- **Images** : AVIF + WebP, cache optimiseur 30 jours, `icon0.svg` (1,8 Mo, servi comme favicon) supprimé, `placeholder.webp` au lieu de `.png`.
- **Rate limiting** : `lib/rate-limit.ts` (fenêtre glissante en mémoire, best effort par instance).
- **Android** : démarrage direct sur `www` (plus de redirection 308), liens externes ouverts hors WebView, trafic HTTP en clair interdit, `allowFileAccess` / `allowContentAccess` désactivés, App Link `www` ajouté. Nécessite un nouveau build / `versionCode` pour être publié.
- **Build local Windows** : si `next build` échoue en `EPERM` sur `.next\diagnostics`, un processus verrouille le dossier : le renommer (`.next_old`) puis relancer.
- **Mesures Lighthouse mobile (build prod local, 07/10/2026)** : accueil perf 47 → 71 (FCP 3,9 → 1,6 s, LCP 8,2 → 4,7 s), accessibilité 89 → 94, bonnes pratiques 100. Relancer : `npx lighthouse http://localhost:3000 --form-factor=mobile` sur `next start`. Pistes restantes : TBT (~370 ms, hydratation + router Next), LCP (délai de rendu ~0,8 s).
- **Bug corrigé** : `ProductSuggestions` interrogeait `products` avec `is_pro` (colonne inexistante → HTTP 400 silencieux) ; la section « Pour vous » et les suggestions d'annonce ne s'affichaient jamais. Elle lit maintenant `products_with_details`. Colonnes réelles de `products` : id, user_id, category_id, title, description, price, images, location_island, location_city, whatsapp_number, status, created_at, fts, sub_category, boosted_until, quality_score.
- **Scripts tiers** : gtag en `lazyOnload` (hors chemin critique) ; le splash ne précharge plus son logo ; seules les 2 premières images de l'accueil sont `priority`.
- **Accessibilité** : contrastes des prix / libellés (`brand-700`, `gray-500`) et noms accessibles des boutons de l'assistant IA. Reste volontairement le jaune « Market » du logo sur fond vert.
- **URLs d'annonce** : `/annonce/[id]` (voir §8.4). Le sitemap listait 0 annonce (colonne `updated_at` inexistante dans `products` → requête en erreur silencieuse) : corrigé avec `created_at`. Attention : `products` n'a pas de `updated_at`.
- **JS de démarrage (07-08/10/2026)** : JS de l'accueil 734 → ~516 Ko. Règles à respecter :
  - **Supabase navigateur à la demande** : `utils/supabase/lazy.ts` (`hasSessionCookie()`, `getSupabase()`). `BottomNav` et l'accueil n'importent plus `utils/supabase/client` statiquement ; un visiteur sans cookie `sb-*-auth-token` ne charge pas la librairie (~170 Ko). Sur toute nouvelle page *publique*, préférer `getSupabase()` ou un `fetch` REST à un import statique.
  - `ProductSuggestions` lit `products_with_details` via `fetch` REST (clé anon), sans supabase-js.
  - **Toasts** : `sonner` est importé dynamiquement dans `BottomNav` / accueil ; `<Toaster>` via `DeferredToaster`.
  - **Assistant IA** : monté à la première interaction (scroll / toucher / clic / clavier) ou après 5 s (`useDeferredMount` dans `DeferredWidgets.tsx`) : framer-motion + react-markdown (~220 Ko) ne concurrencent plus l'affichage.
  - **Prefetch** : les liens menant à `/auth` (barre du bas, avatar de l'accueil) ont `prefetch={false}` pour un visiteur anonyme (la page `/auth` embarque Supabase).
  - **Accueil** : un nouveau visiteur (aucun `cm_visitor_id` en localStorage) ne refait pas de requête de personnalisation au montage (la liste SSR est déjà la bonne) ; `isReturningVisitor()` / `hasSessionCookie()` la déclenchent sinon. Halos de l'en-tête en dégradés radiaux (plus de `blur-3xl`).
  - **Analyse du bundle** : `ANALYZE=1 npm run build` active les source maps navigateur, puis `npx source-map-explorer .next/static/chunks/<chunk>.js --no-border-checks`. Ne pas déployer ce build.
  - **Lighthouse** : le score *simulé* (4G lente + CPU x4) varie de ±3 points ; mesurer à cache chaud (1 passe de chauffe pour l'optimiseur d'images AVIF), 3 passes, médiane. Le reste du temps est dominé par React + routeur Next (~385 Ko incompressibles).
- **Refonte graphique — calque 3 (08/10/2026)** :
  - **Annonce** : barre de contact collante au-dessus de `BottomNav` (`bottom-[calc(4rem+env(safe-area-inset-bottom))]`, `z-40`) : prix + « WhatsApp » (vendeur PRO avec numéro) ou « Écrire au vendeur » (fait défiler jusqu'au formulaire `#contact-form` et le focalise). Contrastes corrigés (`gray-300` → `gray-500`, prix en `brand-700`), rayons ramenés à l'échelle `rounded-3xl` / `rounded-4xl`, adresse sans virgule orpheline, description affichée sans guillemets parasites (masquée si vide).
  - **Recherche** : état initial utile (recherches récentes en `localStorage` `cm_recent_searches` via `useSyncExternalStore` + recherches populaires), résultats avec `PriceTag`, état « aucun résultat » (`EmptyState`), réponses obsolètes écartées, `supabase-js` chargé à la demande.
  - **Focus global** : la règle `:focus-visible` de `globals.css` est maintenant dans `@layer base` (une règle hors layer écrasait `outline-none` / `ring-*` de Tailwind v4 et forçait `border-radius: 4px` : double anneau et coins carrés au focus des champs arrondis).
  - **Convention boutons** : avec `UiButton`, surcharger une propriété déjà définie par la variante demande le modificateur `!` de Tailwind v4 (ex. `px-4!`), l'ordre des classes ne décide pas.
  - **Devise (décision 08/10/2026)** : l'interface affiche **« FC »** partout (cartes, annonce, profil, admin, formulaires, Boost/Pro, facture PDF, messages WhatsApp). Le code ISO « KMF » est conservé uniquement dans les données structurées (JSON-LD `priceCurrency`) et le titre SEO de `annonce/[id]`.
- **Refonte graphique — calque 4 (08/10/2026), pages connectées** :
  - **Bibliothèque `components/ui`** enrichie : `UiInput` (`startAdornment` / `endAdornment` / `wrapperClassName`, libellé relié par `htmlFor`), `UiSelect` (liste native + chevron), `UiTextarea`, `uiButtonClasses()` (habiller un `<Link>` comme un bouton), styles partagés dans `fieldStyles.ts`. Champs en `text-base` (16 px) : plus de zoom automatique d'iOS au focus.
  - **Migrées** : `publier` et `modifier` (formulaire complet), `compte` (profil, mot de passe, modale de suppression ; valeurs en lecture via `ReadField`), `messages` (recherche, état vide, conversations accessibles au clavier, saisie), `mes-annonces` (boutons de la modale), `recherche`.
  - **`components/ProductCard.tsx`** : carte d'annonce unique (accueil + favoris). Props : `product`, `isPro`, `isBoosted`, `index` (priorité d'image), `onClick`, `overlay`. Ne plus dupliquer de carte dans les pages.
  - **Bug global corrigé** : Tailwind v4 donne à `border` sans couleur la valeur `currentColor` (bordures noires, visibles sur `publier`). `globals.css` fixe désormais `border-color: var(--color-line)` dans `@layer base`.
  - **Lisibilité** : micro-textes `text-[8px]` / `[9px]` relevés à 10-11 px, `text-gray-300/400` → `gray-500` sur les textes porteurs d'information.
  - **Piège PowerShell** : dans un script PowerShell, `` à l'intérieur d'une chaîne entre guillemets doubles est évalué (et disparaît). Écrire le code TS via `create` ou une here-string entre apostrophes (`@'...'@`).
  - **Compte de test** : un compte de test existe sur la base de production ; ne tester sur cette base que par consultation (aucune publication / suppression / envoi de message), et ne jamais committer ses identifiants.