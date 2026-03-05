# OC-Facturer - Documentation Technique

## Vue d'ensemble

**OC-Facturer** est une application interne Sewan de gestion de facturation des bons de commande (BDC). Elle fait le lien entre la base MySQL interne (OC-DB) et l'API GraphQL **Sophia** (ERP Sewan) pour orchestrer la saisie des articles de facturation dans les contrats Sophia.

| Propriete | Valeur |
|-----------|--------|
| Framework | Next.js 14 (App Router) |
| Runtime | Node.js 20 (Alpine Docker) |
| Base de donnees | MySQL (mysql2/promise, pool) |
| API externe | Sophia GraphQL (Keycloak OIDC) |
| Auth | JWT (access 1h + refresh 7d) + bcrypt |
| Frontend | React 18, styled-components 6, SWR 2 |
| Deploy | Docker + Traefik (reseau externe) |

---

## Architecture des couches

```
                    +---------------------+
                    |   Next.js Middleware |  <-- Bearer token check
                    +----------+----------+
                               |
              +----------------+----------------+
              |                                 |
     +--------v--------+            +----------v-----------+
     |   API Routes     |            |   Pages (SSR/CSR)    |
     |  /api/auth/*     |            |  /                   |
     |  /api/bdc/*      |            |  /validation-bdc     |
     |  /api/sophia/*   |            |  /a-facturer         |
     |  /api/resources/*|            +----------------------+
     |  /api/clients/*  |
     |  /api/health     |
     +--------+---------+
              |
     +--------v---------+
     |   Lib Layer       |
     |  auth/  db/       |
     |  sophia/ validation|
     +--------+----------+
              |
     +--------v----------+     +------------------+
     |   MySQL (OC-DB)   |     |  Sophia GraphQL  |
     |   Tables:         |     |  Keycloak auth   |
     |   bon_de_commande |     |  Organizations   |
     |   ressource_dpl   |     |  Contracts       |
     |   client, site    |     |  Articles        |
     |   utilisateur     |     |  Sites, Products |
     |   rate_limit      |     +------------------+
     +-------------------+
```

---

## API Routes

### Auth (`/api/auth/`)

| Route | Methode | Auth | Description |
|-------|---------|------|-------------|
| `/api/auth/login` | POST | Non | Login email/password, retourne JWT access+refresh. Rate-limited (5/15min). |
| `/api/auth/refresh` | POST | Non | Renouvelle access token via refresh token. |
| `/api/auth/me` | GET | Oui | Retourne le profil de l'utilisateur connecte. |
| `/api/auth/users` | GET | Admin | Liste tous les utilisateurs. |
| `/api/auth/users` | POST | Admin | Cree un nouvel utilisateur. |
| `/api/auth/users/[id]` | PATCH | Admin | Modifie un utilisateur (droits, actif, mot de passe). |
| `/api/auth/users/[id]` | DELETE | Admin | Supprime un utilisateur. |

### BDC (`/api/bdc/`)

| Route | Methode | Auth | Description |
|-------|---------|------|-------------|
| `/api/bdc` | GET | Oui | Liste les BDC (filtres: all, sans_contrat, plus_1mois, enregistre). Pagination + recherche. |
| `/api/bdc/[id]` | GET | Oui | Detail d'un BDC. |
| `/api/bdc/[id]` | PATCH | ADV | Met a jour un BDC (champs whitelistes: gdc_contractId, gdc_contractName, etc.). |
| `/api/bdc/[id]/resources` | GET | Oui | Liste les ressources (lignes DPL) d'un BDC. |
| `/api/bdc/[id]/ajout-gdc` | POST | ADV | Ajoute les articles dans le contrat Sophia (mutation GraphQL). |
| `/api/bdc/facturation` | GET | Oui | Liste des ressources a facturer (onglets CMES / Facturations Anticipees). Tri + filtre + pagination. |
| `/api/bdc/facturation/stats` | GET | Oui | Statistiques de facturation (totaux, top clients, progression mensuelle). |
| `/api/bdc/facturation/cancelled` | GET | Oui | Liste des IDs de BDC annules. |

### Sophia (`/api/sophia/`)

