#!/usr/bin/env bash
# Seed du projet FICTIF « Panier Local » sur le Supabase LOCAL (Docker).
# - crée 3 comptes démo (@panier-local.test) via l'API admin GoTrue locale
# - charge scripts/demo/panier-local.sql dans le conteneur Postgres
# Le mot de passe démo est écrit dans .env.demo.local (ignoré par git).
set -euo pipefail
cd "$(dirname "$0")/../.."

set -a; source .env.local; set +a
case "$NEXT_PUBLIC_SUPABASE_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "❌ Refus : NEXT_PUBLIC_SUPABASE_URL n'est pas local ($NEXT_PUBLIC_SUPABASE_URL)"; exit 1 ;;
esac

if [ -f .env.demo.local ]; then source .env.demo.local; fi
DEMO_PASSWORD="${DEMO_PASSWORD:-$(openssl rand -base64 18 | tr -d '/+=')}"
printf 'DEMO_EMAIL=claire.morel@panier-local.test\nDEMO_PASSWORD=%s\n' "$DEMO_PASSWORD" > .env.demo.local

create_user() { # email full_name
  local body
  body=$(printf '{"email":"%s","password":"%s","email_confirm":true,"user_metadata":{"full_name":"%s"}}' "$1" "$DEMO_PASSWORD" "$2")
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' -d "$body")
  echo "  compte $1 → HTTP $code (422 = existe déjà)"
}

echo "👥 Comptes démo"
create_user claire.morel@panier-local.test "Claire Morel"
create_user hugo.lambert@panier-local.test "Hugo Lambert"
create_user ines.faure@panier-local.test   "Inès Faure"

echo "🌱 Données Panier Local"
project_id=$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' supabase/config.toml)
docker exec -i "supabase_db_${project_id}" psql -U postgres -v ON_ERROR_STOP=1 -q < scripts/demo/panier-local.sql
echo "✅ Connexion : claire.morel@panier-local.test (mot de passe dans .env.demo.local)"
