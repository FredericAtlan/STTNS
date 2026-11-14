# STTNS — Straight to the North Star

Un outil de pilotage produit qui relie chaque ligne de code à un besoin réel.

Dans STTNS, une story n'existe que si elle remonte, maillon par maillon, jusqu'à une personne et une douleur
précises&nbsp;:

```
Persona → Pain Point / Job-to-be-done → Epic → Feature → Story → Tâche
```

Ces règles sont inscrites dans la base (déclencheurs PostgreSQL), pas seulement dans l'interface.
Une story sans feature, ou une feature rattachée à une autre feature, est refusée à l'enregistrement.

## Ce qu'on y trouve

- **Matrice Besoins** : personas, pain points et jobs-to-be-done («&nbsp;Quand… je veux… afin de…&nbsp;»).
- **Valeur / effort sans réunion d'estimation** : impact 0–3 sur la feature, jours et risque sur la story,
  ratio calculé sur l'epic. Une feature d'impact 0 ne peut pas passer «&nbsp;en cours&nbsp;».
- **Cycles et Kanban** à capacité fixe (inspirés de *Shape Up*), limite de travail en cours.
- **Radar d'hygiène** et **copilot Santé** : features sans besoin, besoins sans feature, stagnation.
- **Arbre de relations, graphe de dépendances, brouillons Epic → Feature → Story, import/export CSV**.
- Un **Playbook** intégré qui explique les règles.

## Démarrer en local (Docker)

Prérequis : Docker, Node 20+, la [CLI Supabase](https://supabase.com/docs/guides/cli).

```bash
supabase start                     # Postgres, Auth, Storage… dans Docker
supabase db reset                  # installe le schéma (supabase/migrations)
cp .env.example .env.local         # puis y recopier ANON_KEY et SERVICE_ROLE_KEY de : supabase status -o env
./scripts/demo/seed-panier-local.sh                     # projet de démonstration (fictif)
docker compose -f docker-compose.local.yml --env-file .env.local up -d --build
```

Ouvrir http://localhost:3001 et se connecter avec `claire.morel@panier-local.test`
(mot de passe généré dans `.env.demo.local`).

Sans Docker pour l'application : `npm ci && npm run dev`.

## Le projet de démonstration

**Panier Local** est entièrement fictif : une plateforme qui relie des maraîchers à des cantines scolaires.
Trois personas, 9 features, 19 stories sur 3 cycles, et deux défauts glissés exprès (une feature d'impact 0,
un besoin qu'aucune feature ne sert) pour voir le Radar à l'œuvre.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (PostgreSQL, Auth, Storage, RLS) · Vitest · Docker.

## À propos de ce dépôt

Ce dépôt est une **copie publiée** du dépôt de développement, régénérée automatiquement à chaque version.
Les migrations de développement y sont remplacées par un schéma de référence unique
(`supabase/migrations/00000000000000_schema.sql`) : pensé pour une installation neuve.
