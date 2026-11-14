-- ============================================================================
-- STTNS — projet FICTIF de démonstration « Panier Local »
-- Circuit court : maraîchers ↔ cantines scolaires (aucune donnée réelle).
--
-- Idempotent : UUID déterministes (md5 du slug + clé), ON CONFLICT partout.
-- Prérequis : les comptes démo existent dans auth.users (voir seed-panier-local.sh).
-- Usage    : ./seed-panier-local.sh (crée aussi les comptes démo)
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.k(key text) RETURNS uuid
LANGUAGE sql IMMUTABLE AS $$ SELECT md5('panier-local:' || key)::uuid $$;

CREATE OR REPLACE FUNCTION pg_temp.uid(mail text) RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT id FROM auth.users WHERE email = mail $$;

-- Repart d'une page blanche pour ce projet uniquement (cascade sur ses lignes).
DELETE FROM sttns_projects WHERE slug = 'panier-local';

-- ---------------------------------------------------------------- Projet ----
INSERT INTO sttns_projects (id, slug, name, nsm_label, nsm_description, description, is_active, settings)
VALUES (
  pg_temp.k('project'), 'panier-local', 'Panier Local',
  'Repas servis chaque semaine avec au moins 50 % de produits locaux',
  'Un repas ne compte que s''il a réellement été servi et que la moitié de ses denrées (en valeur) vient d''une exploitation à moins de 80 km. Ni les inscriptions, ni les commandes passées ne comptent : seul le plateau compte.',
  'Projet fictif de démonstration — plateforme qui relie maraîchers et cantines scolaires en circuit court.',
  true, '{}'::jsonb
);

-- ------------------------------------------------------------- Équipe -------
INSERT INTO sttns_profiles (id, full_name, email)
SELECT id, raw_user_meta_data->>'full_name', email FROM auth.users
WHERE email IN ('claire.morel@panier-local.test','hugo.lambert@panier-local.test','ines.faure@panier-local.test')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

INSERT INTO sttns_project_members (project_id, user_id, role, project_role) VALUES
  (pg_temp.k('project'), pg_temp.uid('claire.morel@panier-local.test'), 'ceo', 'ceo_admin'),
  (pg_temp.k('project'), pg_temp.uid('hugo.lambert@panier-local.test'), 'cto', 'editor'),
  (pg_temp.k('project'), pg_temp.uid('ines.faure@panier-local.test'),   'developer', 'editor')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------- Métriques d'entrée NSM ---
INSERT INTO sttns_project_metrics (id, project_id, name, description, sort_order) VALUES
  (pg_temp.k('m1'), pg_temp.k('project'), 'Producteurs actifs', 'Exploitations ayant publié au moins un lot dans la semaine.', 1),
  (pg_temp.k('m2'), pg_temp.k('project'), 'Collèges commandant chaque semaine', 'Établissements avec au moins une commande validée sur la semaine.', 2),
  (pg_temp.k('m3'), pg_temp.k('project'), 'Commandes livrées complètes', 'Part des commandes livrées sans rupture ni substitution non acceptée.', 3);

-- --------------------------------------------------------------- Cycles -----
INSERT INTO sttns_cycles (id, project_id, name, start_date, end_date, capacity_points, is_active) VALUES
  (pg_temp.k('c1'), pg_temp.k('project'), 'Cycle 1 — La récolte en ligne',     '2026-10-19', '2026-10-30', 10, false),
  (pg_temp.k('c2'), pg_temp.k('project'), 'Cycle 2 — Prévisions & panier',      '2026-11-02', '2026-11-20', 12, true),
  (pg_temp.k('c3'), pg_temp.k('project'), 'Cycle 3 — Ruptures & EGalim',        '2026-11-23', '2026-12-04', 12, false);

-- ------------------------------------------------------- Work items ---------
CREATE TEMP TABLE wi (
  key text, type sttns_work_item_type, parent text, title text, code text,
  status sttns_work_item_status, priority smallint, sort integer,
  cycle text, assignee text, metadata jsonb
) ON COMMIT DROP;

INSERT INTO wi VALUES
-- Personas ------------------------------------------------------------------
('p_marion','persona',NULL,'Marion Leroy','MARION','todo',3,1,NULL,NULL,
 '{"segment":"Productrice — maraîchage bio (8 ha)","description":"Exploitation familiale dans la Drôme. Vend sur les marchés et en AMAP ; veut des débouchés réguliers sans passer ses soirées sur l''administratif."}'),
('p_karim','persona',NULL,'Karim Benali','KARIM','todo',3,2,NULL,NULL,
 '{"segment":"Chef de cuisine — collège (600 couverts)","description":"Compose ses menus trois semaines à l''avance avec un budget denrées de 2,10 € par repas."}'),
