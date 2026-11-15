#!/usr/bin/env bash
# Seed du projet FICTIF « Panier Local » sur le Supabase LOCAL (Docker).
#
#   ./scripts/demo/seed-panier-local.sh [ton.email@exemple.fr]
#
# - crée 3 coéquipiers fictifs (@panier-local.test) SANS mot de passe : ils peuplent
#   le projet, mais personne ne peut se connecter avec ;
# - (re)charge scripts/demo/panier-local.sql dans le conteneur Postgres ;
# - si un e-mail est passé : rattache CE compte (créé au préalable via « Créer un compte »
#   sur /login, avec le mot de passe de ton choix) comme admin du projet de démo.
#   Le rechargement recrée le projet : repasse ton e-mail à chaque fois.
# Aucun mot de passe n'est généré ni écrit par ce script.
set -euo pipefail
cd "$(dirname "$0")/../.."

owner_email="${1:-}"

set -a; source .env.local; set +a
case "$NEXT_PUBLIC_SUPABASE_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "❌ Refus : NEXT_PUBLIC_SUPABASE_URL n'est pas local ($NEXT_PUBLIC_SUPABASE_URL)"; exit 1 ;;
esac

project_id=$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' supabase/config.toml)
psql_local() { docker exec -i "supabase_db_${project_id}" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

create_teammate() { # email full_name — compte sans mot de passe
  local body code
  body=$(printf '{"email":"%s","email_confirm":true,"user_metadata":{"full_name":"%s"}}' "$1" "$2")
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' -d "$body")
  echo "  $1 → HTTP $code (422 = existe déjà)"
}

echo "👥 Coéquipiers fictifs (sans mot de passe)"
create_teammate claire.morel@panier-local.test "Claire Morel"
create_teammate hugo.lambert@panier-local.test "Hugo Lambert"
create_teammate ines.faure@panier-local.test   "Inès Faure"

echo "🌱 Données Panier Local"
psql_local < scripts/demo/panier-local.sql

if [ -z "$owner_email" ]; then
  echo "✅ Projet de démo chargé."
  echo "   Crée ton compte sur http://localhost:3001/login (« Créer un compte »), puis relance :"
  echo "   ./scripts/demo/seed-panier-local.sh ton.email@exemple.fr"
  exit 0
fi

found=$(psql_local -At -v owner="$owner_email" <<'SQL'
INSERT INTO sttns_project_members (project_id, user_id, role, project_role)
SELECT md5('panier-local:project')::uuid, u.id, 'ceo', 'ceo_admin'
FROM auth.users u WHERE lower(u.email) = lower(:'owner')
ON CONFLICT DO NOTHING;
SELECT count(*) FROM auth.users WHERE lower(email) = lower(:'owner');
SQL
)
if [ "$found" = "0" ]; then
  echo "❌ Aucun compte $owner_email : crée-le d'abord sur http://localhost:3001/login, puis relance."
  exit 1
fi
echo "✅ $owner_email est admin du projet Panier Local : connecte-toi avec ton propre mot de passe."
