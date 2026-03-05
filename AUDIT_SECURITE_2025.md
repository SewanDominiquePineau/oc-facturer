# Rapport d'audit de sécurité applicative

**Projets audités :** OC-Facturer (backend Next.js) et DSC-Portal (frontend React)  
**Date :** 5 mars 2025  
**Critères :** OWASP Top 10 (A01, A02, A03, A04, A05, A07, A09)

---

## Résumé exécutif

| Sévérité | Nombre |
|----------|--------|
| CRITIQUE | 2 |
| HAUTE | 4 |
| MOYENNE | 6 |
| BASSE | 4 |

---

## Vulnérabilités identifiées

### CRITIQUE

#### 1. Route /api/health sans authentification – divulgation d'informations

| Champ | Valeur |
|-------|--------|
| **Sévérité** | CRITIQUE |
| **Fichier** | `src/app/api/health/route.ts` |
| **Ligne** | 1-30 |
| **OWASP** | A01 (Broken Access Control), A05 (Security Misconfiguration) |
| **Description** | La route `/api/health` est accessible sans authentification et expose l'état interne du système : statut de la base de données et de l'API Sophia. Un attaquant peut sonder la disponibilité des services et identifier les composants utilisés. |
| **Remédiation** | Protéger la route par authentification, ou créer une route `/api/health/public` limitée (ex. HTTP 200 uniquement) et une route `/api/health/internal` protégée pour le monitoring détaillé. |

---

#### 2. Secrets JWT par défaut dans .env.example

| Champ | Valeur |
|-------|--------|
| **Sévérité** | CRITIQUE |
| **Fichier** | `OC-Facturer/.env.example`, `DSC-Portal/.env.example` |
| **Ligne** | 16-17 (OC-Facturer), 13-14 (DSC-Portal) |
| **OWASP** | A02 (Cryptographic Failures), A05 (Security Misconfiguration) |
| **Description** | Les variables `JWT_SECRET` et `JWT_REFRESH_SECRET` ont des valeurs par défaut explicites (`change-me-to-a-random-32-byte-string`). Si un déploiement utilise ces valeurs sans les modifier, les tokens JWT peuvent être forgés par un attaquant connaissant le secret. |
| **Remédiation** | Supprimer toute valeur par défaut pour les secrets. Documenter la génération : `openssl rand -base64 32`. Ajouter une validation au démarrage qui refuse de lancer l'application si les secrets sont inchangés. |

---

### HAUTE

#### 3. Stockage des tokens dans localStorage – exposition au XSS

| Champ | Valeur |
|-------|--------|
| **Sévérité** | HAUTE |
| **Fichier** | `DSC-Portal/src/auth/tokenStorage.ts` |
| **Ligne** | 1-20 |
| **OWASP** | A02 (Cryptographic Failures), A07 (Authentication Failures) |
| **Description** | Les tokens JWT sont stockés dans `localStorage`. En cas de vulnérabilité XSS, un script malveillant peut lire les tokens et usurper la session. `localStorage` est accessible à tout script exécuté sur la page. |
| **Remédiation** | Préférer des cookies HttpOnly + Secure + SameSite pour les tokens. Si le frontend doit conserver le token (ex. envoi manuel dans les headers), documenter le risque XSS et renforcer la protection (CSP, sanitization, pas de `dangerouslySetInnerHTML`). |

---

#### 4. Logging de données sensibles en production

| Champ | Valeur |
|-------|--------|
| **Sévérité** | HAUTE |
| **Fichier** | `src/app/api/sophia/articles/route.ts` |
| **Ligne** | 41, 83 |
| **OWASP** | A09 (Logging & Monitoring) |
| **Description** | `console.log` enregistre les payloads complets (`addArticle`, `deleteArticles`) incluant potentiellement des données métier sensibles (montants, références contrats). En production, ces logs peuvent être collectés et exposés. |
| **Remédiation** | Supprimer ou désactiver ces logs en production. Utiliser un niveau de log conditionnel (`if (process.env.NODE_ENV === 'development')`). Ne jamais logger de payloads contenant des données métier ou personnelles. |

---

#### 5. Rate limiting en mémoire – non persistant et non distribué

| Champ | Valeur |
|-------|--------|
| **Sévérité** | HAUTE |
| **Fichier** | `src/lib/auth/rate-limit.ts` |
| **Ligne** | 1-42 |
| **OWASP** | A07 (Authentication Failures), A04 (Insecure Design) |
| **Description** | Le rate limiting utilise une `Map` en mémoire. En cas de redémarrage ou de déploiement multi-instances, les compteurs sont réinitialisés. Un attaquant peut contourner la protection par redémarrage ou en répartissant les requêtes sur plusieurs instances. |
| **Remédiation** | Utiliser un store partagé (Redis, Memcached) pour le rate limiting. Ou un middleware externe (nginx, API Gateway) avec limite par IP. |

---

#### 6. Absence de validation UUID sur contractId (orphans)