('p_sophie','persona',NULL,'Sophie Garnier','SOPHIE','todo',3,3,NULL,NULL,
 '{"segment":"Responsable achats — conseil départemental","description":"Pilote les achats de 42 collèges ; doit prouver la conformité EGalim (50 % durable dont 20 % bio)."}'),

-- Pain points ---------------------------------------------------------------
('pp1','job','p_marion','[Pain Point: critical] Débouchés irréguliers : invendus en pleine saison',NULL,'todo',3,1,NULL,NULL,
 '{"spine_role":"pain_point","severity":"critical","label":"Débouchés irréguliers : invendus en pleine saison"}'),
('pp2','job','p_marion','[Pain Point: high] Les marchés publics sont illisibles pour une petite exploitation',NULL,'todo',3,2,NULL,NULL,
 '{"spine_role":"pain_point","severity":"high","label":"Les marchés publics sont illisibles pour une petite exploitation"}'),
('pp3','job','p_karim','[Pain Point: critical] Impossible de planifier les menus sur des volumes locaux incertains',NULL,'todo',3,1,NULL,NULL,
 '{"spine_role":"pain_point","severity":"critical","label":"Impossible de planifier les menus sur des volumes locaux incertains"}'),
('pp4','job','p_karim','[Pain Point: medium] Multiplier les fournisseurs, c''est multiplier les livraisons et les factures',NULL,'todo',3,2,NULL,NULL,
 '{"spine_role":"pain_point","severity":"medium","label":"Multiplier les fournisseurs, c''est multiplier les livraisons et les factures"}'),
('pp5','job','p_sophie','[Pain Point: high] Le taux EGalim se calcule à la main, une fois par an, dans un tableur',NULL,'todo',3,1,NULL,NULL,
 '{"spine_role":"pain_point","severity":"high","label":"Le taux EGalim se calcule à la main, une fois par an, dans un tableur"}'),

-- JTBD ----------------------------------------------------------------------
('j1','job','p_marion','Quand [ma récolte de la semaine est connue], je veux [la publier en deux minutes depuis le champ] afin de [la vendre avant qu''elle ne s''abîme]',NULL,'todo',3,3,NULL,NULL,'{"spine_role":"jtbd"}'),
('j2','job','p_marion','Quand [une cantine veut m''acheter], je veux [un cadre contractuel déjà conforme] afin de [vendre aux collectivités sans juriste]',NULL,'todo',3,4,NULL,NULL,'{"spine_role":"jtbd"}'),
('j3','job','p_karim','Quand [je bâtis mes menus], je veux [voir ce qui sera disponible localement dans trois semaines] afin de [composer sans mauvaise surprise]',NULL,'todo',3,3,NULL,NULL,'{"spine_role":"jtbd"}'),
('j4','job','p_karim','Quand [je commande à plusieurs producteurs], je veux [une seule livraison et une seule facture] afin de [garder une cuisine qui tourne]',NULL,'todo',3,4,NULL,NULL,'{"spine_role":"jtbd"}'),
('j5','job','p_sophie','Quand [un élu me demande où on en est], je veux [le taux EGalim à jour par collège] afin de [répondre en séance sans retraiter de fichiers]',NULL,'todo',3,2,NULL,NULL,'{"spine_role":"jtbd"}'),
('j6','job','p_sophie','Quand [je renouvelle un marché], je veux [comparer les prix locaux aux prix grossistes] afin de [justifier un éventuel surcoût]',NULL,'todo',3,3,NULL,NULL,'{"spine_role":"jtbd"}'),

-- Epics ---------------------------------------------------------------------
('e1','epic',NULL,'Catalogue vivant des producteurs','EP-CAT','in_progress',1,1,NULL,NULL,
 '{"description":"Rendre visible, **semaine après semaine**, ce que les exploitations du territoire peuvent livrer — aujourd''hui et dans trois semaines."}'),
('e2','epic',NULL,'Commande groupée & tournée unique','EP-CMD','in_progress',2,2,NULL,NULL,
 '{"description":"Un panier, une livraison, une facture — quel que soit le nombre de producteurs."}'),
('e3','epic',NULL,'Pilotage EGalim','EP-EGA','todo',2,3,NULL,NULL,
 '{"description":"Transformer chaque lot livré en preuve de conformité : bio, label, distance. Le taux se calcule tout seul."}'),

-- Features ------------------------------------------------------------------
('f1','feature','e1','Publication de la récolte en 2 minutes (mobile)','F-01','done',1,1,NULL,NULL,
 '{"impact":3,"description":"Depuis le champ, sur un téléphone, avec une connexion médiocre."}'),