| Route | Methode | Auth | Description |
|-------|---------|------|-------------|
| `/api/sophia/contracts` | GET | Oui | Recherche de contrats dans Sophia. |
| `/api/sophia/organizations` | GET | Oui | Liste les organisations racine Sophia. |
| `/api/sophia/organizations/[id]/children` | GET | Oui | Organisations enfants. |
| `/api/sophia/sites` | GET | Oui | Recherche de sites Sophia. |
| `/api/sophia/sites/select` | POST | Oui | Selectionne un site (verification hierarchie). |
| `/api/sophia/sites/verify` | POST | Oui | Verifie qu'un site est dans un contrat. |
| `/api/sophia/articles` | GET | Oui | Liste les articles d'un contrat Sophia. |
| `/api/sophia/articles/[id]` | GET/PATCH/DELETE | ADV | CRUD article individuel. |
| `/api/sophia/articles/orphans` | GET | Oui | Articles orphelins (sans correspondance locale). |
| `/api/sophia/products/search/[code]` | GET | Oui | Recherche produit par code catalogue. |

### Autres

| Route | Methode | Auth | Description |
|-------|---------|------|-------------|
| `/api/clients/[dynamicsAccountId]` | GET | Oui | Info client par ID Dynamics. |
| `/api/resources/[id]` | PATCH | ADV | Met a jour une ressource DPL. |
| `/api/resources/[id]/hide` | POST | ADV | Masque/affiche une ressource. |
| `/api/health` | GET | Non | Health check (DB + Sophia). |

---

## Base de donnees (OC-DB MySQL)

### Tables principales

| Table | Description | Cle primaire |
|-------|-------------|--------------|
| `bon_de_commande` | Bons de commande avec infos client/commercial/contrat | `id_bon_de_commande` (UUID) |
| `ressource_dpl` | Lignes de ressources (produits deployes) liees aux BDC | `id_dpl` (UUID) |
| `client` | Table de correspondance Dynamics <-> Sophia | `id_client_dynamics` |
| `site` | Sites client (lien OC <-> Sophia) | `id_site` |
| `utilisateur` | Utilisateurs de l'app avec droits d'acces | `id_utilisateur` (UUID) |
| `duree` | Table de reference des durees d'engagement | `id_duree` |
| `rate_limit` | Table de rate limiting (auto-creee) | `rl_key` (VARCHAR) |
| `vue_bdc_annules` | Vue des BDC annules | `id_bon_origine` / `id_bon_annule` |

### Connexion

- Pool MySQL2 avec singleton global (`globalThis`)
- Charset `utf8mb4`, keep-alive active
- Variables d'env: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_CONNECTION_LIMIT`

---

## Integration Sophia (GraphQL)

### Client (`src/lib/sophia/client.ts`)

- Authentification Keycloak OIDC (grant_type: password)
- Realm: `foundation-eu-west-1-production`, client: `sophia-frontend`
- Token auto-renouvele 1 min avant expiration
- Retry automatique (1 retry) sur erreurs reseau/5xx/429
- Timeout: 30s
- Singleton global

### Queries GraphQL

| Query | Usage |
|-------|-------|
| `CONTRACTS_LIST` | Recherche/liste de contrats avec pagination |
| `SEARCH_PRODUCTS` | Recherche produits par code/nom |
| `GET_ORGANIZATIONS_CHILDREN` | Navigation arborescence organisations |
| `GET_ORGANIZATION` | Detail d'une organisation |
| `SEARCH_SITES` / `SEARCH_SITES_DETAILED` | Recherche de sites (simple/avec adresse) |
| `GET_SITE_FROM_LIVE` | Recuperation site depuis perId Live |
| `CHECK_SITE_IN_CONTRACT` | Verification site dans contrat |
| `GET_ARTICLE` / `LIST_ARTICLES` | Detail/liste d'articles de contrat |
| `GET_SITE_DETAIL` | Detail complet d'un site |

### Mutations GraphQL

| Mutation | Usage |
|----------|-------|
| `ADD_ARTICLE` | Ajout d'un article dans un contrat |
| `ADD_ARTICLES` | Ajout en lot d'articles |
| `UPDATE_ARTICLE` | Mise a jour d'un article |
| `DELETE_ARTICLES` | Suppression d'articles |

### Transformation metier

`transformProductCode()` : Normalise les codes produit (logique F/M -> M, dernier caractere apres "/").

---

## Authentification & Securite

### JWT

- **Access token** : HS256, expire 1h, contient `userId`, `email`, `nom`, `accesAdv`, `accesAdmin`
- **Refresh token** : HS256, expire 7d, contient `userId`
- Secrets distincts : `JWT_SECRET` / `JWT_REFRESH_SECRET`

### Middleware Next.js (`src/middleware.ts`)

- Intercepte toutes les routes `/api/*`
- Exempte : `/api/health`, `/api/auth/login`, `/api/auth/refresh`
- Verifie la presence du header `Authorization: Bearer <token>`
- La verification du token est faite dans chaque route via `requireAuth()`

### Roles