| Champ | Valeur |
|-------|--------|
| **Sévérité** | HAUTE |
| **Fichier** | `src/app/api/sophia/articles/orphans/route.ts` |
| **Ligne** | 14-22 |
| **OWASP** | A03 (Injection), A05 (Security Misconfiguration) |
| **Description** | Le paramètre `contractId` est transmis à l'API GraphQL sans validation `isValidUUID`. Bien que GraphQL valide le type, l'absence de validation côté application peut mener à des erreurs inattendues ou à des comportements non prévus. `siteId` est également non validé. |
| **Remédiation** | Ajouter `if (!isValidUUID(contractId))` et `if (siteId && !isValidUUID(siteId))` avant l'appel GraphQL. Retourner 400 en cas d'UUID invalide. |

---

### MOYENNE

#### 7. Absence de contrôle d'accès au niveau ressource (IDOR potentiel)

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `src/app/api/sophia/sites/select/route.ts`, `src/app/api/resources/[id]/route.ts` |
| **Ligne** | 14-28 (sites/select), 6-21 (resources) |
| **OWASP** | A01 (Broken Access Control) |
| **Description** | Toute ressource peut être modifiée par tout utilisateur authentifié. Aucune vérification que la ressource appartient à l'utilisateur ou à son périmètre. Si le modèle métier évolue (utilisateurs externes, périmètres restreints), cela devient une faille IDOR. |
| **Remédiation** | Documenter l'hypothèse « tous les utilisateurs authentifiés sont internes et partagent les données ». Si le périmètre change, ajouter une vérification d'autorisation par ressource (ownership, organisation, etc.). |

---