('f2','feature','e1','Prévisions de disponibilité à 3 semaines','F-02','in_progress',1,2,NULL,NULL,
 '{"impact":3,"description":"Le chef compose ses menus sur ce qui *sera* là, pas sur ce qui l''est aujourd''hui."}'),
('f3','feature','e1','Badges producteurs (bio, HVE, distance)','F-03','todo',4,3,NULL,NULL,
 '{"impact":1}'),
('f4','feature','e2','Panier multi-producteurs','F-04','in_progress',1,1,NULL,NULL,
 '{"impact":3}'),
('f5','feature','e2','Tournée de livraison mutualisée','F-05','todo',2,2,NULL,NULL,
 '{"impact":2}'),
('f6','feature','e2','Facture unique mensuelle','F-06','todo',3,3,NULL,NULL,
 '{"impact":2}'),
('f7','feature','e3','Tableau de bord EGalim par collège','F-07','todo',2,1,NULL,NULL,
 '{"impact":3}'),
('f8','feature','e3','Contrats-cadres pré-remplis','F-08','todo',3,2,NULL,NULL,
 '{"impact":2}'),
('f9','feature','e3','Classement gamifié des collèges','F-09','todo',5,3,NULL,NULL,
 '{"impact":0,"effort_days":3,"complexity":2,"description":"Idée sortie d''un atelier. Aucun persona ne l''a demandée — à confronter au *Why* avant d''y passer une heure."}'),

-- Stories -------------------------------------------------------------------
('s01','story','f1','Saisir un lot (produit, quantité, date) depuis le mobile','S-01','done',1,1,'c1','ines',
 '{"effort_days":2,"complexity":1,"description":"**En tant que** productrice, **je veux** saisir un lot en trois champs **afin de** le publier sans quitter la parcelle."}'),
('s02','story','f1','Dupliquer la récolte de la semaine précédente','S-02','done',2,2,'c1','ines',
 '{"effort_days":1,"complexity":1}'),
('s03','story','f1','Photo du lot compressée et envoyée hors-ligne','S-03','done',2,3,'c1','hugo',
 '{"effort_days":3,"complexity":3,"description":"Risque inconnu au départ (stockage local + reprise d''envoi). Levé en cycle 1."}'),
('s04','story','f2','Saisir un calendrier de cultures prévisionnel','S-04','done',1,1,'c2','ines',
 '{"effort_days":3,"complexity":2}'),
('s05','story','f2','Agréger les prévisions par produit et par semaine','S-05','in_progress',1,2,'c2','hugo',
 '{"effort_days":2,"complexity":2}'),
('s06','story','f2','Vue « disponible dans 3 semaines » pour le chef','S-06','review',1,3,'c2','ines',
 '{"effort_days":2,"complexity":1}'),
('s07','story','f2','Indice de confiance des prévisions (historique producteur)','S-07','todo',2,4,'c3',NULL,
 '{"effort_days":5,"complexity":3}'),
('s08','story','f3','Calculer la distance exploitation → collège','S-08','todo',4,1,NULL,NULL,
 '{"effort_days":1,"complexity":1}'),
('s09','story','f4','Ajouter des lots de plusieurs producteurs au même panier','S-09','done',1,1,'c2','ines',
 '{"effort_days":2,"complexity":1}'),
('s10','story','f4','Valider la commande et notifier chaque producteur','S-10','in_progress',1,2,'c2','hugo',
 '{"effort_days":2,"complexity":2}'),
('s11','story','f4','Rupture : proposer un lot de substitution','S-11','todo',2,3,'c3',NULL,
 '{"effort_days":3,"complexity":3}'),
('s12','story','f5','Regrouper les commandes par plateforme de collecte','S-12','todo',2,1,'c3',NULL,
 '{"effort_days":3,"complexity":2}'),
('s13','story','f5','Générer la feuille de route du livreur','S-13','todo',3,2,NULL,NULL,
 '{"effort_days":2,"complexity":2}'),
('s14','story','f6','Consolider les lignes de tous les producteurs','S-14','todo',3,1,NULL,NULL,
 '{"effort_days":2,"complexity":2}'),
('s15','story','f6','Export comptable au format FEC','S-15','todo',3,2,NULL,NULL,
 '{"effort_days":3,"complexity":3}'),
('s16','story','f7','Qualifier chaque lot (bio, label, local) à la saisie','S-16','todo',2,1,'c3',NULL,
 '{"effort_days":1,"complexity":1}'),
('s17','story','f7','Calculer le taux EGalim mensuel par collège','S-17','todo',2,2,'c3',NULL,
 '{"effort_days":3,"complexity":2}'),
('s18','story','f7','Exporter le rapport annuel EGalim','S-18','todo',3,3,NULL,NULL,
 '{"effort_days":2,"complexity":1}'),
