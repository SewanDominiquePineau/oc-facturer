# Review Complète – OC-Facturer

**Date** : 5 mars 2026
**Version** : 0.1.0 (branche `feat/initial-app`)
**Stack** : Next.js 14 (App Router) / TypeScript / MySQL / Sophia GraphQL API

---

## Scores

| Domaine | Score | Statut |
|---------|-------|--------|
| Architecture | 80/100 | Bonne |
| Sécurité | 72/100 | À améliorer |
| API Routes | 68/100 | À améliorer |
| Base de données | 72/100 | Correcte |
| Frontend | 74/100 | Correcte |
| **Global** | **73/100** | **À améliorer** |

---

## 1. Architecture

### Stack technique

| Composant | Technologie |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript |
| Styles | styled-components 6 |
| Data fetching | SWR 2 |
| HTTP client | axios (Sophia) |
| Base de données | MySQL (mysql2/promise) |
| Auth | JWT (jsonwebtoken) + bcrypt |

### Organisation du code

```
src/
├── app/            → Pages + API routes (21 endpoints)
├── components/     → UI par domaine (bdc, facturation, layout, shared)
├── hooks/          → Logique réutilisable (SWR, debounce)
├── lib/            → Auth, DB, Sophia, validation
├── theme/          → Styles globaux
└── types/          → Types partagés
```

### Points positifs
- Séparation claire des responsabilités
- Pool DB singleton avec `globalThis` (compatible HMR)
- Client Sophia encapsulé avec refresh token
- Hooks SWR pour le data fetching

### Points d'attention
- `useProductSearch.ts` : hook jamais importé (code mort)
- `theme/sophia.ts` : thème défini mais jamais utilisé (couleurs en dur dans les composants)
- `useContractSearch.ts` : contient aussi `useOrganizationChildren` (2 hooks dans 1 fichier)
- Pas de middleware Next.js global (auth gérée route par route)
- `next.config.js` en CommonJS alors que le projet est en TypeScript

---

## 2. Sécurité (72/100)

### Ce qui est bien fait ✅
- **SQL injection** : toutes les requêtes sont paramétrées (`pool.execute()` avec `?`)
- **Bcrypt** : 10 salt rounds pour le hashing des mots de passe
- **JWT** : secrets distincts access/refresh, expiration 1h/7d
- **Rate limiting** : 5 tentatives / 15 min par email sur `/login`
- **Autorisation** : `requireAuth`, `requireAdmin`, `requireAccesAdv` sur les routes

### Vulnérabilités identifiées

| Sévérité | ID | Description | Action |
|----------|----|-------------|--------|
| **HIGH** | H1 | Pas de rate limit sur `/api/auth/refresh` | Ajouter rate limit |
| **HIGH** | H2 | Rate limit stocké en mémoire (perdu au restart, pas multi-instance) | Migrer vers Redis ou DB |
| **HIGH** | H3 | Énumération d'utilisateurs : "Compte désactivé" vs "Identifiants incorrects" | Message générique unique |
| **MEDIUM** | M1 | Pas d'en-têtes de sécurité (X-Frame-Options, CSP, HSTS, etc.) | Configurer `next.config.js` headers |
| **MEDIUM** | M2 | Algorithme JWT non forcé à `HS256` | Ajouter `{ algorithm: 'HS256' }` |
| **MEDIUM** | M3 | `params.id` rarement validé (UUID) dans les routes | Utiliser `isValidUUID()` partout |
| **MEDIUM** | M4 | Variables d'env DB non validées au démarrage | Vérifier au boot |
| **LOW** | L1 | CORS non configuré explicitement | Configurer si exposé |
| **LOW** | L2 | Regex email basique dans la validation | Utiliser une lib (zod, etc.) |
| **LOW** | L3 | `sentPayload` exposé dans les réponses d'erreur Sophia | Supprimer en production |

---

## 3. API Routes (68/100)

### Inventaire complet (21 routes)