| Fonction | Droit requis |
|----------|-------------|
| `requireAuth()` | Tout utilisateur authentifie |
| `requireAdmin()` | `accesAdmin = true` |
| `requireAccesAdv()` | `accesAdv = true` |

### Rate Limiting

- Table MySQL `rate_limit` (auto-creee)
- 5 tentatives / 15 minutes par email (login)
- Reset apres login reussi

### Securite HTTP (next.config.js)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CORS configure pour `CORS_ORIGIN` (defaut: `https://dsc-portal.sewan.fr`)

### Validation des entrees (`src/lib/validation.ts`)

- `isValidEmail()` : Regex email
- `isValidUUID()` : Regex UUID (avec suffixe `-XXXX` optionnel)
- `validateId()` : Validation UUID avec reponse 400
- `safeJson()` : Parse JSON avec erreur 400
- `safePagination()` : page >= 1, pageSize entre 1 et 200
- `validatePassword()` : min 8 chars, majuscule, minuscule, chiffre

---

## Frontend

### Pages

| URL | Fichier | Description |
|-----|---------|-------------|
| `/` | `src/app/page.tsx` | Page d'accueil / dashboard |
| `/validation-bdc` | `src/app/validation-bdc/page.tsx` | Liste des BDC a valider (association contrat Sophia) |
| `/a-facturer` | `src/app/a-facturer/page.tsx` | Ecran de facturation (CMES + Facturations Anticipees) |

### Composants

**Layout** :
- `AppLayout` : Layout principal avec sidebar + topbar
- `Sidebar` : Navigation laterale
- `Topbar` : Barre superieure
- `SophiaTopBar` : Barre contextuelle Sophia

**BDC** :
- `BdcTable` : Table des bons de commande avec filtres/recherche
- `ContractPanel` : Panneau d'association contrat Sophia
- `ResourcesTable` : Table des ressources d'un BDC

**Facturation** :
- `FacturationTable` : Table principale de facturation (onglets CMES/Fac. Anticipees)
- `SiteSearchModal` : Modal de recherche de site Sophia

**Shared** :
- `Badge` : Badge de statut
- `DataTable` : Table de donnees generique
- `ErrorBoundary` : Gestion d'erreurs React
- `FilterDropdown` : Dropdown de filtres
- `InlineEdit` : Edition inline
- `Pagination` : Composant de pagination
- `SearchBar` : Barre de recherche
- `TabBar` : Barre d'onglets

**Providers** :
- `SWRProvider` : Configuration globale SWR

### Hooks

| Hook | Description |
|------|-------------|
| `useBdcList` | SWR hook pour la liste des BDC avec filtres/pagination |
| `useFacturation` | SWR hook pour les ressources de facturation |
| `useContractSearch` | Hook de recherche de contrats Sophia |
| `useDebounce` | Debounce generique |

### Theme

- `GlobalStyle` : Styles CSS globaux (styled-components)
- `StyledComponentsRegistry` : SSR registry pour styled-components avec Next.js

---

## Deploiement

### Docker

- **Build** : Multi-stage (builder + runner)
  - Stage 1 : `node:20-alpine`, `npm ci`, `npm run build`
  - Stage 2 : `node:20-alpine`, copie `.next` + deps prod, user `nextjs:nodejs`
- **Output** : `standalone` (optimise pour Docker)
- **Port** : 3000

### Docker Compose

- Service `oc-facturer` avec env_file `.env.prod`
- Health check : `wget http://127.0.0.1:3000/api/health` (30s interval)
- Reseau : `traefik-network` (externe, reverse-proxy Traefik)
- Restart policy : `unless-stopped`

---

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DB_HOST` | Oui | Hote MySQL |
| `DB_PORT` | Non | Port MySQL (defaut: 3306) |
| `DB_NAME` | Oui | Nom de la base (defaut: oc_db) |
| `DB_USER` | Oui | Utilisateur MySQL |
| `DB_PASSWORD` | Oui | Mot de passe MySQL |
| `DB_CONNECTION_LIMIT` | Non | Taille du pool (defaut: 10) |
| `SOPHIA_USERNAME` | Oui | Identifiant Sophia |
| `SOPHIA_PASSWORD` | Oui | Mot de passe Sophia |
| `SOPHIA_ORGANIZATION_ID` | Non | UUID orga Sewan (defaut fourni) |
| `SOPHIA_GRAPHQL_URL` | Non | URL GraphQL Sophia (defaut fourni) |
| `JWT_SECRET` | Oui | Secret HMAC pour access tokens |
| `JWT_REFRESH_SECRET` | Oui | Secret HMAC pour refresh tokens |
| `NODE_ENV` | Non | Environnement (production/development) |
| `CORS_ORIGIN` | Non | Origine CORS autorisee (defaut: dsc-portal.sewan.fr) |

---

## Flux metier principal

```
1. Commercial cree un BDC dans OC (autre app)
   → BDC arrive dans table bon_de_commande (statut 3 = valide)