#### 8. resourceId non validé dans sites/select

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `src/app/api/sophia/sites/select/route.ts` |
| **Ligne** | 14-28 |
| **OWASP** | A03 (Injection), A05 (Security Misconfiguration) |
| **Description** | Le champ `resourceId` (correspondant à `id_dpl`) est utilisé dans une requête SQL sans validation de format. Bien que la requête soit paramétrée (pas d'injection SQL), une valeur invalide peut provoquer des erreurs ou des mises à jour inattendues. |
| **Remédiation** | Valider `resourceId` avec `validateId` ou un schéma adapté au format `id_dpl` (UUID ou autre). Rejeter les requêtes avec des identifiants invalides. |

---

#### 9. dynamicsAccountId non validé

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `src/app/api/clients/[dynamicsAccountId]/route.ts` |
| **Ligne** | 4-27 |
| **OWASP** | A05 (Security Misconfiguration) |
| **Description** | Le paramètre `dynamicsAccountId` est passé directement à la requête SQL sans validation de format. La requête est paramétrée (pas d'injection), mais l'absence de validation peut faciliter des abus (ex. énumération, valeurs extrêmes). |
| **Remédiation** | Définir et appliquer une validation du format attendu pour `dynamicsAccountId` (longueur, caractères autorisés). Limiter la longueur si pertinent. |

---

#### 10. Exposition d’erreurs détaillées au client

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `src/app/api/sophia/products/search/[code]/route.ts` |
| **Ligne** | 41-46 |
| **OWASP** | A05 (Security Misconfiguration), A09 (Logging & Monitoring) |
| **Description** | En cas d'erreur, la réponse inclut `detail: error?.response?.data || error?.message`. Les réponses d'API externes (Sophia) peuvent contenir des informations sensibles (structure interne, chemins, versions). |
| **Remédiation** | Ne pas renvoyer les détails d'erreur externes au client. Logger les détails côté serveur et renvoyer un message générique (ex. « Erreur lors de la recherche »). |

---

#### 11. Logs d’erreur Sophia trop détaillés

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `src/lib/sophia/client.ts` |
| **Ligne** | 50, 81, 88 |
| **OWASP** | A09 (Logging & Monitoring) |
| **Description** | Les erreurs Sophia sont loguées avec `JSON.stringify(detail)` et `JSON.stringify(response.data.errors)`. Ces structures peuvent contenir des données sensibles (IDs, noms, messages internes). |
| **Remédiation** | Limiter le contenu logué (codes d’erreur, statuts). Éviter de logger des payloads complets. Utiliser un niveau de log approprié (debug vs error). |

---

#### 12. Mode invité avec token littéral

| Champ | Valeur |
|-------|--------|
| **Sévérité** | MOYENNE |
| **Fichier** | `DSC-Portal/src/auth/AuthProvider.tsx` |
| **Ligne** | 155-164 |
| **OWASP** | A07 (Authentication Failures), A04 (Insecure Design) |
| **Description** | Le mode invité utilise `setToken('guest')`. `authFetch` envoie `Authorization: Bearer guest`, ce qui sera rejeté par le backend. Le comportement est cohérent (invité sans accès API), mais le token littéral « guest » est prévisible et pourrait être mal géré si la logique d’auth évolue. |
| **Remédiation** | Documenter clairement que le mode invité n’a pas accès aux API. Ou désactiver `authFetch` pour l’invité (ne pas envoyer de header Authorization). Vérifier que les routes backend rejettent bien tout token non-JWT valide. |

---

### BASSE

#### 13. Validation du mot de passe – pas de caractère spécial

| Champ | Valeur |
|-------|--------|
| **Sévérité** | BASSE |
| **Fichier** | `src/lib/validation.ts` |
| **Ligne** | 48-57 |
| **OWASP** | A07 (Authentication Failures) |
| **Description** | La validation exige 8 caractères, majuscule, minuscule et chiffre, mais pas de caractère spécial. Cela peut réduire la robustesse des mots de passe face au brute-force. |
| **Remédiation** | Ajouter une règle optionnelle pour au moins un caractère spécial. Évaluer l’impact sur l’expérience utilisateur (réinitialisation de mots de passe). |

---

#### 14. Pas de révocation explicite des refresh tokens

| Champ | Valeur |
|-------|--------|
| **Sévérité** | BASSE |
| **Fichier** | `src/lib/auth/jwt.ts`, `src/app/api/auth/refresh/route.ts` |
| **OWASP** | A07 (Authentication Failures) |
| **Description** | Les refresh tokens sont stateless (JWT). Une fois émis, ils restent valides jusqu’à expiration (7 jours). En cas de compromission ou de déconnexion forcée, il n’y a pas de moyen de les invalider. |
| **Remédiation** | Pour des besoins de révocation, maintenir une liste noire (Redis) des refresh tokens révoqués, ou passer à des tokens opaques stockés en base avec possibilité de révocation. |

---

#### 15. CORS non audité

| Champ | Valeur |
|-------|--------|
| **Sévérité** | BASSE |
| **Fichier** | Configuration Next.js / reverse proxy |
| **OWASP** | A05 (Security Misconfiguration) |
| **Description** | Aucune configuration CORS explicite n’a été trouvée dans le périmètre audité. Les paramètres par défaut de Next.js ou du reverse proxy peuvent être trop permissifs. |
| **Remédiation** | Définir explicitement les origines autorisées pour les API. Restreindre les méthodes et headers autorisés. Vérifier la configuration en production. |

---

#### 16. authFetch sans vérification de l’URL

| Champ | Valeur |
|-------|--------|
| **Sévérité** | BASSE |
| **Fichier** | `DSC-Portal/src/auth/authFetch.ts` |
| **Ligne** | 26-52 |
| **OWASP** | A04 (Insecure Design) |
| **Description** | `authFetch` accepte n’importe quelle URL. Si une URL est construite à partir d’une entrée utilisateur non validée, le token pourrait être envoyé à un domaine tiers (fuite de token). Les usages actuels semblent utiliser des URLs contrôlées. |
| **Remédiation** | Valider que l’URL est relative ou appartient au domaine attendu avant d’envoyer le token. Ou encapsuler les appels pour n’accepter que des chemins relatifs. |

---

## Points positifs

- **Requêtes SQL paramétrées** : usage systématique de placeholders (`?`) avec `pool.execute()`, pas d’injection SQL identifiée.
- **Validation des UUID** : `validateId` et `isValidUUID` utilisés sur la plupart des routes à paramètres.
- **Rate limiting sur login** : protection contre le brute-force (5 tentatives / 15 min).
- **Rate limiting sur refresh** : 20 requêtes / 5 min par IP.
- **Validation des mots de passe** : règles de complexité et hash bcrypt (cost 10).
- **Messages d’erreur génériques** : « Identifiants incorrects » au lieu de révéler si l’email existe.
- **Contrôle des champs** : whitelist (`allowedKeys`, `BDC_ALLOWED_FIELDS`) pour les mises à jour.
- **Validation des filtres** : `VALID_TABS`, `VALID_FILTERS` pour limiter les valeurs des paramètres.
- **GraphQL paramétré** : variables GraphQL utilisées correctement, pas de concaténation de requêtes.

---

## Recommandations prioritaires

1. **Immédiat** : Protéger `/api/health` ou en limiter les informations exposées.
2. **Immédiat** : Supprimer les secrets par défaut dans `.env.example` et valider au démarrage.
3. **Court terme** : Supprimer ou restreindre les logs de payloads sensibles.
4. **Court terme** : Migrer le rate limiting vers un store partagé (Redis).
5. **Moyen terme** : Envisager des cookies HttpOnly pour les tokens.
6. **Moyen terme** : Ajouter les validations manquantes (contractId, siteId, resourceId, dynamicsAccountId).

---

## Annexe – Fichiers analysés

**OC-Facturer :**
- `src/lib/auth/middleware.ts`, `jwt.ts`, `rate-limit.ts`
- `src/app/api/auth/*` (login, refresh, me, users, users/[id])
- `src/lib/validation.ts`
- `src/lib/db/queries/resources.ts`, `bdc.ts`, `facturation.ts`, `clients.ts`
- `src/lib/sophia/client.ts`, `queries.ts`, `mutations.ts`
- `src/app/api/*` (toutes les routes)
- `.env.example`, `.gitignore`

**DSC-Portal :**
- `src/auth/authFetch.ts`, `AuthProvider.tsx`, `tokenStorage.ts`, `LoginPage.tsx`
- `vite.config.ts`, `.env.example`

---

*Rapport généré le 5 mars 2025. À réviser après corrections.*
