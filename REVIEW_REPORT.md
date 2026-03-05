# Rapport de revue - OC-Facturer

**Date :** 5 mars 2025  
**Périmètre :** Couches données (DB + Sophia) et Frontend

---

## PARTIE 1 - Base de données et Sophia

### Score qualité : **72/100**

---

### 1.1 Pool de connexions DB (`connection.ts`)

**Points positifs :**
- Singleton via `globalThis` pour éviter les pools multiples (Next.js hot reload)
- `waitForConnections: true`, `queueLimit: 0` pour éviter les rejets
- `enableKeepAlive` activé
- Configuration via variables d'environnement

**Problèmes :**
| Problème | Gravité | Détail |
|----------|---------|--------|
| Pas de gestion d'erreur sur `createPool` | Moyenne | Si les credentials sont invalides, l'erreur n'est pas explicite au démarrage |
| Pas de `charset` explicite | Basse | Risque d'encodage UTF-8 incorrect ; ajouter `charset: 'utf8mb4'` |
| Pas de validation des variables env | Moyenne | Si `DB_HOST` est undefined, le pool se crée silencieusement avec des valeurs vides |

**Recommandations :**
```typescript
// Valider les variables critiques au démarrage
if (!process.env.DB_HOST || !process.env.DB_USER) {
  throw new Error('DB_HOST and DB_USER must be set');
}
// Ajouter charset
charset: 'utf8mb4',
```

---

### 1.2 Requêtes SQL

#### `bdc.ts`

**Sécurité - Injections :**
| Fichier | Ligne | Problème | Gravité |
|---------|-------|----------|---------|
| bdc.ts | 29, 49 | `search` correctement paramétré via `?` | ✅ OK |
| bdc.ts | 46-47 | `LIMIT`/`OFFSET` en template literal — safe car `Number()` mais préférer placeholders | Basse |
| bdc.ts | 70-74 | `updateBdc` : les clés de `fields` sont concaténées sans whitelist dans la couche query | Moyenne |

**Note :** L'API route filtre via `allowedFields` avant d'appeler `updateBdc`, donc le flux actuel est sécurisé. Mais la couche query devrait avoir sa propre whitelist (défense en profondeur).

**Performance :**
- Pas d'index documentés dans le projet ; les colonnes filtrées (`statut_bdc`, `date_annulation`, `gdc_contractId`, `cree_le`, `numero_bdc`, `per_name`, `commercial_nom`) devraient être indexées
- Requête COUNT + SELECT séparées : acceptable pour la pagination
- Pas de requête N+1 détectée

#### `facturation.ts`

**Sécurité :**
- `search` paramétré ✅
- `sortKey` validé via `SORTABLE_COLUMNS` (whitelist) ✅
- `sortDir` limité à 'asc'|'desc' ✅
- `LIMIT`/`OFFSET` en template literal (idem bdc)

**Performance :**
- Jointures complexes (ressource_dpl, bon_de_commande, site, client, duree) — risque de full table scan sans index
- `getFacturationStats` : 3 requêtes séquentielles (stats, topClients, monthlyProgress) — pourrait être parallélisé avec `Promise.all`
- Sous-requêtes avec `GROUP BY` sur `site` et `client` : vérifier les index sur `id_sophia_go`, `id_client_dynamics`

#### `resources.ts`

**Sécurité :**
- `updateResource` : whitelist `allowedKeys` ✅
- Paramètres préparés pour les valeurs ✅

**Performance :**
- `getResourcesByBdcId` : simple, index sur `id_commande` recommandé

---

### 1.3 Client Sophia (`client.ts`, `queries.ts`, `mutations.ts`)