('s19','story','f8','Modèle de convention producteur ↔ collectivité','S-19','todo',3,1,NULL,NULL,
 '{"effort_days":2,"complexity":2}'),

-- Tasks ---------------------------------------------------------------------
('t01','task','s05','Requête d''agrégation hebdomadaire',NULL,'done',3,1,'c2','hugo','{}'),
('t02','task','s05','Tests sur un jeu de 40 producteurs',NULL,'in_progress',3,2,'c2','hugo','{}'),
('t03','task','s05','Cache d''une heure côté API',NULL,'todo',3,3,'c2',NULL,'{}'),
('t04','task','s06','Maquette mobile validée avec un chef',NULL,'done',3,1,'c2','ines','{}'),
('t05','task','s06','Revue accessibilité (contrastes, tailles)',NULL,'review',3,2,'c2','ines','{}'),
('t06','task','s10','Gabarit d''e-mail producteur',NULL,'done',3,1,'c2','hugo','{}'),
('t07','task','s10','Repli SMS si e-mail non lu sous 2 h',NULL,'todo',3,2,'c2',NULL,'{}');

-- Insertion dans l'ordre parent → enfant (les déclencheurs vérifient le type du parent).
DO $$
DECLARE
  r record;
  lvl int;
  people constant jsonb := jsonb_build_object(
    'claire', (SELECT id FROM auth.users WHERE email='claire.morel@panier-local.test'),
    'hugo',   (SELECT id FROM auth.users WHERE email='hugo.lambert@panier-local.test'),
    'ines',   (SELECT id FROM auth.users WHERE email='ines.faure@panier-local.test'));
BEGIN
  FOREACH lvl IN ARRAY ARRAY[1,2,3,4] LOOP
    FOR r IN
      SELECT * FROM wi WHERE CASE type
        WHEN 'persona' THEN 1 WHEN 'epic' THEN 1
        WHEN 'job' THEN 2 WHEN 'feature' THEN 2
        WHEN 'story' THEN 3 WHEN 'task' THEN 4 END = lvl
      ORDER BY sort
    LOOP
      INSERT INTO sttns_work_items (id, project_id, type, parent_id, status, priority, title, code,
                                    sort_order, cycle_id, assignee_id, created_by, metadata)
      VALUES (pg_temp.k(r.key), pg_temp.k('project'), r.type,
              CASE WHEN r.parent IS NULL THEN NULL ELSE pg_temp.k(r.parent) END,
              r.status, r.priority, r.title, r.code, r.sort,
              CASE WHEN r.cycle IS NULL THEN NULL ELSE pg_temp.k(r.cycle) END,
              (people->>r.assignee)::uuid, (people->>'claire')::uuid,
              r.metadata || '{"demo":"panier-local"}'::jsonb);
    END LOOP;
  END LOOP;
END $$;

-- ------------------------------------------------- Liens Why ---------------
-- JTBD → Pain Point (« solves »)
INSERT INTO sttns_work_item_links (source_id, target_id, type) VALUES
  (pg_temp.k('j1'), pg_temp.k('pp1'), 'solves'),
  (pg_temp.k('j2'), pg_temp.k('pp2'), 'solves'),
  (pg_temp.k('j3'), pg_temp.k('pp3'), 'solves'),
  (pg_temp.k('j4'), pg_temp.k('pp4'), 'solves'),
  (pg_temp.k('j5'), pg_temp.k('pp5'), 'solves'),
  (pg_temp.k('j6'), pg_temp.k('pp5'), 'solves');

-- Feature → JTBD (contexte). F-09 n'est reliée à aucun besoin, et le JTBD j6
-- n'est servi par aucune feature : deux anomalies volontaires pour le Radar.
INSERT INTO sttns_context_links (work_item_id, context_type, context_id) VALUES
  (pg_temp.k('f1'), 'job', pg_temp.k('j1')),
  (pg_temp.k('f2'), 'job', pg_temp.k('j3')),
  (pg_temp.k('f3'), 'job', pg_temp.k('j3')),
  (pg_temp.k('f4'), 'job', pg_temp.k('j4')),
  (pg_temp.k('f5'), 'job', pg_temp.k('j4')),
  (pg_temp.k('f6'), 'job', pg_temp.k('j4')),
  (pg_temp.k('f7'), 'job', pg_temp.k('j5')),
  (pg_temp.k('f8'), 'job', pg_temp.k('j2'));

COMMIT;

-- Résumé
SELECT type, status, count(*) AS n
FROM sttns_work_items WHERE project_id = md5('panier-local:project')::uuid
GROUP BY 1,2 ORDER BY 1,2;
