# Règles de validation des lignes de ressources à facturer

## Plan de mise en place — Sewan

**Document technique — Version 1.0 — Mars 2026**

---

## 1. Contexte et objectif

Ce document définit les règles de validation appliquées aux lignes de ressources à facturer dans le système Sophia Go. Chaque ligne doit répondre à **trois niveaux de validation obligatoires** : le bon de commande (contrat), le site, et le produit.

L'objectif est de garantir l'intégrité des données de facturation en s'assurant que chaque ressource est correctement rattachée à un contrat, un site et un produit valides avant toute génération de facture.

---

## 2. Règles de validation

### 2.1 Règle 1 — Bon de commande (Contrat)

Le bon de commande doit obligatoirement contenir les trois champs suivants, correctement renseignés :

| Champ | Description | Contrainte |
|-------|-------------|------------|
| `gdc_contractId` | Identifiant unique du contrat | Obligatoire — UUID v4 |
| `gdc_invoicedEntityName` | Nom de l'entité facturée | Obligatoire — Texte non vide |
| `gdc_invoicedEntityId` | Identifiant de l'entité facturée | Obligatoire — UUID v4 |

#### Exemples de données valides

| gdc_contractId | gdc_invoicedEntityName | gdc_invoicedEntityId |
|----------------|------------------------|----------------------|
| `fc2e70f3-4569-4375-941d-b6be007ed5cf` | `20230704XCI1030CC` | `ca43c778-bc67-4800-856b-c0a4aeb6b65a` |
| `f0d7540b-4c31-4e07-b266-30a327efe2b7` | `20230110FTR11042` | `df30e62-619d-4946-9623-3d99b35f1113` |
| `effdb416-3fa9-41b1-bb54-296f502e3988` | `201904300GBE1314C - GROUPE BERGER` | `99d523d7-69a3-4032-9572-0597ef1e6e71` |

---

### 2.2 Règle 2 — Site

L'identifiant du site Sophia Go doit être renseigné pour chaque ligne de ressource.

| Champ | Description | Contrainte |
|-------|-------------|------------|
| `id_site_sophia_go` | Identifiant du site dans Sophia Go | Obligatoire — provient de la liste des sites du client |

Ce champ est alimenté à partir de la liste des sites attachés au contrat identifié par `gdc_contractId`. Le système doit interroger Sophia Go pour récupérer les sites disponibles et permettre la sélection.

- Le site doit appartenir au contrat référencé par `gdc_contractId`
- Si le site n'est pas trouvé dans la liste, la ligne est en erreur
- La liste des sites doit être rechargée à chaque changement de contrat

---

### 2.3 Règle 3 — Produit

Les champs produit doivent être renseignés en suivant un processus de recherche en deux étapes :

| Champ | Description | Contrainte |
|-------|-------------|------------|
| `gdc_serviceId` | Identifiant du service | Obligatoire — alimenté par recherche |
| `gdc_categoryId` | Identifiant de la catégorie | Obligatoire — alimenté par recherche |
| `gdc_contractId` | Identifiant du contrat | Obligatoire — doit correspondre au contrat de la règle 1 |
| `gdc_catalogRef` | Référence catalogue | Obligatoire — modifiable, déclenche une nouvelle recherche |
| `gdc_productName` | Nom du produit | Obligatoire — alimenté automatiquement |
| `gdc_productName_update` | Nom du produit mis à jour | Obligatoire — alimenté automatiquement |

#### Processus de recherche produit

1. **Étape 1 — Recherche initiale :** Rechercher le produit par `code_produit`. Cette recherche alimente automatiquement les champs `gdc_serviceId`, `gdc_categoryId`, `gdc_catalogRef`, `gdc_productName` et `gdc_productName_update`.

2. **Étape 2 — Modification catalogue :** Si le champ `gdc_catalogRef` est modifié manuellement, une nouvelle recherche est déclenchée dans Sophia Go pour lister les produits disponibles correspondants. Les champs sont alors mis à jour avec le produit sélectionné.

---

## 3. Flux de validation

Le parcours de validation d'une ligne de ressource suit l'ordre suivant :

```
┌─────────────────────────┐
│  1. Bon de commande     │
│  gdc_contractId         │
│  gdc_invoicedEntityName │
│  gdc_invoicedEntityId   │
└──────────┬──────────────┘
           │ ✅
           ▼
┌─────────────────────────┐
│  2. Site                │
│  id_site_sophia_go      │
│  (filtré par contrat)   │
└──────────┬──────────────┘
           │ ✅
           ▼
┌─────────────────────────┐
│  3. Produit             │
│  Recherche code_produit │
│  Puis gdc_catalogRef    │
└──────────┬──────────────┘
           │ ✅
           ▼
┌─────────────────────────┐
│  ✅ Ligne prête à       │
│     facturer            │
└─────────────────────────┘
```