**Points positifs :**
- Timeout 30s configuré
- Refresh token avant expiration (60s de marge)
- Gestion des erreurs GraphQL (extraction des `debug_message`)
- Singleton pour éviter les reconnexions multiples
- Variables GraphQL utilisées (pas d'interpolation directe dans les queries)

**Problèmes :**
| Problème | Gravité | Détail |
|----------|---------|--------|
| Pas de retry sur échec réseau | Moyenne | Une requête échouée ne est pas réessayée |
| `testConnection` utilise l'interpolation pour `organizationId` | Basse | `"${this.config.organizationId}"` — config interne, risque limité |
| Pas de circuit breaker | Basse | En cas d'API Sophia down, chaque requête tente quand même |
| Erreur auth : `throw` sans retry | Moyenne | Si le token expire pendant une requête, l'utilisateur voit une erreur générique |

**Types de retour :**
- `executeGraphQL<T>` retourne `T` — typage générique correct
- Les queries/mutations n'ont pas de types TypeScript pour les réponses — typage implicite `any`

**Recommandations :**
```typescript
// Ajouter retry avec backoff exponentiel
async executeGraphQL<T>(query: string, variables?: Record<string, any>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      // ... existing logic
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

### 1.4 Synthèse Partie 1

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Pool DB | 7/10 | Config correcte, manque validation + charset |
| Sécurité SQL | 8/10 | Paramétrage OK, whitelist partielle |
| Performance SQL | 6/10 | Index non documentés, stats séquentielles |
| Client Sophia | 7/10 | Bonne base, manque retry/timeout avancé |
| Types | 6/10 | Types DB présents, GraphQL peu typé |

---

## PARTIE 2 - Frontend

### Score qualité : **74/100**

---

### 2.1 Gestion d'état (SWR)

**SWRProvider :**
- `dedupingInterval: 2000` — évite les requêtes dupliquées
- `revalidateOnFocus: false` — adapté à une app métier
- `errorRetryCount: 2` — retry limité
- `shouldRetryOnError` : pas de retry sur 401/403 ✅

**Problèmes :**
| Problème | Gravité |
|----------|---------|
| Pas de `errorRetryInterval` | Basse |
| Pas de `loadingTimeout` | Basse |
| Fetcher non partagé (chaque hook définit le sien) | Basse |

**Hooks useBdcList / useFacturation :**
- `refreshInterval: 30000` pour les listes — polling adapté
- Clé SWR correcte avec params
- `useCancelledBdcIds` : `useMemo` pour le Set — évite recréation à chaque render ✅

---

### 2.2 Composants

#### Props typées
- `BdcTable`, `ResourcesTable`, `FacturationTable` : interfaces explicites ✅
- `DataTable<T>` : générique correct ✅
- `SiteSearchModal` : props typées ✅

#### Gestion des erreurs
- Pages : `ErrorBanner` avec message + bouton fermer ✅
- `displayError` agrège fetchError + error local ✅
- **Manque :** pas de boundary Error Boundary au niveau app pour les crashes React

#### Loading states
- `DataTable` : affiche "Chargement..." quand `isLoading` ✅
- Pas de skeleton loader — expérience utilisateur perfectible

#### Accessibilité (a11y)
| Composant | Problème | Gravité |
|-----------|----------|---------|
| BdcTable | Checkbox sans `aria-label` | Moyenne |
| FacturationTable | Checkbox masquage sans label | Moyenne |
| SiteSearchModal | Overlay ferme au clic sans `role="dialog"` ni `aria-modal` | Moyenne |
| Pagination | Boutons "‹" "›" sans `aria-label` | Basse |
| Topbar | `aria-label` sur IconButton ✅ | OK |
| DataTable | Pas de `scope="col"` sur `<th>` | Basse |
| CloseBtn (ErrorBanner) | Pas d'`aria-label="Fermer"` | Basse |

**Recommandations a11y :**
```tsx
<input type="checkbox" aria-label="Ajouter à la GDC" ... />
<button aria-label="Fermer" onClick={...}>&times;</button>
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
```

---

### 2.3 Performance

**Re-renders :**
- `useCallback` utilisé pour les handlers dans les pages ✅
- `useMemo` pour les colonnes des tables ✅
- **Problème :** `FacturationTable` — les callbacks `onAddGdc`, `onValidate`, etc. sont dans le tableau de dépendances de `useMemo` des colonnes ; si le parent ne mémoise pas ces callbacks, les colonnes sont recréées à chaque render

**Memoization :**
- `BdcTable` / `ResourcesTable` : `useMemo` sur columns avec `[onToggleAjoutGdc]` etc. — dépend des callbacks parents
- Pages : callbacks en `useCallback` ✅ — bonne pratique

**Autres :**
- `SiteSearchModal` : `AbortController` pour annuler le fetch au démontage ✅
- Pas de virtualisation sur les tables — acceptable pour 50 lignes/page

---

### 2.4 Composants analysés

| Composant | Qualité | Points |
|-----------|---------|--------|
| layout.tsx | 8/10 | Structure claire, metadata, SWRProvider |
| a-facturer/page.tsx | 7/10 | Logique métier dense, handlers bien isolés |
| validation-bdc/page.tsx | 7/10 | Similaire, duplication possible avec a-facturer |
| BdcTable | 7/10 | Checkbox a11y, props typées |
| ResourcesTable | 7/10 | Inline styles sur boutons — extraire en styled |
| FacturationTable | 8/10 | Logique validation bien structurée, règles métier claires |
| SiteSearchModal | 7/10 | AbortController OK, a11y modal à améliorer |
| AppLayout | 8/10 | Structure propre |
| Sidebar | 8/10 | NavItem avec état actif |
| Topbar | 7/10 | aria-label présents |
| SophiaTopBar | 8/10 | Liens externes avec rel |
| DataTable | 7/10 | Générique correct, scope th manquant |
| Pagination | 8/10 | Logique getPageNumbers propre |
| SWRProvider | 7/10 | Config correcte |

---

### 2.5 Types

**resource.ts :**
- `ResourceRow` complet avec champs joints ✅
- `FacturationTab`, `FacturationFilter` typés ✅

**Incohérence détectée :**
- `FacturationTable` attend `cancelledBdcIds: Set<string>` et reçoit bien un `Set` de `useCancelledBdcIds` ✅

---

### 2.6 Synthèse Partie 2

| Critère | Score | Commentaire |
|---------|-------|-------------|
| SWR / état | 8/10 | Config solide, fetcher à centraliser |
| Props / types | 8/10 | Bon typage global |
| Erreurs / loading | 7/10 | Présents, pas de Error Boundary |
| Accessibilité | 6/10 | Manques sur checkboxes, modals, pagination |
| Performance | 7/10 | useCallback/useMemo OK, pas de virtualisation |

---

## Recommandations prioritaires

### Critique
1. **updateBdc** : Ajouter une whitelist des clés autorisées dans la couche query (défense en profondeur).

### Haute
2. **Pool DB** : Valider `DB_HOST`, `DB_USER` au démarrage ; ajouter `charset: 'utf8mb4'`.
3. **Sophia client** : Implémenter retry avec backoff sur les requêtes GraphQL.
4. **Accessibilité** : Ajouter `aria-label` sur les checkboxes et boutons icônes ; `role="dialog"` sur le modal.

### Moyenne
5. **getFacturationStats** : Paralléliser les 3 requêtes avec `Promise.all`.
6. **Index DB** : Documenter ou créer les index sur `statut_bdc`, `id_commande`, `J2_date_CMES`, `gdc_itemStatus`, etc.
7. **Error Boundary** : Ajouter un boundary au niveau layout pour capturer les erreurs React.

### Basse
8. **DataTable** : Ajouter `scope="col"` sur les `<th>`.
9. **Skeleton** : Remplacer "Chargement..." par un skeleton loader.
10. **Types GraphQL** : Typer les réponses des queries/mutations Sophia.

---

## Scores finaux

| Partie | Score | Verdict |
|--------|-------|---------|
| **Partie 1 - Données** | **72/100** | Bonne base, améliorations sécurité et perf |
| **Partie 2 - Frontend** | **74/100** | Solide, a11y et DX à renforcer |
| **Global** | **73/100** | Livrable, corrections recommandées avant mise en prod |