| Méthode | Path | Auth | Validation | Problèmes |
|---------|------|:----:|:----------:|-----------|
| GET | `/api/health` | ❌ | — | OK (public volontaire) |
| POST | `/api/auth/login` | ❌ | ✅ | H3 : énumération users |
| GET | `/api/auth/me` | ✅ | — | OK |
| POST | `/api/auth/refresh` | ❌ | ✅ | H1 : pas de rate limit |
| GET | `/api/auth/users` | ✅ Admin | — | OK |
| PATCH | `/api/auth/users/[id]` | ✅ Admin | ⚠️ | ID non validé UUID |
| GET | `/api/bdc` | ✅ | ⚠️ | `filter` sans validation valeurs, NaN possible |
| GET | `/api/bdc/[id]` | ✅ | ❌ | ID non validé |
| PATCH | `/api/bdc/[id]` | ✅ | ⚠️ | ID non validé, body non protégé |
| PATCH | `/api/bdc/[id]/ajout-gdc` | ✅ | ❌ | ID non validé, body non validé |
| GET | `/api/bdc/[id]/resources` | ✅ | ❌ | ID non validé |
| GET | `/api/bdc/facturation` | ✅ | ⚠️ | `tab`/`filter` sans validation |
| GET | `/api/bdc/facturation/cancelled` | ✅ | — | OK |
| GET | `/api/bdc/facturation/stats` | ✅ | — | Format réponse incohérent |
| GET | `/api/clients/[id]` | ✅ | ❌ | ID non validé |
| PATCH | `/api/resources/[id]` | ✅ | ❌ | ID non validé, pas de whitelist body |
| PATCH | `/api/resources/[id]/hide` | ✅ | ❌ | ID non validé, `hidden` non validé |
| POST | `/api/sophia/articles` | ✅ | ✅ | OK |
| DELETE | `/api/sophia/articles` | ✅ | ✅ | OK (UUID validés) |
| GET | `/api/sophia/articles/[id]` | ✅ | ❌ | ID non validé, syntax params Next 15 |
| PATCH | `/api/sophia/articles/[id]` | ✅ | ❌ | Body non validé |
| GET | `/api/sophia/articles/orphans` | ✅ | ✅ | OK |
| GET | `/api/sophia/contracts` | ✅ | ⚠️ | `limit`/`page` sans validation |
| GET | `/api/sophia/organizations` | ✅ | ⚠️ | `orgId` peut être undefined |
| GET | `/api/sophia/organizations/[id]/children` | ✅ | ❌ | ID non validé |
| GET | `/api/sophia/products/search/[code]` | ✅ | ✅ | OK |
| GET | `/api/sophia/sites` | ✅ | ⚠️ | `page`/`limit` sans validation |
| POST | `/api/sophia/sites/select` | ✅ | ✅ | OK (UUID validés) |
| GET | `/api/sophia/sites/verify` | ✅ | ⚠️ | UUID non validés |

### Problèmes récurrents
1. **IDs dynamiques** : rarement validés (UUID format)
2. **`request.json()`** : non protégé dans un try/catch → 500 au lieu de 400
3. **Pagination** : `parseInt` sans contrôle NaN ni bornes min/max
4. **Format réponse** : `facturation/stats` utilise `{ success, ...data }` au lieu de `{ success, data }`

---

## 4. Base de données & Sophia (72/100)

### Base de données

| Aspect | Statut |
|--------|--------|
| Pool singleton | ✅ `globalThis` + `enableKeepAlive` |
| Requêtes paramétrées | ✅ Protection SQL injection |
| Whitelist update | ⚠️ Présente dans `updateResource`, absente dans `updateBdc` |
| Validation env vars | ❌ Pas de vérification au démarrage |
| Charset | ❌ Non défini (devrait être `utf8mb4`) |
| Performance | ⚠️ `getFacturationStats` fait 3 requêtes séquentielles |
| Index | ❓ Non documentés, potentiellement manquants |