- Si toutes les étapes sont validées → la ligne est **prête à facturer**
- Si une étape échoue → la ligne est **flagée en erreur** avec un message explicite

---

## 4. Plan de mise en place

### 4.1 Vue d'ensemble

| # | Phase | Actions clés | Livrable | Durée |
|---|-------|-------------|----------|-------|
| 1 | Analyse & Spécifications | Cartographier les champs, documenter les APIs Sophia Go, définir les cas d'erreur | Cahier des charges | 1 semaine |
| 2 | Modèle de données | Ajouter les champs manquants, créer les index, contraintes FK | Script de migration | 3 jours |
| 3 | API / Backend | Développer les endpoints de validation, intégrer Sophia Go, gérer le cache | APIs fonctionnelles | 2 semaines |
| 4 | Interface utilisateur | Formulaire de saisie, auto-complétion, gestion des erreurs visuelles | UI intégrée | 1,5 semaine |
| 5 | Tests & Recette | Tests unitaires, intégration, non-régression, UAT | PV de recette signé | 1 semaine |
| 6 | Déploiement & suivi | Mise en production, monitoring, documentation utilisateur | MEP validée | 3 jours |

---

### 4.2 Phase 1 — Analyse & Spécifications

- Cartographier l'ensemble des champs impliqués et leurs dépendances
- Documenter les APIs Sophia Go utilisées (liste des sites par contrat, recherche produit par code, recherche catalogue)
- Définir les règles de validation détaillées (formats, longueurs, valeurs attendues)
- Lister les cas d'erreur et les messages associés
- Valider les spécifications avec les équipes métier et support

### 4.3 Phase 2 — Modèle de données

- Vérifier et ajouter les colonnes manquantes dans les tables de ressources
- Créer les index nécessaires pour les recherches fréquentes (`gdc_contractId`, `code_produit`, `gdc_catalogRef`)
- Mettre en place les contraintes d'intégrité référentielle
- Prévoir un script de migration réversible

### 4.4 Phase 3 — API / Backend

**Règle 1 : Validation du bon de commande**
- Endpoint de vérification : valider la présence et le format de `gdc_contractId`, `gdc_invoicedEntityName`, `gdc_invoicedEntityId`
- Vérifier l'existence du contrat dans Sophia Go

**Règle 2 : Récupération des sites**
- Appel API Sophia Go : `GET /contracts/{gdc_contractId}/sites`
- Cache local des sites par contrat (TTL configurable)
- Validation que `id_site_sophia_go` appartient à la liste retournée

**Règle 3 : Recherche et validation produit**
- Recherche initiale par `code_produit` → alimente tous les champs produit
- Recherche secondaire lors de la modification de `gdc_catalogRef`
- Appel API Sophia Go pour les produits disponibles du catalogue
- Gestion du cache et invalidation

### 4.5 Phase 4 — Interface utilisateur

- Formulaire de saisie avec les 3 blocs de règles clairement séparés
- Auto-complétion sur `gdc_contractId` avec affichage du nom de l'entité
- Sélecteur de site filtré par contrat (rechargé dynamiquement)
- Recherche produit avec champ `code_produit` et possibilité de modifier `gdc_catalogRef`
- Indicateurs visuels de validation (vert/rouge) sur chaque bloc
- Messages d'erreur contextuels et actionnables

### 4.6 Phase 5 — Tests & Recette

- Tests unitaires sur chaque règle de validation
- Tests d'intégration avec l'API Sophia Go (environnement de pré-prod)
- Scénarios de test avec les données exemples fournies
- Tests de non-régression sur le processus de facturation existant
- Recette utilisateur (UAT) avec les équipes support

### 4.7 Phase 6 — Déploiement & Suivi

- Déploiement progressif (canary release) pour limiter l'impact
- Monitoring des erreurs de validation en production
- Dashboard de suivi des lignes en erreur vs lignes validées
- Documentation utilisateur et formation des agents support
- Bilan à J+7 et J+30 avec ajustements si nécessaire

---

## 5. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| API Sophia Go indisponible | Blocage de la saisie des lignes | Cache local + mode dégradé avec validation différée |
| Données existantes non conformes | Lignes en erreur massive au démarrage | Script de migration pour les données historiques |
| Changement de structure catalogue | `gdc_catalogRef` invalide après mise à jour | Webhook de notification + revalidation automatique |
| Résistance au changement des équipes | Adoption lente, contournements | Formation, accompagnement, feedback loop |