2. ADV ouvre /validation-bdc
   → Voit les BDC sans contrat Sophia
   → Recherche/selectionne un contrat Sophia
   → Associe le contrat au BDC (PATCH /api/bdc/[id])

3. ADV ouvre /a-facturer
   → Voit les ressources avec date CMES ou facturation anticipee
   → Pour chaque ressource, peut :
     a. Rechercher le produit Sophia correspondant
     b. Selectionner le site Sophia
     c. Ajouter l'article dans le contrat Sophia (mutation ADD_ARTICLE)
     d. Le statut passe a INPROGRESS puis ACTIVATED
     e. Masquer les lignes non pertinentes (hide)

4. L'ecran stats montre la progression de facturation
```

---

## Arborescence du projet

```
src/
├── app/
│   ├── layout.tsx              # Layout racine
│   ├── page.tsx                # Dashboard
│   ├── a-facturer/page.tsx     # Page facturation
│   ├── validation-bdc/page.tsx # Page validation BDC
│   └── api/
│       ├── auth/               # Login, refresh, users CRUD
│       ├── bdc/                # BDC list, detail, update, facturation
│       ├── clients/            # Client lookup
│       ├── health/             # Health check
│       ├── resources/          # Resource update, hide
│       └── sophia/             # Sophia proxy (contracts, articles, sites, products, orgs)
├── components/
│   ├── bdc/                    # BdcTable, ContractPanel, ResourcesTable
│   ├── facturation/            # FacturationTable, SiteSearchModal
│   ├── layout/                 # AppLayout, Sidebar, Topbar, SophiaTopBar
│   ├── providers/              # SWRProvider
│   └── shared/                 # Badge, DataTable, Pagination, SearchBar, etc.
├── hooks/                      # useBdcList, useFacturation, useContractSearch, useDebounce
├── lib/
│   ├── auth/                   # JWT, middleware auth, rate-limit, types
│   ├── db/                     # Connection pool, queries (bdc, facturation, clients, resources, users), types
│   ├── sophia/                 # GraphQL client, queries, mutations, transform, types
│   └── validation.ts           # Validation utilitaires
├── theme/                      # GlobalStyle, StyledComponentsRegistry
├── types/                      # BDC, Resource, Sophia types (frontend)
└── middleware.ts               # Next.js edge middleware (auth guard)
```

---

## Fichiers de configuration

| Fichier | Role |
|---------|------|
| `next.config.js` | Config Next.js (standalone, styled-components, headers securite, CORS) |
| `tsconfig.json` | TypeScript strict, path alias `@/*` |
| `Dockerfile` | Build multi-stage Node 20 Alpine |
| `docker-compose.yml` | Service + Traefik + health check |
| `.env.example` | Template des variables d'environnement |
| `scripts/seed-admin.ts` | Script de creation du premier admin |
| `scripts/diff-db.js` | Script de comparaison de schemas DB |

---

## Audit de securite

### Score global : 77/100

| Domaine | Score | Commentaire |
|---------|-------|-------------|
| Auth / Securite | 80/100 | JWT correct, rate limiting, requetes parametrees |
| Routes API | 68/100 | Auth systematique, validation. Escalade horizontale routes Sophia |
| Couche Donnees | 78/100 | Pool singleton, Promise.all, JOINs OK. LIMIT/OFFSET interpoles |
| Config / Types / Frontend | 78/100 | Headers securite, types clairs. Fetcher duplique |

### Vulnerabilites P0 (Critiques)

#### P0-1 : Escalade de privileges horizontale — routes Sophia
**Fichiers** : `api/sophia/contracts/route.ts`, `api/sophia/organizations/route.ts`, `api/sophia/sites/route.ts`

`organizationId` provient des query params sans controle. Un utilisateur authentifie peut acceder aux contrats, organisations et sites d'autres organisations Sophia.

**Remediation** : Forcer `organizationId` depuis `process.env.SOPHIA_ORGANIZATION_ID`.

#### P0-2 : IDOR sur sites/select
**Fichier** : `api/sophia/sites/select/route.ts`

`resourceId` du body n'est pas valide et aucune verification d'appartenance. Tout utilisateur authentifie peut modifier n'importe quelle ressource.

**Remediation** : Valider `resourceId` (format UUID/id_dpl) et verifier l'appartenance a un BDC accessible.

#### P0-3 : Health expose l'etat interne
**Fichier** : `src/app/api/health/route.ts`

La route `/api/health` est accessible sans authentification et expose l'etat de la base de donnees et de l'API Sophia (statut ok/error).

**Remediation** : Route publique limitee (HTTP 200 uniquement) + route interne protegee pour le monitoring detaille.

### Vulnerabilites P1 (Importantes) — 16 issues

| # | Fichier | Description |
|---|---------|-------------|
| 1 | `lib/auth/rate-limit.ts` | Race condition : lecture puis maj non atomique, contournable sous charge |
| 2 | `api/auth/refresh/route.ts` | `X-Forwarded-For` spoofable pour le rate limit |
| 3 | `api/auth/users/route.ts` | `request.json()` sans `safeJson()` sur certaines routes |
| 4 | `api/sophia/articles/route.ts` | `{ ...body.article }` propage des champs arbitraires a GraphQL |
| 5 | `api/sophia/articles/[id]/route.ts` | Article du body envoye sans whitelist complete |
| 6 | `api/sophia/articles/orphans/route.ts` | `contractId` non valide comme UUID |
| 7 | `api/clients/[dynamicsAccountId]/route.ts` | `dynamicsAccountId` non valide (format, longueur) |
| 8 | `api/sophia/contracts/route.ts` | Pagination non bornee (`limit` libre) |
| 9 | `api/sophia/sites/verify/route.ts` | Side-effect en GET (maj `site.per_id`) |
| 10 | `lib/db/queries/bdc.ts` L47 | `LIMIT` et `OFFSET` interpoles dans la chaine SQL |
| 11 | `lib/db/queries/facturation.ts` L102 | Meme probleme LIMIT/OFFSET interpoles |
| 12 | `hooks/useContractSearch.ts` | Fetcher ne verifie pas `res.ok` |
| 13 | `.env.example` | IP interne exposee |
| 14 | `api/auth/login/route.ts` | Enumeration utilisateurs via message "Compte desactive" |
| 15 | `api/auth/refresh/route.ts` | Pas de rate limiting sur refresh (corrige depuis) |
| 16 | `api/bdc/facturation/cancelled/route.ts` | Message erreur non harmonise |

### Vulnerabilites P2 (Mineures) — 14 issues

| # | Description |
|---|-------------|
| 1 | Email non valide avant requete DB (login) |
| 2 | Pas de limite max longueur mot de passe (bcrypt tronque a 72) |
| 3 | `safeJson` ne limite pas la taille du body |
| 4 | `console.error` peut logger des infos sensibles en prod |
| 5 | Pas de revocation de tokens (pas de blacklist) |
| 6 | `catch (error: any)` au lieu de `unknown` |
| 7 | `productCode` sans limite de longueur |
| 8 | `goIds` (orphans) peut etre tres long |
| 9 | `rows as unknown as BonDeCommande[]` masque les ecarts |
| 10 | `queueLimit: 0` — file d'attente DB illimitee |
| 11 | Fetcher duplique dans 3 hooks (DRY) |
| 12 | Cles `e${i}` instables pour les ellipses (Pagination) |
| 13 | `CORS_ORIGIN` non documente dans `.env.example` |
| 14 | Logs Sophia trop detailles (payloads complets) |

### Bonnes pratiques identifiees

- Requetes SQL 100% parametrees (hors LIMIT/OFFSET)
- JWT avec algorithme explicite HS256 et secrets distincts
- Rate limiting sur login (5/15min) + reset apres succes
- Regles de mot de passe (longueur, casse, chiffre) + bcrypt (cost 10)
- `requireAuth()` sur toutes les routes protegees
- Whitelist des champs PATCH (`BDC_ALLOWED_FIELDS`, `RESOURCE_ALLOWED_KEYS`, `ARTICLE_ALLOWED_FIELDS`)
- Headers securite (X-Frame-Options, X-Content-Type, Referrer-Policy, Permissions-Policy)
- GraphQL parametre (variables, pas de concatenation)
- Messages d'erreur generiques ("Identifiants incorrects")

### Plan d'action securite

| Priorite | Actions |
|----------|---------|
| Immediat | P0-1 forcer organizationId, P0-2 valider resourceId, P0-3 limiter health |
| Court terme | Race condition rate-limit, safeJson + whitelist articles, parametrer LIMIT/OFFSET |
| Moyen terme | Centraliser fetcher, logger structure, blacklist tokens, migration Next.js 15 |

### Couverture de tests

**0 fichiers de test dans le codebase.** Aucun framework de test configure (ni Jest, ni Vitest, ni Playwright). C'est un risque majeur pour la stabilite et les regressions.