### Client Sophia (GraphQL)

| Aspect | Statut |
|--------|--------|
| Timeout | ✅ 30s |
| Refresh token | ✅ Automatique |
| Gestion erreurs GraphQL | ✅ Détaillée |
| Retry sur erreur réseau | ❌ Absent |
| Types GraphQL | ⚠️ Utilise `any` par endroits |

---

## 5. Frontend (74/100)

### Points positifs
- SWR bien configuré (dedup 2s, retry limité, pas de retry 401/403)
- `DataTable<T>` générique et réutilisable
- `useCallback` / `useMemo` bien utilisés
- `AbortController` dans `SiteSearchModal` (annulation requêtes)
- Logique métier de validation claire dans `FacturationTable`

### Problèmes

| Sévérité | Problème |
|----------|----------|
| **MEDIUM** | Pas d'Error Boundary au niveau app |
| **MEDIUM** | Accessibilité : checkboxes sans `aria-label`, modal sans `role="dialog"` |
| **MEDIUM** | Boutons de pagination sans labels accessibles |
| **LOW** | Loading : simple texte "Chargement..." (pas de skeleton) |
| **LOW** | `scope="col"` manquant sur les en-têtes de tableau |
| **LOW** | Couleurs en dur au lieu d'utiliser le thème `sophia.ts` |

---

## 6. Plan d'action prioritaire

### Critique (à faire immédiatement)
1. ~~**H3**~~ Remplacer "Compte désactivé" par "Email ou mot de passe incorrect" dans `/api/auth/login`
2. **H1** Ajouter rate limit sur `/api/auth/refresh`
3. **Whitelist** dans `updateBdc` (défense en profondeur)

### Haute priorité (cette semaine)
4. **M3** Valider tous les `params.id` avec `isValidUUID()` (12 routes concernées)
5. **M2** Forcer `{ algorithm: 'HS256' }` dans `jwt.sign()` et `jwt.verify()`
6. **M1** Configurer les en-têtes de sécurité dans `next.config.js`
7. Protéger tous les `request.json()` dans un try/catch
8. Valider les variables d'environnement DB au démarrage

### Moyenne priorité (ce mois)
9. Migrer le rate limiting vers un store persistant (Redis/DB)
10. Paralléliser `getFacturationStats` (`Promise.all`)
11. Ajouter un Error Boundary React
12. Améliorer l'accessibilité (aria-labels, role="dialog")
13. Unifier le format de réponse JSON (facturation/stats)

### Basse priorité (backlog)
14. Supprimer le code mort (`useProductSearch`, `sophiaTheme`)
15. Ajouter `charset: 'utf8mb4'` à la config DB
16. Retry sur le client Sophia (erreurs réseau)
17. Skeleton loaders au lieu de "Chargement..."
18. Extraire `useOrganizationChildren` dans un fichier séparé

---

## 7. Fichiers concernés par les corrections

| Action | Fichiers |
|--------|----------|
| Validation UUID | `bdc/[id]/*`, `resources/[id]/*`, `sophia/articles/[id]`, `sophia/organizations/[id]/*`, `clients/[id]`, `auth/users/[id]` |
| Protection JSON | `bdc/[id]`, `bdc/[id]/ajout-gdc`, `resources/[id]`, `resources/[id]/hide`, `sophia/articles/[id]` |
| Rate limit refresh | `src/app/api/auth/refresh/route.ts` |
| Message login | `src/app/api/auth/login/route.ts` |
| Headers sécurité | `next.config.js` |
| JWT algorithm | `src/lib/auth/jwt.ts` |
| DB charset + env validation | `src/lib/db/connection.ts` |
| Whitelist updateBdc | `src/lib/db/queries/bdc.ts` |
| Error Boundary | `src/app/layout.tsx` |
| Code mort | `src/hooks/useProductSearch.ts`, `src/theme/sophia.ts` |
