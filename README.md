# OC-Facturer

Application interne Sewan de gestion de la facturation des bons de commande (BDC). Fait le lien entre la base MySQL interne (OC-DB) et l'API GraphQL Sophia (ERP Sewan) pour orchestrer la saisie des articles de facturation dans les contrats.

## Stack technique

- **Framework** : Next.js 14 (App Router, TypeScript strict)
- **Base de donnees** : MySQL (mysql2/promise, pool connexions)
- **API externe** : Sophia GraphQL (Keycloak OIDC)
- **Auth** : JWT (access 1h + refresh 7d) + bcrypt
- **Frontend** : React 18, styled-components 6, SWR 2
- **Deploy** : Docker multi-stage + Traefik

## Demarrage rapide

### Prerequis

- Node.js 20+
- MySQL 8+ (acces a la base OC-DB)
- Compte Sophia (credentials GraphQL)

### Installation

```bash
npm ci
cp .env.example .env
# Remplir les variables dans .env
```

### Configuration (.env)

```env
# Base de donnees
DB_HOST=
DB_PORT=3306
DB_NAME=oc_db
DB_USER=
DB_PASSWORD=

# Sophia API
SOPHIA_USERNAME=
SOPHIA_PASSWORD=
SOPHIA_ORGANIZATION_ID=8f19e50e-1be4-48b7-8c2a-6d0c477ff141
SOPHIA_GRAPHQL_URL=https://sophia3.sewan.fr/go/api/graphql/

# JWT (generer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=
JWT_REFRESH_SECRET=

# Application
NODE_ENV=development
CORS_ORIGIN=https://dsc-portal.sewan.fr
```

### Lancement

```bash
# Developpement
npm run dev

# Build production
npm run build
npm start
```

### Creation du premier admin

```bash
npx tsx scripts/seed-admin.ts
```

## Pages

| URL | Description |
|-----|-------------|
| `/validation-bdc` | Validation des BDC et association de contrats Sophia |
| `/a-facturer` | Gestion de la facturation (CMES + Facturations Anticipees) |

## API

22 routes API documentees dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Routes publiques : `/api/health`, `/api/auth/login`, `/api/auth/refresh`

Toutes les autres routes requierent un token JWT (`Authorization: Bearer <token>`).

Specification OpenAPI complete : [`docs/openapi.yaml`](docs/openapi.yaml)

## Docker

```bash
# Build et lancement
docker compose up -d

# Health check
curl http://localhost:3000/api/health
```

L'image utilise un build multi-stage Node 20 Alpine avec un utilisateur non-root `nextjs`.
Le conteneur est configure avec un health check automatique et un reseau Traefik.

## Architecture

```
src/
├── app/api/           # 22 routes API (Next.js Route Handlers)
├── app/               # 3 pages (layout, validation-bdc, a-facturer)
├── components/        # 15 composants React (bdc, facturation, layout, shared)
├── hooks/             # 7 hooks SWR (useBdcList, useFacturation, etc.)
├── lib/auth/          # JWT, middleware, rate-limit
├── lib/db/            # Pool MySQL, queries (bdc, facturation, resources, clients, users)
├── lib/sophia/        # Client GraphQL Sophia, queries, mutations, transform
├── lib/validation.ts  # UUID, email, password, pagination
├── types/             # TypeScript interfaces (bdc, resource, sophia)
└── theme/             # styled-components (GlobalStyle, SSR registry)
```

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Documentation technique complete (architecture, API, DB, securite) |
| [`docs/openapi.yaml`](docs/openapi.yaml) | Specification OpenAPI 3.0 des routes API |
| [`docs/Plan_Regles_Facturation_Sewan.md`](docs/Plan_Regles_Facturation_Sewan.md) | Regles metier de facturation |
| [`AUDIT_SECURITE_2025.md`](AUDIT_SECURITE_2025.md) | Audit de securite applicative |

## Securite

Score global : **77/100**. Voir la section securite dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Points forts :
- Requetes SQL 100% parametrees
- JWT HS256 avec secrets distincts
- Rate limiting sur login
- Whitelist des champs PATCH
- Headers HTTP securises

Points a ameliorer :
- Escalade horizontale routes Sophia (P0)
- Couverture de tests : 0%
- Rate limiting a migrer vers Redis
