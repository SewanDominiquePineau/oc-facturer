# Audit de sécurité - OC-Facturer

**Date :** 5 mars 2026  
**Périmètre :** Module d'authentification et gestion utilisateurs  
**Fichiers analysés :** 11 fichiers critiques

---

## Score de sécurité : **72/100**

| Catégorie | Score | Max |
|-----------|-------|-----|
| Injection SQL | 20 | 20 |
| Authentification / JWT | 16 | 20 |
| Hashing mots de passe | 20 | 20 |
| Rate limiting | 12 | 20 |
| Autorisation | 20 | 20 |
| Headers de sécurité / CORS | 0 | 15 |
| Validation des entrées | 16 | 20 |
| Gestion des erreurs | 12 | 20 |

---

## Vulnérabilités identifiées

### CRITICAL (0)

*Aucune vulnérabilité critique identifiée.*

---

### HIGH (3)

#### H1 - Endpoint `/api/auth/refresh` sans rate limiting
**Fichier :** `src/app/api/auth/refresh/route.ts`

L'endpoint de refresh token n'applique aucun rate limiting. Un attaquant disposant d'un refresh token valide peut le renouveler indéfiniment. Pire : en cas de fuite de tokens, une attaque par force brute sur des tokens devinés n'est pas limitée.

**Recommandation :** Appliquer un rate limit par IP et/ou par userId sur l'endpoint refresh (ex. 10 requêtes / 15 min).

---

#### H2 - Rate limit en mémoire : non persistant et non distribué
**Fichier :** `src/lib/auth/rate-limit.ts`

Le store utilise un `Map` en mémoire :
- Réinitialisation à chaque redémarrage du serveur
- Inopérant en environnement multi-instances (cluster, Kubernetes)
- Un attaquant peut contourner en attendant un redémarrage ou en saturant plusieurs instances

**Recommandation :** Migrer vers Redis (ou équivalent) pour un store partagé et persistant.

---

#### H3 - User enumeration via message "Compte désactivé"
**Fichier :** `src/app/api/auth/login/route.ts` (lignes 36-41)

```typescript
if (!user.actif) {
  return NextResponse.json(
    { success: false, message: 'Compte desactive' },
    { status: 403 }
  );
}
```

Un attaquant peut distinguer :
- Email inexistant → "Identifiants incorrects" (401)
- Email existant mais désactivé → "Compte desactive" (403)

Cela permet d'énumérer les comptes valides.

**Recommandation :** Retourner le même message "Identifiants incorrects" avec status 401 pour les comptes désactivés.

---

### MEDIUM (4)

#### M1 - Absence d'en-têtes de sécurité
**Fichier :** `next.config.js`

Aucun en-tête de sécurité configuré :
- `X-Frame-Options` (protection clickjacking)
- `X-Content-Type-Options`
- `Content-Security-Policy`
- `Strict-Transport-Security` (HSTS)
- `Referrer-Policy`

**Recommandation :** Ajouter les headers dans `next.config.js` :

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ];
}
```

---

#### M2 - Algorithme JWT non explicite
**Fichier :** `src/lib/auth/jwt.ts`

`jsonwebtoken` utilise HS256 par défaut, mais l'algorithme n'est pas explicitement fixé. Cela réduit la résilience face à d'éventuelles failles d'algorithm confusion.

**Recommandation :** Forcer l'algorithme :

```typescript
jwt.sign(payload, getAccessSecret(), { 
  expiresIn: '1h', 
  algorithm: 'HS256' 
});
jwt.verify(token, getAccessSecret(), { algorithms: ['HS256'] });
```

---

#### M3 - Paramètre `params.id` non validé
**Fichier :** `src/app/api/auth/users/[id]/route.ts`

`params.id` est utilisé directement sans validation UUID. Bien que les requêtes SQL soient paramétrées (pas d'injection), des valeurs inattendues peuvent atteindre la base ou générer des erreurs.

**Recommandation :** Valider avec `isValidUUID(params.id)` avant toute requête.

---

#### M4 - Durée de vie du refresh token (7 jours)
**Fichier :** `src/lib/auth/jwt.ts`

Un refresh token valide 7 jours augmente la fenêtre d'exploitation en cas de vol. Aucun mécanisme de révocation (blacklist) n'est implémenté.

**Recommandation :** Réduire à 1-2 jours et/ou implémenter une blacklist de tokens révoqués (ex. Redis).

---

### LOW (3)

#### L1 - CORS non configuré
**Fichier :** `next.config.js`

Next.js applique un CORS permissif par défaut pour les API routes. En production, restreindre les origines autorisées.

---

#### L2 - Regex email basique
**Fichier :** `src/lib/validation.ts`

Le regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` est minimal. Il peut accepter des emails invalides (ex. `a@b.c`) ou rejeter des formats valides (IDN, sous-domaines complexes).

**Recommandation :** Utiliser une librairie dédiée (ex. `validator`, `zod` avec format email).

---

#### L3 - Exposition des règles de validation du mot de passe
**Fichier :** `src/app/api/auth/users/route.ts` (ligne 54)

Le message d'erreur renvoie les règles exactes : `pwdCheck.errors.join(', ')`. C'est utile pour l'UX mais aide un attaquant à construire des mots de passe valides.

**Recommandation :** Message générique côté API ("Format de mot de passe invalide") et affichage détaillé uniquement côté client.

---

## Points positifs

| Élément | Statut |
|---------|--------|
| **Requêtes SQL paramétrées** | ✅ Toutes les requêtes utilisent `pool.execute()` avec placeholders `?` |
| **Hashing bcrypt** | ✅ 10 rounds, `bcrypt.compare()` correct |
| **Secrets JWT** | ✅ Variables d'environnement, secrets distincts access/refresh |
| **Expiration tokens** | ✅ Access 1h, refresh 7d |
| **Rotation refresh** | ✅ Nouveau refresh token à chaque refresh |
| **Autorisation** | ✅ `requireAdmin`, `requireAccesAdv` correctement appliqués |
| **Validation mot de passe** | ✅ 8 caractères, majuscule, minuscule, chiffre |
| **Exclusion mot_de_passe_hash** | ✅ Hash jamais renvoyé dans les réponses |
| **Rate limit login** | ✅ 5 tentatives / 15 min par email |

---

## Recommandations prioritaires

### Priorité 1 (à traiter immédiatement)
1. **H3** – Uniformiser le message pour les comptes désactivés ("Identifiants incorrects")
2. **H1** – Ajouter un rate limit sur l'endpoint `/api/auth/refresh`

### Priorité 2 (courte échéance)
3. **H2** – Migrer le rate limiting vers Redis
4. **M1** – Configurer les en-têtes de sécurité
5. **M2** – Forcer l'algorithme JWT à HS256

### Priorité 3 (moyenne échéance)
6. **M3** – Valider `params.id` avec `isValidUUID()`
7. **M4** – Réduire la durée du refresh token et/ou ajouter une blacklist
8. **L1** – Configurer CORS en production

---

## Synthèse

Le module d'authentification repose sur de bonnes bases : requêtes paramétrées, bcrypt, JWT avec secrets distincts, contrôle d’accès cohérent. Les principaux axes d’amélioration concernent le rate limiting (persistance, couverture des endpoints), la suppression de l’énumération d’utilisateurs et le renforcement des en-têtes de sécurité. En appliquant les recommandations de priorité 1 et 2, le score pourrait atteindre **85–90/100**.
