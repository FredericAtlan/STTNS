-- Tests de non-régression sécurité (RLS + RPC) — à jouer sur une base locale contenant
-- au moins deux projets et deux utilisateurs sans projet commun.
--   docker exec -i supabase_db_sttns-app psql -U postgres -v ON_ERROR_STOP=1 \
--     -v alice="'<uuid>'" -v bob_project="'<uuid projet dont alice n'est pas membre>'" < supabase/tests/securite_rls.sql
-- Tout se passe dans une transaction annulée : la base n'est pas modifiée.
\set QUIET on
BEGIN;

SELECT set_config('t.bob', :bob_project, true);
CREATE TEMP TABLE resultats (test text, ok boolean, detail text) ON COMMIT DROP;
GRANT ALL ON resultats TO authenticated, anon;

SELECT set_config('request.jwt.claims', json_build_object('sub', :alice, 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

-- 1. Les projets dont on n'est pas membre sont invisibles
INSERT INTO resultats SELECT 'projet tiers invisible', NOT EXISTS (SELECT 1 FROM sttns_projects WHERE id = :bob_project), '';

-- 2. Duplication d'un projet tiers refusée
DO $$ BEGIN
  PERFORM sttns_duplicate_project(current_setting('t.bob')::uuid, 'vol', 'vol', auth.uid());
  INSERT INTO resultats VALUES ('duplication projet tiers refusée', false, 'la copie a réussi');
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO resultats VALUES ('duplication projet tiers refusée', true, SQLERRM);
END $$;

-- 3. Création de projet par un utilisateur normal + CEO de son projet
INSERT INTO sttns_projects (slug, name, nsm_label) VALUES ('test-securite', 'Test', 'x');
INSERT INTO sttns_project_members (project_id, user_id, role)
  SELECT id, auth.uid(), 'ceo' FROM sttns_projects WHERE slug = 'test-securite';
INSERT INTO resultats SELECT 'création de projet + CEO', sttns_is_project_ceo(id), '' FROM sttns_projects WHERE slug = 'test-securite';

-- 4. Duplication de son propre projet autorisée
INSERT INTO resultats SELECT 'duplication de son projet',
  sttns_duplicate_project(id, 'test-securite-copie', 'Copie', auth.uid()) IS NOT NULL, ''
  FROM sttns_projects WHERE slug = 'test-securite';

-- 5. Se nommer CEO d'un projet tiers refusé
DO $$ BEGIN
  INSERT INTO sttns_project_members (project_id, user_id, role) VALUES (current_setting('t.bob')::uuid, auth.uid(), 'ceo');
  INSERT INTO resultats VALUES ('auto-nomination CEO tiers refusée', false, 'insertion acceptée');
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO resultats VALUES ('auto-nomination CEO tiers refusée', true, SQLERRM);
END $$;

-- 6. Invitations : impossible d'utiliser l'e-mail d'un autre
DO $$ BEGIN
  PERFORM sttns_apply_pending_invites(auth.uid(), 'quelquun.dautre@example.com');
  INSERT INTO resultats VALUES ('invitations d''autrui refusées', false, 'appel accepté');
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO resultats VALUES ('invitations d''autrui refusées', true, SQLERRM);
END $$;

-- 7. Vocabulaire persona d'un projet tiers : ni lu ni modifiable
INSERT INTO resultats SELECT 'vocabulaire tiers invisible',
  NOT EXISTS (SELECT 1 FROM sttns_persona_tier_defs WHERE project_id = :bob_project), '';

-- 8. Profils : seulement soi et ses coéquipiers
INSERT INTO resultats SELECT 'annuaire des profils restreint',
  NOT EXISTS (SELECT 1 FROM sttns_profiles p WHERE p.id <> auth.uid() AND NOT sttns_shares_project_with(p.id)), '';

RESET ROLE;
-- 9. anon ne peut appeler aucune fonction privilégiée
SET LOCAL ROLE anon;
DO $$ BEGIN
  PERFORM sttns_duplicate_project(current_setting('t.bob')::uuid, 'vol', 'vol', NULL);
  INSERT INTO resultats VALUES ('anon sans RPC privilégiée', false, 'appel accepté');
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO resultats VALUES ('anon sans RPC privilégiée', true, SQLERRM);
END $$;
RESET ROLE;

\set QUIET off
SELECT CASE WHEN ok THEN 'OK ' ELSE 'KO ' END || test AS resultat FROM resultats;
SELECT CASE WHEN bool_and(ok) THEN 'TOUS LES TESTS PASSENT' ELSE 'ÉCHEC' END AS bilan FROM resultats;
ROLLBACK;
