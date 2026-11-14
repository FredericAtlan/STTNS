-- STTNS — schéma de référence (structure seule, aucune donnée).
-- Généré par scripts/ope/baseline.sh — ne pas modifier à la main.
-- source-migrations: 20260721040000

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: sttns_asset_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_asset_type AS ENUM (
    'persona',
    'user_story',
    'initiative',
    'epic'
);


--
-- Name: sttns_content_verdict; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_content_verdict AS ENUM (
    'approve',
    'request_changes'
);


--
-- Name: sttns_context_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_context_type AS ENUM (
    'persona',
    'pain_point',
    'job',
    'metric'
);


--
-- Name: sttns_decision; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_decision AS ENUM (
    'build',
    'learn',
    'expert_review',
    'kill'
);


--
-- Name: sttns_epic_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_epic_status AS ENUM (
    'draft',
    'ready',
    'in_progress',
    'done'
);


--
-- Name: sttns_execution_proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_execution_proposal_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: sttns_horizon_opinion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_horizon_opinion AS ENUM (
    'mvp_now',
    'post_mvp',
    'scale',
    'not_now'
);


--
-- Name: sttns_initiative_execution_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_initiative_execution_status AS ENUM (
    'pending',
    'in_development',
    'in_test',
    'deployed'
);


--
-- Name: sttns_initiative_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_initiative_status AS ENUM (
    'draft',
    'in_review',
    'approved',
    'parking_lot'
);


--
-- Name: sttns_initiative_task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_initiative_task_status AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'done'
);


--
-- Name: sttns_initiative_version_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_initiative_version_type AS ENUM (
    'v1_mvp',
    'v2_consolidation'
);


--
-- Name: sttns_input_metric; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_input_metric AS ENUM (
    'breadth',
    'depth',
    'frequency',
    'efficiency'
);


--
-- Name: sttns_kano_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_kano_type AS ENUM (
    'must_be',
    'performance',
    'attractive'
);


--
-- Name: sttns_module; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_module AS ENUM (
    'ingestion',
    'accounting',
    'scoring_web3',
    'platform'
);


--
-- Name: sttns_placement_reason_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_placement_reason_type AS ENUM (
    'tech_dependency',
    'resource_availability',
    'strategic_priority',
    'other'
);


--
-- Name: sttns_platform_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_platform_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: sttns_project_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_project_role AS ENUM (
    'ceo',
    'cto',
    'specialist',
    'developer',
    'expert',
    'pm',
    'dev'
);


--
-- Name: sttns_projected_functionality; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_projected_functionality AS ENUM (
    'none',
    'some',
    'basic',
    'good',
    'best'
);


--
-- Name: sttns_projected_satisfaction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_projected_satisfaction AS ENUM (
    'dissatisfied',
    'neutral',
    'satisfied',
    'delighted'
);


--
-- Name: sttns_review_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_review_status AS ENUM (
    'draft',
    'in_review',
    'validated',
    'changes_requested',
    'aligned',
    'needs_ceo_decision'
);


--
-- Name: sttns_squad_project_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_squad_project_role AS ENUM (
    'viewer',
    'editor',
    'ceo_admin'
);


--
-- Name: sttns_user_story_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_user_story_status AS ENUM (
    'proposed',
    'validated',
    'in_sprint',
    'delivered'
);


--
-- Name: sttns_validation_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_validation_method AS ENUM (
    'terrain_signal',
    'wizard_of_oz',
    'mockup',
    'fake_door'
);


--
-- Name: sttns_validation_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_validation_mode AS ENUM (
    'peer_ceo',
    'hierarchical'
);


--
-- Name: sttns_validation_step; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_validation_step AS ENUM (
    'tier1',
    'cto',
    'ceo'
);


--
-- Name: sttns_work_item_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_work_item_event_type AS ENUM (
    'created',
    'status_changed',
    'assignee_changed',
    'parent_changed',
    'priority_changed',
    'title_changed',
    'archived',
    'restored',
    'link_added',
    'link_removed',
    'updated'
);


--
-- Name: sttns_work_item_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_work_item_status AS ENUM (
    'todo',
    'in_progress',
    'review',
    'done'
);


--
-- Name: sttns_work_item_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_work_item_type AS ENUM (
    'epic',
    'feature',
    'story',
    'task',
    'persona',
    'job'
);


--
-- Name: TYPE sttns_work_item_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE public.sttns_work_item_type IS 'Types de WorkItems selon la Constitution STTNS:
- epic, feature, story, task : Delivery (Comment)
- persona, job : Discovery (Pourquoi)
Règles: job doit avoir un parent persona; persona n''a pas de parent';


--
-- Name: sttns_workflow_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sttns_workflow_status AS ENUM (
    'draft',
    'tier1_pending',
    'tier1_complete',
    'cto_pending',
    'ceo_pending',
    'approved',
    'parking_lot',
    'killed'
);


--
-- Name: sttns_advance_workflow(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_advance_workflow(p_initiative_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tier1_count INT;
  v_tier1_kill INT;
  v_cto_decision sttns_decision;
  v_ceo_decision sttns_decision;
  v_status sttns_workflow_status;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE decision = 'kill')
  INTO v_tier1_count, v_tier1_kill
  FROM sttns_initiative_reviews
  WHERE initiative_id = p_initiative_id AND validation_step = 'tier1';

  IF v_tier1_count >= 1 AND v_tier1_kill = v_tier1_count THEN
    UPDATE sttns_initiatives SET workflow_status = 'killed', final_decision = 'kill', decision = 'kill', status = 'parking_lot'
    WHERE id = p_initiative_id;
    RETURN;
  END IF;

  IF v_tier1_count < 1 THEN
    UPDATE sttns_initiatives SET workflow_status = 'tier1_pending' WHERE id = p_initiative_id;
    RETURN;
  END IF;

  SELECT decision INTO v_cto_decision
  FROM sttns_initiative_reviews
  WHERE initiative_id = p_initiative_id AND validation_step = 'cto'
  LIMIT 1;

  IF v_cto_decision IS NULL THEN
    UPDATE sttns_initiatives SET workflow_status = 'cto_pending' WHERE id = p_initiative_id;
    RETURN;
  END IF;

  IF v_cto_decision = 'kill' THEN
    UPDATE sttns_initiatives SET workflow_status = 'killed', final_decision = 'kill', decision = 'kill', status = 'parking_lot'
    WHERE id = p_initiative_id;
    RETURN;
  END IF;

  SELECT decision INTO v_ceo_decision
  FROM sttns_initiative_reviews
  WHERE initiative_id = p_initiative_id AND validation_step = 'ceo'
  LIMIT 1;

  IF v_ceo_decision IS NULL THEN
    UPDATE sttns_initiatives SET workflow_status = 'ceo_pending' WHERE id = p_initiative_id;
    RETURN;
  END IF;

  v_status := CASE v_ceo_decision
    WHEN 'build' THEN 'approved'::sttns_workflow_status
    WHEN 'kill' THEN 'killed'::sttns_workflow_status
    ELSE 'parking_lot'::sttns_workflow_status
  END;

  UPDATE sttns_initiatives SET
    workflow_status = v_status,
    final_decision = v_ceo_decision,
    decision = v_ceo_decision,
    status = CASE v_ceo_decision
      WHEN 'build' THEN 'approved'::sttns_initiative_status
      WHEN 'kill' THEN 'parking_lot'::sttns_initiative_status
      ELSE 'in_review'::sttns_initiative_status
    END
  WHERE id = p_initiative_id;
END;
$$;


--
-- Name: sttns_apply_pending_invites(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_apply_pending_invites(p_user_id uuid, p_email text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  inv RECORD;
  r TEXT;
  applied_count integer := 0;
  squad sttns_squad_project_role;
BEGIN
  IF p_user_id IS NULL OR p_email IS NULL OR trim(p_email) = '' THEN
    RETURN 0;
  END IF;

  FOR inv IN
    SELECT id, project_id, roles, squad_role
    FROM sttns_project_invites
    WHERE status = 'pending'
      AND lower(trim(email)) = lower(trim(p_email))
  LOOP
    squad := COALESCE(inv.squad_role, 'editor'::sttns_squad_project_role);

    FOREACH r IN ARRAY inv.roles
    LOOP
      BEGIN
        INSERT INTO sttns_project_members (project_id, user_id, role, project_role)
        VALUES (inv.project_id, p_user_id, r::sttns_project_role, squad);
      EXCEPTION
        WHEN unique_violation THEN
          UPDATE sttns_project_members
          SET project_role = squad
          WHERE project_id = inv.project_id AND user_id = p_user_id;
      END;
    END LOOP;

    UPDATE sttns_project_members
    SET project_role = squad
    WHERE project_id = inv.project_id AND user_id = p_user_id;

    UPDATE sttns_project_invites
    SET status = 'accepted', user_id = p_user_id, accepted_at = now()
    WHERE id = inv.id;

    applied_count := applied_count + 1;
  END LOOP;

  RETURN applied_count;
END;
$$;


--
-- Name: sttns_audit_assignee_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_assignee_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type,
      field_name, old_value, new_value
    ) VALUES (
      NEW.id, NEW.updated_by, 'assignee_changed',
      'assignee_id',
      COALESCE(OLD.assignee_id::text, 'null'),
      COALESCE(NEW.assignee_id::text, 'null')
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_audit_parent_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_parent_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type,
      field_name, old_value, new_value,
      payload
    ) VALUES (
      NEW.id, NEW.updated_by, 'parent_changed',
      'parent_id',
      COALESCE(OLD.parent_id::text, 'null'),
      COALESCE(NEW.parent_id::text, 'null'),
      jsonb_build_object(
        'old_tree_path', OLD.tree_path,
        'new_tree_path', NEW.tree_path
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_audit_priority_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_priority_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type,
      field_name, old_value, new_value
    ) VALUES (
      NEW.id, NEW.updated_by, 'priority_changed',
      'priority',
      OLD.priority::text,
      NEW.priority::text
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_audit_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type,
      field_name, old_value, new_value
    ) VALUES (
      NEW.id, NEW.updated_by, 'status_changed',
      'status', OLD.status::text, NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_audit_work_item_link_added(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_work_item_link_added() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO sttns_work_item_events (
    work_item_id, actor_id, event_type,
    field_name, new_value, payload
  ) VALUES (
    NEW.source_id,
    NEW.created_by,
    'link_added',
    NEW.type,
    NEW.target_id::text,
    jsonb_build_object(
      'link_id', NEW.id,
      'source_id', NEW.source_id,
      'target_id', NEW.target_id,
      'type', NEW.type
    )
  );
  RETURN NEW;
END;
$$;


--
-- Name: sttns_audit_work_item_link_removed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_work_item_link_removed() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO sttns_work_item_events (
    work_item_id, actor_id, event_type,
    field_name, old_value, payload
  ) VALUES (
    OLD.source_id,
    auth.uid(),
    'link_removed',
    OLD.type,
    OLD.target_id::text,
    jsonb_build_object(
      'link_id', OLD.id,
      'source_id', OLD.source_id,
      'target_id', OLD.target_id,
      'type', OLD.type
    )
  );
  RETURN OLD;
END;
$$;


--
-- Name: sttns_audit_work_item_updated(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_audit_work_item_updated() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title
     OR OLD.code IS DISTINCT FROM NEW.code
     OR OLD.metadata IS DISTINCT FROM NEW.metadata THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type,
      field_name, payload
    ) VALUES (
      NEW.id,
      NEW.updated_by,
      'updated',
      CASE
        WHEN OLD.title IS DISTINCT FROM NEW.title THEN 'title'
        WHEN OLD.code IS DISTINCT FROM NEW.code THEN 'code'
        ELSE 'metadata'
      END,
      jsonb_strip_nulls(jsonb_build_object(
        'title', CASE WHEN OLD.title IS DISTINCT FROM NEW.title
          THEN jsonb_build_object('old', OLD.title, 'new', NEW.title) END,
        'code', CASE WHEN OLD.code IS DISTINCT FROM NEW.code
          THEN jsonb_build_object('old', OLD.code, 'new', NEW.code) END,
        'metadata_changed', OLD.metadata IS DISTINCT FROM NEW.metadata
      ))
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sttns_audit_work_item_updated(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sttns_audit_work_item_updated() IS 'Audit édition work item (title/code/metadata) — SECURITY DEFINER';


--
-- Name: sttns_calculate_tree_path(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_calculate_tree_path() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  parent_path TEXT;
BEGIN
  -- Si pas de parent, tree_path vide
  IF NEW.parent_id IS NULL THEN
    NEW.tree_path := '';
    RETURN NEW;
  END IF;
  
  -- Récupère le path du parent
  SELECT tree_path INTO parent_path 
  FROM sttns_work_items 
  WHERE id = NEW.parent_id;
  
  -- Construit le nouveau path: parent_path/id/
  IF parent_path = '' OR parent_path IS NULL THEN
    NEW.tree_path := NEW.parent_id::text || '/';
  ELSE
    NEW.tree_path := parent_path || NEW.parent_id::text || '/';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: sttns_duplicate_project(uuid, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_duplicate_project(source_id uuid, new_slug text, new_name text, creator_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_new_project_id UUID;
BEGIN
  INSERT INTO sttns_projects (
    slug, name, nsm_label, nsm_description, description,
    validation_mode, auto_act_on_consensus, ceo_delegate_user_id,
    is_active
  )
  SELECT
    new_slug, new_name, nsm_label, nsm_description, description,
    validation_mode, auto_act_on_consensus, ceo_delegate_user_id,
    true
  FROM sttns_projects WHERE id = source_id
  RETURNING id INTO v_new_project_id;

  INSERT INTO sttns_project_members (project_id, user_id, role)
  VALUES (v_new_project_id, creator_id, 'ceo');

  CREATE TEMP TABLE module_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_modules (project_id, code, name, description, sort_order)
    SELECT v_new_project_id, code, name, description, sort_order
    FROM sttns_modules WHERE project_id = source_id AND archived_at IS NULL
    RETURNING id, code
  )
  INSERT INTO module_map (old_id, new_id)
  SELECT m.id, i.id FROM sttns_modules m JOIN inserted i ON m.code = i.code WHERE m.project_id = source_id;

  INSERT INTO sttns_persona_tier_defs (project_id, code, title, description, sort_order)
  SELECT v_new_project_id, code, title, description, sort_order
  FROM sttns_persona_tier_defs WHERE project_id = source_id AND archived_at IS NULL;

  INSERT INTO sttns_persona_job_type_defs (project_id, code, title, hint, sort_order)
  SELECT v_new_project_id, code, title, hint, sort_order
  FROM sttns_persona_job_type_defs WHERE project_id = source_id AND archived_at IS NULL;

  CREATE TEMP TABLE metric_map (old_id UUID, new_id UUID);

  WITH inserted AS (
    INSERT INTO sttns_project_metrics (project_id, parent_id, name, description, sort_order, legacy_key)
    SELECT v_new_project_id, NULL, name, description, sort_order, legacy_key
    FROM sttns_project_metrics
    WHERE project_id = source_id AND parent_id IS NULL
    RETURNING id, name
  )
  INSERT INTO metric_map (old_id, new_id)
  SELECT m.id, i.id FROM sttns_project_metrics m JOIN inserted i ON m.name = i.name AND m.project_id = source_id AND m.parent_id IS NULL;

  WITH inserted AS (
    INSERT INTO sttns_project_metrics (project_id, parent_id, name, description, sort_order, legacy_key)
    SELECT v_new_project_id, mm.new_id, m.name, m.description, m.sort_order, m.legacy_key
    FROM sttns_project_metrics m
    JOIN metric_map mm ON m.parent_id = mm.old_id
    WHERE m.project_id = source_id
    RETURNING id, name
  )
  INSERT INTO metric_map (old_id, new_id)
  SELECT m.id, i.id FROM sttns_project_metrics m JOIN inserted i ON m.name = i.name AND m.project_id = source_id AND m.parent_id IS NOT NULL;

  CREATE TEMP TABLE persona_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_personas (
      project_id, name, persona_code, project_scope, tier_label,
      profile_summary, persona_status, friction_summary, pain_point_detail,
      job_functional, job_emotional, job_social, sort_order, created_by
    )
    SELECT
      v_new_project_id, name, persona_code, project_scope, tier_label,
      profile_summary, persona_status, friction_summary, pain_point_detail,
      job_functional, job_emotional, job_social, sort_order, creator_id
    FROM sttns_personas WHERE project_id = source_id AND archived_at IS NULL
    RETURNING id, persona_code
  )
  INSERT INTO persona_map (old_id, new_id)
  SELECT p.id, i.id FROM sttns_personas p JOIN inserted i ON p.persona_code = i.persona_code AND p.project_id = source_id;

  CREATE TEMP TABLE pp_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_persona_pain_points (persona_id, label, description, sort_order, client_key)
    SELECT pm.new_id, pp.label, pp.description, pp.sort_order, pp.client_key
    FROM sttns_persona_pain_points pp
    JOIN persona_map pm ON pp.persona_id = pm.old_id
    RETURNING id, client_key, persona_id
  )
  INSERT INTO pp_map (old_id, new_id)
  SELECT pp.id, i.id FROM sttns_persona_pain_points pp JOIN inserted i ON pp.client_key = i.client_key AND pp.persona_id = (SELECT old_id FROM persona_map WHERE new_id = i.persona_id);

  CREATE TEMP TABLE job_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_persona_jobs (persona_id, job_type, description, sort_order, client_key, resolved_pain_point_ids)
    SELECT
      pm.new_id, pj.job_type, pj.description, pj.sort_order, pj.client_key,
      COALESCE((SELECT array_agg(ppm.new_id) FROM unnest(pj.resolved_pain_point_ids) old_pp_id JOIN pp_map ppm ON old_pp_id = ppm.old_id), '{}')
    FROM sttns_persona_jobs pj
    JOIN persona_map pm ON pj.persona_id = pm.old_id
    RETURNING id, client_key, persona_id
  )
  INSERT INTO job_map (old_id, new_id)
  SELECT pj.id, i.id FROM sttns_persona_jobs pj JOIN inserted i ON pj.client_key = i.client_key AND pj.persona_id = (SELECT old_id FROM persona_map WHERE new_id = i.persona_id);

  -- A1 : epics.primary_persona_id → work_items ; pas de copie Spine → NULL
  CREATE TEMP TABLE epic_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_epics (
      project_id, title, objective, primary_persona_id, status, sort_order, created_by,
      target_tier_codes, impact_metric_root, success_kpi_target, delivery_horizon
    )
    SELECT
      v_new_project_id, title, objective, NULL, status, sort_order, creator_id,
      target_tier_codes, impact_metric_root, success_kpi_target, delivery_horizon
    FROM sttns_epics e
    WHERE e.project_id = source_id AND e.archived_at IS NULL
    RETURNING id, title
  )
  INSERT INTO epic_map (old_id, new_id)
  SELECT e.id, i.id FROM sttns_epics e JOIN inserted i ON e.title = i.title AND e.project_id = source_id;

  -- A1 : stories persona/JTBD → work_items ; pas de copie Spine → NULL
  CREATE TEMP TABLE story_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_user_stories (
      project_id, epic_id, title, context_label, primary_persona_id,
      impact_metric_id, impacts_north_star, impact_description, status,
      notes, sprint_want, sprint_so_that, sort_order, created_by, actions,
      target_persona_job_id
    )
    SELECT
      v_new_project_id, em.new_id, s.title, s.context_label, NULL,
      mm.new_id, s.impacts_north_star, s.impact_description, s.status,
      s.notes, s.sprint_want, s.sprint_so_that, s.sort_order, creator_id,
      s.actions, NULL
    FROM sttns_user_stories s
    LEFT JOIN epic_map em ON s.epic_id = em.old_id
    LEFT JOIN metric_map mm ON s.impact_metric_id = mm.old_id
    WHERE s.project_id = source_id AND s.archived_at IS NULL
    RETURNING id, title
  )
  INSERT INTO story_map (old_id, new_id)
  SELECT s.id, i.id FROM sttns_user_stories s JOIN inserted i ON s.title = i.title AND s.project_id = source_id;

  -- A1 : junction persona → work_items ; skip tant que Spine Why n'est pas dupliqué

  CREATE TEMP TABLE init_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_initiatives (
      project_id, epic_id, feature_code, feature_name, module, workflow_status,
      final_decision, pain_point, market_signal, pain_clear, nsm_link_clear,
      sensitive_domain, expert_required, phase1_status, ceo_final_phase1,
      ceo_final_phase2, ceo_final_comment, ceo_final_by, ceo_final_at,
      metric_id, metric_description, persona_id, user_story_id,
      pain_point_detail, market_proof, job_functional, job_emotional,
      job_social, user_story_persona, user_story_want, user_story_so_that,
      ost_opportunity, technical_solution, kano_type, kano_justification,
      projected_satisfaction_level, projected_functionality_level,
      rice_reach, rice_impact, rice_confidence, rice_effort, status,
      committee_notes, created_by, updated_by, version_type,
      execution_status, execution_sort_order, placement_reason_type,
      placement_comment, execution_assignee_id, execution_start_date,
      execution_due_date, execution_auto_deploy, execution_doc_url,
      execution_delivery_doc_url, execution_git_url, module_id
    )
    SELECT
      v_new_project_id, em.new_id, feature_code, feature_name, module, workflow_status,
      final_decision, pain_point, market_signal, pain_clear, nsm_link_clear,
      sensitive_domain, expert_required, phase1_status, ceo_final_phase1,
      ceo_final_phase2, ceo_final_comment, ceo_final_by, ceo_final_at,
      mm.new_id, metric_description, NULL, sm.new_id,
      pain_point_detail, market_proof, job_functional, job_emotional,
      job_social, user_story_persona, user_story_want, user_story_so_that,
      ost_opportunity, technical_solution, kano_type, kano_justification,
      projected_satisfaction_level, projected_functionality_level,
      rice_reach, rice_impact, rice_confidence, rice_effort, status,
      committee_notes, creator_id, creator_id, version_type,
      execution_status, execution_sort_order, placement_reason_type,
      placement_comment, execution_assignee_id, execution_start_date,
      execution_due_date, execution_auto_deploy, execution_doc_url,
      execution_delivery_doc_url, execution_git_url, mom.new_id
    FROM sttns_initiatives i
    LEFT JOIN epic_map em ON i.epic_id = em.old_id
    LEFT JOIN story_map sm ON i.user_story_id = sm.old_id
    LEFT JOIN metric_map mm ON i.metric_id = mm.old_id
    LEFT JOIN module_map mom ON i.module_id = mom.old_id
    WHERE i.project_id = source_id AND i.archived_at IS NULL
    RETURNING id, feature_name
  )
  INSERT INTO init_map (old_id, new_id)
  SELECT i.id, ins.id FROM sttns_initiatives i JOIN inserted ins ON i.feature_name = ins.feature_name AND i.project_id = source_id;

  UPDATE sttns_user_stories s
  SET initiative_id = im.new_id
  FROM story_map sm
  JOIN sttns_user_stories old_s ON sm.old_id = old_s.id
  JOIN init_map im ON old_s.initiative_id = im.old_id
  WHERE s.id = sm.new_id;

  CREATE TEMP TABLE task_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_initiative_tasks (project_id, initiative_id, title, status, assignee_id, due_date, start_date, doc_url, delivery_doc_url, git_url)
    SELECT v_new_project_id, im.new_id, title, status, assignee_id, due_date, start_date, doc_url, delivery_doc_url, git_url
    FROM sttns_initiative_tasks t
    JOIN init_map im ON t.initiative_id = im.old_id
    RETURNING id, title, initiative_id
  )
  INSERT INTO task_map (old_id, new_id)
  SELECT t.id, i.id FROM sttns_initiative_tasks t JOIN inserted i ON t.title = i.title AND t.initiative_id = (SELECT old_id FROM init_map WHERE new_id = i.initiative_id);

  INSERT INTO sttns_feature_links (project_id, initiative_id, title, url)
  SELECT v_new_project_id, im.new_id, title, url
  FROM sttns_feature_links l
  JOIN init_map im ON l.initiative_id = im.old_id;

  INSERT INTO sttns_peer_reviews (project_id, asset_type, asset_id, reviewer_id, content_verdict, horizon, phase1_suggestion, comment)
  SELECT
    v_new_project_id, asset_type,
    CASE
      WHEN asset_type = 'persona' THEN (SELECT new_id FROM persona_map WHERE old_id = asset_id)
      WHEN asset_type = 'user_story' THEN (SELECT new_id FROM story_map WHERE old_id = asset_id)
      WHEN asset_type = 'initiative' THEN (SELECT new_id FROM init_map WHERE old_id = asset_id)
      ELSE asset_id
    END,
    reviewer_id, content_verdict, horizon, phase1_suggestion, comment
  FROM sttns_peer_reviews WHERE project_id = source_id;

  INSERT INTO sttns_initiative_reviews (initiative_id, project_id, reviewer_id, reviewer_role, validation_step, decision, comment)
  SELECT im.new_id, v_new_project_id, reviewer_id, reviewer_role, validation_step, decision, comment
  FROM sttns_initiative_reviews r
  JOIN init_map im ON r.initiative_id = im.old_id;

  INSERT INTO sttns_user_tasks (project_id, user_id, task_type, asset_type, asset_id, title, status)
  SELECT
    v_new_project_id, user_id, task_type, asset_type,
    CASE
      WHEN asset_type = 'persona' THEN (SELECT new_id FROM persona_map WHERE old_id = asset_id)
      WHEN asset_type = 'user_story' THEN (SELECT new_id FROM story_map WHERE old_id = asset_id)
      WHEN asset_type = 'initiative' THEN (SELECT new_id FROM init_map WHERE old_id = asset_id)
      ELSE asset_id
    END,
    title, status
  FROM sttns_user_tasks WHERE project_id = source_id;

  CREATE TEMP TABLE proposal_map (old_id UUID, new_id UUID);
  WITH inserted AS (
    INSERT INTO sttns_initiative_execution_proposals (
      project_id, initiative_id, proposed_by, reviewed_by, old_sort_order,
      new_sort_order, target_index, reason_type, comment, ceo_comment,
      status, created_at, reviewed_at
    )
    SELECT
      v_new_project_id, im.new_id, proposed_by, reviewed_by, old_sort_order,
      new_sort_order, target_index, reason_type, comment, ceo_comment,
      status, created_at, reviewed_at
    FROM sttns_initiative_execution_proposals p
    JOIN init_map im ON p.initiative_id = im.old_id
    WHERE p.project_id = source_id
    RETURNING id, initiative_id
  )
  INSERT INTO proposal_map (old_id, new_id)
  SELECT p.id, i.id FROM sttns_initiative_execution_proposals p JOIN inserted i ON p.initiative_id = (SELECT old_id FROM init_map WHERE new_id = i.initiative_id);

  INSERT INTO sttns_initiative_execution_history (
    initiative_id, changed_by, old_sort_order, new_sort_order, reason_type,
    comment, created_at, event_kind, reviewed_by, ceo_comment, proposal_id
  )
  SELECT
    im.new_id, changed_by, old_sort_order, new_sort_order, reason_type,
    comment, created_at, event_kind, reviewed_by, ceo_comment, pm.new_id
  FROM sttns_initiative_execution_history h
  JOIN init_map im ON h.initiative_id = im.old_id
  LEFT JOIN proposal_map pm ON h.proposal_id = pm.old_id;

  INSERT INTO sttns_initiative_planning_history (
    project_id, initiative_id, task_id, changed_by, field_key, old_value, new_value, created_at
  )
  SELECT
    v_new_project_id, im.new_id, tm.new_id, changed_by, field_key, old_value, new_value, created_at
  FROM sttns_initiative_planning_history h
  JOIN init_map im ON h.initiative_id = im.old_id
  LEFT JOIN task_map tm ON h.task_id = tm.old_id;

  INSERT INTO sttns_project_settings_audit (project_id, changed_by, field_name, old_value, new_value, forced, created_at)
  SELECT v_new_project_id, changed_by, field_name, old_value, new_value, forced, created_at
  FROM sttns_project_settings_audit WHERE project_id = source_id;

  DROP TABLE module_map;
  DROP TABLE metric_map;
  DROP TABLE persona_map;
  DROP TABLE pp_map;
  DROP TABLE job_map;
  DROP TABLE epic_map;
  DROP TABLE story_map;
  DROP TABLE init_map;
  DROP TABLE task_map;
  DROP TABLE proposal_map;

  RETURN v_new_project_id;
END;
$$;


--
-- Name: sttns_guard_project_governance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_guard_project_governance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (
    NEW.validation_mode IS DISTINCT FROM OLD.validation_mode
    OR NEW.consensus_percent IS DISTINCT FROM OLD.consensus_percent
    OR NEW.auto_act_on_consensus IS DISTINCT FROM OLD.auto_act_on_consensus
    OR NEW.ceo_delegate_user_id IS DISTINCT FROM OLD.ceo_delegate_user_id
  ) AND NOT (
    sttns_is_platform_admin()
    OR sttns_project_member_has_role(NEW.id, ARRAY['ceo']::sttns_project_role[])
  ) THEN
    RAISE EXCEPTION 'Only platform admin or project CEO can change governance settings';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.sttns_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), '')
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.sttns_profiles.full_name),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'sttns_handle_new_user error: %', SQLERRM;
    RAISE;
END;
$$;


--
-- Name: sttns_is_platform_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_is_platform_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM sttns_profiles
    WHERE id = auth.uid() AND platform_role = 'admin'
  );
$$;


--
-- Name: sttns_is_project_ceo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_is_project_ceo(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT sttns_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM sttns_project_members
      WHERE project_id = p_project_id
        AND user_id = auth.uid()
        AND (role = 'ceo' OR project_role = 'ceo_admin')
    );
$$;


--
-- Name: FUNCTION sttns_is_project_ceo(p_project_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sttns_is_project_ceo(p_project_id uuid) IS 'True if caller is platform admin or has CEO role on the project.';


--
-- Name: sttns_is_project_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_is_project_member(p_project_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT sttns_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM sttns_project_members
      WHERE project_id = p_project_id AND user_id = auth.uid()
    );
$$;


--
-- Name: sttns_log_work_item_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_log_work_item_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO sttns_work_item_events (
    work_item_id, actor_id, event_type,
    field_name, new_value, payload
  ) VALUES (
    NEW.id, NEW.created_by, 'created',
    'type', NEW.type::text,
    jsonb_build_object(
      'title', NEW.title,
      'code', NEW.code,
      'parent_id', NEW.parent_id,
      'priority', NEW.priority
    )
  );
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sttns_log_work_item_created(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sttns_log_work_item_created() IS 'Audit création work item — SECURITY DEFINER pour bypass RLS sttns_work_item_events';


--
-- Name: sttns_on_review_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_on_review_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.sttns_advance_workflow(NEW.initiative_id);
  RETURN NEW;
END;
$$;


--
-- Name: sttns_profiles_apply_invites_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_profiles_apply_invites_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM sttns_apply_pending_invites(NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


--
-- Name: sttns_project_member_has_role(uuid, public.sttns_project_role[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_project_member_has_role(p_project_id uuid, p_roles public.sttns_project_role[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT sttns_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM sttns_project_members
      WHERE project_id = p_project_id
        AND user_id = auth.uid()
        AND role = ANY (p_roles)
    );
$$;


--
-- Name: sttns_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sttns_user_story_epic_matches_project(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_user_story_epic_matches_project() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.epic_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM sttns_epics e
    WHERE e.id = NEW.epic_id
      AND e.project_id = NEW.project_id
      AND e.archived_at IS NULL
  ) THEN
    RAISE EXCEPTION 'User story epic must belong to the same project.';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: sttns_validate_no_cycle(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_validate_no_cycle() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.tree_path IS NOT NULL AND NEW.tree_path != '' THEN
    IF NEW.tree_path LIKE '%' || NEW.id::text || '%' THEN
      RAISE EXCEPTION 'Cycle détecté dans tree_path';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_validate_parent_not_archived(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_validate_parent_not_archived() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  parent_archived TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.parent_id IS NOT DISTINCT FROM OLD.parent_id THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT archived_at INTO parent_archived
    FROM sttns_work_items
    WHERE id = NEW.parent_id;

    IF parent_archived IS NOT NULL THEN
      RAISE EXCEPTION 'Impossible de rattacher à un item archivé';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: sttns_validate_parent_type(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_validate_parent_type() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    expected_parent_type sttns_work_item_type;
    actual_parent_type sttns_work_item_type;
BEGIN
    CASE NEW.type
        WHEN 'epic' THEN expected_parent_type := NULL;
        WHEN 'feature' THEN expected_parent_type := 'epic';
        WHEN 'story' THEN expected_parent_type := 'feature';
        WHEN 'task' THEN expected_parent_type := 'story';
        WHEN 'persona' THEN expected_parent_type := NULL;
        WHEN 'job' THEN expected_parent_type := 'persona';
    END CASE;

    IF expected_parent_type IS NULL THEN
        IF NEW.parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Un % ne peut pas avoir de parent (Constitution Spine)', NEW.type;
        END IF;
    ELSE
        IF NEW.parent_id IS NULL THEN
            RAISE EXCEPTION 'Un % doit avoir un parent % (Constitution Spine)', NEW.type, expected_parent_type;
        END IF;

        SELECT type INTO actual_parent_type
        FROM sttns_work_items
        WHERE id = NEW.parent_id;

        IF actual_parent_type IS NULL THEN
            RAISE EXCEPTION 'Parent introuvable';
        END IF;

        IF actual_parent_type != expected_parent_type THEN
            RAISE EXCEPTION 'Parent invalide: attendu %, trouvé % (Constitution Spine)',
                expected_parent_type, actual_parent_type;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: sttns_validate_work_item_link_same_project(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_validate_work_item_link_same_project() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  src_project UUID;
  tgt_project UUID;
BEGIN
  SELECT project_id INTO src_project FROM sttns_work_items WHERE id = NEW.source_id;
  SELECT project_id INTO tgt_project FROM sttns_work_items WHERE id = NEW.target_id;

  IF src_project IS NULL OR tgt_project IS NULL THEN
    RAISE EXCEPTION 'source_id ou target_id introuvable.';
  END IF;

  IF src_project <> tgt_project THEN
    RAISE EXCEPTION 'source_id et target_id doivent appartenir au même project_id.';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: sttns_work_item_soft_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_work_item_soft_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type, field_name
    ) VALUES (
      NEW.id, NEW.updated_by, 'archived', 'archived_at'
    );
  ELSIF NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN
    INSERT INTO sttns_work_item_events (
      work_item_id, actor_id, event_type, field_name
    ) VALUES (
      NEW.id, NEW.updated_by, 'restored', 'archived_at'
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sttns_work_items_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sttns_work_items_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: sttns_context_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_context_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_item_id uuid NOT NULL,
    context_type public.sttns_context_type NOT NULL,
    context_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


--
-- Name: TABLE sttns_context_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_context_links IS 'Liens typés vers le contexte métier: persona, pain_point, job, metric';


--
-- Name: sttns_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    capacity_points integer DEFAULT 0,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_cycle_dates CHECK ((end_date >= start_date))
);


--
-- Name: TABLE sttns_cycles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_cycles IS 'Cycles de planning (sprints/itérations) pour la capacité d''équipe';


--
-- Name: COLUMN sttns_cycles.capacity_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_cycles.capacity_points IS 'Capacité totale en points d''effort pour ce cycle';


--
-- Name: COLUMN sttns_cycles.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_cycles.is_active IS 'Cycle actuellement actif (sprint en cours)';


--
-- Name: sttns_discovery_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_discovery_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    author text DEFAULT ''::text NOT NULL,
    comments text DEFAULT ''::text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sttns_discovery_drafts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_discovery_drafts IS 'Brouillons partagés du projet — JSON payload = Draft Manager (schemaVersion 1). owner_id = créateur (audit).';


--
-- Name: sttns_epics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_epics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    objective text,
    primary_persona_id uuid,
    status public.sttns_epic_status DEFAULT 'draft'::public.sttns_epic_status,
    sort_order integer DEFAULT 0,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    target_tier_codes text[] DEFAULT '{}'::text[] NOT NULL,
    impact_metric_root text,
    success_kpi_target text,
    delivery_horizon text,
    review_status public.sttns_review_status DEFAULT 'draft'::public.sttns_review_status,
    final_decision public.sttns_decision,
    ceo_final_phase2 public.sttns_decision,
    ceo_final_comment text,
    ceo_final_by uuid,
    ceo_final_at timestamp with time zone,
    CONSTRAINT sttns_epics_delivery_horizon_check CHECK (((delivery_horizon IS NULL) OR (delivery_horizon = ANY (ARRAY['now'::text, 'next'::text, 'future'::text])))),
    CONSTRAINT sttns_epics_impact_metric_root_check CHECK (((impact_metric_root IS NULL) OR (impact_metric_root = ANY (ARRAY['north_star'::text, 'breadth'::text, 'depth'::text, 'frequency'::text, 'efficiency'::text]))))
);


--
-- Name: COLUMN sttns_epics.primary_persona_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.primary_persona_id IS 'Persona Spine (sttns_work_items type=persona) — cache dérivé A1.';


--
-- Name: COLUMN sttns_epics.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.status IS 'Epic lifecycle: draft → ready (DoR) → in_progress → done. Archive via archived_at.';


--
-- Name: COLUMN sttns_epics.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.created_by IS 'Auteur du brouillon — seul lui (ou admin plateforme) peut modifier un epic en statut draft.';


--
-- Name: COLUMN sttns_epics.target_tier_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.target_tier_codes IS 'Tiers cibles (T1, T2, INVEST, AUDIT…) — multi-select depuis le référentiel projet.';


--
-- Name: COLUMN sttns_epics.impact_metric_root; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.impact_metric_root IS 'Pilier taxonomie impact : north_star | breadth | depth | frequency | efficiency.';


--
-- Name: COLUMN sttns_epics.success_kpi_target; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.success_kpi_target IS 'Seuil de succès chiffré (garde-fou anti sur-développement).';


--
-- Name: COLUMN sttns_epics.delivery_horizon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.delivery_horizon IS 'Horizon de livraison : now | next | future.';


--
-- Name: COLUMN sttns_epics.review_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_epics.review_status IS 'Gouvernance validation #3 — comité BUILD/LEARN/KILL puis CEO si requis.';


--
-- Name: sttns_feature_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_feature_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    initiative_id uuid NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sttns_initiative_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    actor_id uuid,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sttns_initiative_execution_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_execution_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    old_sort_order integer NOT NULL,
    new_sort_order integer NOT NULL,
    reason_type public.sttns_placement_reason_type NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_kind text DEFAULT 'applied'::text NOT NULL,
    reviewed_by uuid,
    ceo_comment text,
    proposal_id uuid
);


--
-- Name: COLUMN sttns_initiative_execution_history.event_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiative_execution_history.event_kind IS 'initial | applied | rejected';


--
-- Name: sttns_initiative_execution_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_execution_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    initiative_id uuid NOT NULL,
    proposed_by uuid NOT NULL,
    reviewed_by uuid,
    old_sort_order integer NOT NULL,
    new_sort_order integer NOT NULL,
    target_index integer NOT NULL,
    reason_type public.sttns_placement_reason_type NOT NULL,
    comment text NOT NULL,
    ceo_comment text,
    status public.sttns_execution_proposal_status DEFAULT 'pending'::public.sttns_execution_proposal_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone
);


--
-- Name: sttns_initiative_planning_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_planning_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    initiative_id uuid NOT NULL,
    task_id uuid,
    changed_by uuid,
    field_key text NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sttns_initiative_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    project_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewer_role public.sttns_project_role NOT NULL,
    validation_step public.sttns_validation_step NOT NULL,
    decision public.sttns_decision NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sttns_initiative_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiative_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    initiative_id uuid NOT NULL,
    title text NOT NULL,
    status public.sttns_initiative_task_status DEFAULT 'todo'::public.sttns_initiative_task_status NOT NULL,
    assignee_id uuid,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    doc_url text,
    delivery_doc_url text,
    git_url text,
    start_date date,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: COLUMN sttns_initiative_tasks.doc_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiative_tasks.doc_url IS 'Doc feature / spec pour cette partie.';


--
-- Name: COLUMN sttns_initiative_tasks.delivery_doc_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiative_tasks.delivery_doc_url IS 'Doc livraison (release notes) pour cette partie.';


--
-- Name: COLUMN sttns_initiative_tasks.git_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiative_tasks.git_url IS 'Lien Git (PR, branche) pour cette partie.';


--
-- Name: sttns_initiatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_initiatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    feature_code text,
    feature_name text NOT NULL,
    module public.sttns_module DEFAULT 'platform'::public.sttns_module,
    pain_point text,
    market_signal text,
    pain_clear boolean DEFAULT false,
    nsm_link_clear boolean DEFAULT false,
    sensitive_domain boolean DEFAULT false,
    expert_required boolean DEFAULT false,
    phase1_status text,
    metric_description text,
    persona text,
    pain_point_detail text,
    market_proof text,
    job_functional text,
    job_emotional text,
    job_social text,
    user_story_persona text,
    user_story_want text,
    user_story_so_that text,
    ost_opportunity text,
    kano_type public.sttns_kano_type,
    kano_justification text,
    rice_reach numeric,
    rice_impact numeric,
    rice_confidence numeric,
    rice_effort numeric,
    validation_method public.sttns_validation_method,
    validation_kpi text,
    empirical_test text,
    decision public.sttns_decision,
    status public.sttns_initiative_status DEFAULT 'draft'::public.sttns_initiative_status,
    committee_notes text,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    module_id uuid,
    workflow_status public.sttns_workflow_status DEFAULT 'draft'::public.sttns_workflow_status,
    final_decision public.sttns_decision,
    persona_id uuid,
    user_story_id uuid,
    metric_id uuid,
    review_status public.sttns_review_status DEFAULT 'draft'::public.sttns_review_status NOT NULL,
    ceo_final_phase1 text,
    ceo_final_phase2 public.sttns_decision,
    ceo_final_comment text,
    ceo_final_by uuid,
    ceo_final_at timestamp with time zone,
    epic_id uuid,
    archived_at timestamp with time zone,
    version_type public.sttns_initiative_version_type DEFAULT 'v1_mvp'::public.sttns_initiative_version_type NOT NULL,
    execution_status public.sttns_initiative_execution_status DEFAULT 'pending'::public.sttns_initiative_execution_status NOT NULL,
    technical_solution text,
    projected_satisfaction_level public.sttns_projected_satisfaction,
    projected_functionality_level public.sttns_projected_functionality,
    execution_sort_order integer DEFAULT 0 NOT NULL,
    placement_reason_type public.sttns_placement_reason_type,
    placement_comment text,
    execution_assignee_id uuid,
    execution_start_date date,
    execution_due_date date,
    execution_auto_deploy boolean DEFAULT false NOT NULL,
    execution_doc_url text,
    execution_delivery_doc_url text,
    execution_git_url text,
    release_id uuid,
    lifecycle_status text DEFAULT 'planned'::text NOT NULL,
    replaces_initiative_id uuid,
    rice_score numeric GENERATED ALWAYS AS (
CASE
    WHEN ((rice_effort IS NOT NULL) AND (rice_effort > (0)::numeric)) THEN ((((COALESCE(rice_reach, (0)::numeric) * COALESCE(rice_impact, (0)::numeric)) * (COALESCE(rice_confidence, (0)::numeric) / 10.0)) / rice_effort) * 10.0)
    ELSE NULL::numeric
END) STORED,
    CONSTRAINT sttns_initiatives_lifecycle_check CHECK ((lifecycle_status = ANY (ARRAY['planned'::text, 'live'::text, 'deprecated'::text])))
);


--
-- Name: COLUMN sttns_initiatives.persona_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.persona_id IS 'Persona Spine (sttns_work_items type=persona) — retarget Étape A3.';


--
-- Name: COLUMN sttns_initiatives.epic_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.epic_id IS 'Epic liée (optionnelle en brouillon ; requise à la soumission comité via DoR).';


--
-- Name: COLUMN sttns_initiatives.version_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.version_type IS 'v1_mvp = création de valeur rapide ; v2_consolidation = dette technique / scale.';


--
-- Name: COLUMN sttns_initiatives.execution_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_status IS 'Exécution tech BUILD : pending (backlog) → in_development → in_test → deployed.';


--
-- Name: COLUMN sttns_initiatives.technical_solution; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.technical_solution IS 'Architecture et specs techniques (Markdown, blocs ```mermaid). Requis avant soumission comité.';


--
-- Name: COLUMN sttns_initiatives.execution_sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_sort_order IS 'Ordre dans le backlog technique (pending). Plus petit = plus prioritaire.';


--
-- Name: COLUMN sttns_initiatives.placement_reason_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.placement_reason_type IS 'Dernière nature de placement lors du réordonnancement backlog.';


--
-- Name: COLUMN sttns_initiatives.placement_comment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.placement_comment IS 'Dernier commentaire justificatif de placement backlog.';


--
-- Name: COLUMN sttns_initiatives.execution_assignee_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_assignee_id IS 'Développeur ou responsable technique assigné à la feature BUILD.';


--
-- Name: COLUMN sttns_initiatives.execution_start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_start_date IS 'Date de début de développement planifiée ou actée.';


--
-- Name: COLUMN sttns_initiatives.execution_due_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_due_date IS 'Date cible de livraison / déploiement.';


--
-- Name: COLUMN sttns_initiatives.execution_auto_deploy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_auto_deploy IS 'Si true : passage automatique en déployé quand toutes les parties (sttns_initiative_tasks) sont done et la feature est en test.';


--
-- Name: COLUMN sttns_initiatives.execution_doc_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_doc_url IS 'Documentation produit / spec de la feature (Notion, Confluence…).';


--
-- Name: COLUMN sttns_initiatives.execution_delivery_doc_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_delivery_doc_url IS 'Doc de livraison : release notes, changelog, procédure de déploiement.';


--
-- Name: COLUMN sttns_initiatives.execution_git_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.execution_git_url IS 'Lien Git : dépôt, branche ou PR de la feature.';


--
-- Name: COLUMN sttns_initiatives.release_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.release_id IS 'NULL = backlog (pas encore affectée à une release).';


--
-- Name: COLUMN sttns_initiatives.lifecycle_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.lifecycle_status IS 'planned | live | deprecated — obsolescence solution.';


--
-- Name: COLUMN sttns_initiatives.replaces_initiative_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.replaces_initiative_id IS 'Chaîne MVP→V2 : nouvelle feature remplace l''ancienne.';


--
-- Name: COLUMN sttns_initiatives.rice_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_initiatives.rice_score IS 'Score RICE 0–1000 : (R×I×(C/10))/E×10. Seuil comité : ≥ 400.';


--
-- Name: sttns_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    archived_at timestamp with time zone
);


--
-- Name: sttns_peer_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_peer_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    asset_type public.sttns_asset_type NOT NULL,
    asset_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    content_verdict public.sttns_content_verdict,
    horizon public.sttns_horizon_opinion,
    phase1_suggestion text,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sttns_persona_job_type_defs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_persona_job_type_defs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    hint text,
    sort_order integer DEFAULT 0 NOT NULL,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE sttns_persona_job_type_defs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_persona_job_type_defs IS 'Project-scoped JTBD type dictionary (functional, social, custom…).';


--
-- Name: sttns_persona_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_persona_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    persona_id uuid NOT NULL,
    job_type text NOT NULL,
    description text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    client_key text,
    resolved_pain_point_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


--
-- Name: COLUMN sttns_persona_jobs.resolved_pain_point_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_persona_jobs.resolved_pain_point_ids IS 'UUIDs des pain points adressés par ce job — couverture anti-solutionnisme.';


--
-- Name: sttns_persona_pain_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_persona_pain_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    persona_id uuid NOT NULL,
    label text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    client_key text
);


--
-- Name: COLUMN sttns_persona_pain_points.client_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_persona_pain_points.client_key IS 'Clé stable côté formulaire (ex. pp-1) pour lier les JTBD avant persistance.';


--
-- Name: sttns_persona_tier_defs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_persona_tier_defs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE sttns_persona_tier_defs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_persona_tier_defs IS 'Project-scoped persona tier dictionary (T1–Tn), editable per project.';


--
-- Name: sttns_personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_personas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    tier_label text,
    profile_summary text,
    friction_summary text,
    pain_point_detail text,
    job_functional text,
    job_emotional text,
    job_social text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    review_status public.sttns_review_status DEFAULT 'draft'::public.sttns_review_status NOT NULL,
    created_by uuid,
    archived_at timestamp with time zone,
    avatar_url text,
    persona_status text DEFAULT 'DRAFT'::text NOT NULL,
    persona_code text,
    project_scope text DEFAULT 'active'::text NOT NULL,
    final_decision public.sttns_decision,
    ceo_final_phase2 public.sttns_decision,
    ceo_final_comment text,
    ceo_final_by uuid,
    ceo_final_at timestamp with time zone,
    CONSTRAINT sttns_personas_persona_status_check CHECK ((persona_status = ANY (ARRAY['DRAFT'::text, 'READY'::text]))),
    CONSTRAINT sttns_personas_project_scope_check CHECK ((project_scope = ANY (ARRAY['active'::text, 'reference'::text])))
);


--
-- Name: COLUMN sttns_personas.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_personas.avatar_url IS 'URL publique Supabase Storage (bucket persona-photos)';


--
-- Name: COLUMN sttns_personas.persona_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_personas.persona_status IS 'DRAFT = brouillon (couverture PP↔JTBD incomplète autorisée). READY = matrice couverte à 100 %.';


--
-- Name: COLUMN sttns_personas.persona_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_personas.persona_code IS 'Référence courte unique par projet (ex. P1, P6).';


--
-- Name: COLUMN sttns_personas.project_scope; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_personas.project_scope IS 'active = persona pilote du projet ; reference = fiche informatif / phase ultérieure.';


--
-- Name: sttns_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    platform_role public.sttns_platform_role DEFAULT 'user'::public.sttns_platform_role NOT NULL
);


--
-- Name: sttns_project_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_project_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    email text NOT NULL,
    roles text[] DEFAULT ARRAY['expert'::text] NOT NULL,
    invited_by uuid,
    user_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    squad_role public.sttns_squad_project_role DEFAULT 'editor'::public.sttns_squad_project_role NOT NULL,
    CONSTRAINT sttns_project_invites_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'cancelled'::text])))
);


--
-- Name: sttns_project_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_project_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.sttns_project_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    project_role public.sttns_squad_project_role DEFAULT 'editor'::public.sttns_squad_project_role NOT NULL
);


--
-- Name: COLUMN sttns_project_members.project_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_project_members.project_role IS 'Squad access: viewer (lecture), editor (écriture), ceo_admin (paramètres projet)';


--
-- Name: sttns_project_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_project_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    legacy_key public.sttns_input_metric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sttns_project_settings_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_project_settings_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    changed_by uuid NOT NULL,
    field_name text NOT NULL,
    old_value text,
    new_value text,
    forced boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sttns_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    nsm_label text NOT NULL,
    nsm_description text,
    created_at timestamp with time zone DEFAULT now(),
    description text,
    is_active boolean DEFAULT true,
    validation_mode public.sttns_validation_mode DEFAULT 'peer_ceo'::public.sttns_validation_mode NOT NULL,
    consensus_percent integer DEFAULT 100 NOT NULL,
    ceo_delegate_user_id uuid,
    auto_act_on_consensus boolean DEFAULT false NOT NULL,
    personas_cast_locked_at timestamp with time zone,
    personas_cast_locked_by uuid,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT sttns_projects_consensus_percent_check CHECK (((consensus_percent >= 1) AND (consensus_percent <= 100)))
);


--
-- Name: COLUMN sttns_projects.ceo_delegate_user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_projects.ceo_delegate_user_id IS 'Project-level delegate who may click CEO final validation (D1).';


--
-- Name: COLUMN sttns_projects.auto_act_on_consensus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_projects.auto_act_on_consensus IS 'When true, unanimous committee auto-acts the proposed decision. When false, CEO (or delegate) must finalize.';


--
-- Name: COLUMN sttns_projects.personas_cast_locked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_projects.personas_cast_locked_at IS 'Horodatage du verrouillage du casting personas (actif/référence). NULL = phase exploration.';


--
-- Name: COLUMN sttns_projects.personas_cast_locked_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_projects.personas_cast_locked_by IS 'Membre ayant validé le casting personas.';


--
-- Name: COLUMN sttns_projects.settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_projects.settings IS 'Gouvernance workflow: wipLimit, strictDoD, stagnationDays, defaultCycleWeeks';


--
-- Name: sttns_releases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_releases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    label text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    target_date date,
    notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sttns_releases_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'shipped'::text])))
);


--
-- Name: TABLE sttns_releases; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_releases IS 'Itérations produit (RL1, RL2…). Statuts TEXT extensibles via CHECK, pas ENUM PG.';


--
-- Name: sttns_user_stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_user_stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    status public.sttns_user_story_status DEFAULT 'proposed'::public.sttns_user_story_status,
    initiative_id uuid,
    notes text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    context_label text,
    impact_description text,
    sprint_want text,
    sprint_so_that text,
    impact_metric_id uuid,
    impacts_north_star boolean DEFAULT false NOT NULL,
    primary_persona_id uuid,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    review_status public.sttns_review_status DEFAULT 'draft'::public.sttns_review_status NOT NULL,
    created_by uuid,
    epic_id uuid,
    archived_at timestamp with time zone,
    target_persona_job_id uuid,
    final_decision public.sttns_decision,
    ceo_final_phase2 public.sttns_decision,
    ceo_final_comment text,
    ceo_final_by uuid,
    ceo_final_at timestamp with time zone
);


--
-- Name: COLUMN sttns_user_stories.primary_persona_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_user_stories.primary_persona_id IS 'Persona Spine (sttns_work_items type=persona) — Étape A1.';


--
-- Name: COLUMN sttns_user_stories.epic_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_user_stories.epic_id IS 'Epic liée (optionnelle en brouillon ; requise à la publication / soumission comité via DoR).';


--
-- Name: COLUMN sttns_user_stories.target_persona_job_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_user_stories.target_persona_job_id IS 'JTBD Spine (sttns_work_items type=job) — Étape A1.';


--
-- Name: sttns_user_story_personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_user_story_personas (
    user_story_id uuid NOT NULL,
    persona_id uuid NOT NULL
);


--
-- Name: sttns_user_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_user_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    task_type text NOT NULL,
    asset_type public.sttns_asset_type,
    asset_id uuid,
    title text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT sttns_user_tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'done'::text, 'cancelled'::text])))
);


--
-- Name: sttns_work_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_work_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    type public.sttns_work_item_type NOT NULL,
    parent_id uuid,
    status public.sttns_work_item_status DEFAULT 'todo'::public.sttns_work_item_status NOT NULL,
    assignee_id uuid,
    priority smallint DEFAULT 3 NOT NULL,
    title text NOT NULL,
    code text,
    sort_order integer DEFAULT 0 NOT NULL,
    tree_path text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    cycle_id uuid,
    effort_points integer DEFAULT 0,
    rice_reach numeric DEFAULT 0,
    rice_impact numeric DEFAULT 0,
    rice_confidence numeric DEFAULT 0,
    rice_effort numeric DEFAULT 0,
    rice_score numeric GENERATED ALWAYS AS (
CASE
    WHEN (rice_effort > (0)::numeric) THEN round((((rice_reach * rice_impact) * (rice_confidence / 100.0)) / rice_effort))
    ELSE (0)::numeric
END) STORED,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT check_epic_no_parent CHECK (((type <> 'epic'::public.sttns_work_item_type) OR (parent_id IS NULL))),
    CONSTRAINT sttns_work_items_effort_points_check CHECK ((effort_points >= 0)),
    CONSTRAINT sttns_work_items_priority_check CHECK (((priority >= 1) AND (priority <= 5))),
    CONSTRAINT sttns_work_items_rice_confidence_check CHECK (((rice_confidence >= (0)::numeric) AND (rice_confidence <= (100)::numeric))),
    CONSTRAINT sttns_work_items_rice_effort_check CHECK ((rice_effort >= (0)::numeric)),
    CONSTRAINT sttns_work_items_rice_impact_check CHECK ((rice_impact >= (0)::numeric)),
    CONSTRAINT sttns_work_items_rice_reach_check CHECK ((rice_reach >= (0)::numeric))
);


--
-- Name: TABLE sttns_work_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_work_items IS 'Table unique unifiée (Spine) pour Epic → Feature → Story → Task';


--
-- Name: COLUMN sttns_work_items.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.type IS 'Type de l''item: epic, feature, story, task. Détermine les contraintes de parenté.';


--
-- Name: COLUMN sttns_work_items.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.parent_id IS 'FK vers le parent dans la hiérarchie. Epic=NULL, Feature→Epic, Story→Feature, Task→Story';


--
-- Name: COLUMN sttns_work_items.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.code IS 'Code unique par projet: E1-*, F01-*, US-*, T-*';


--
-- Name: COLUMN sttns_work_items.tree_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.tree_path IS 'Chemin matérialisé pour requêtes hiérarchiques rapides (ex: epic_id/feature_id/story_id/)';


--
-- Name: COLUMN sttns_work_items.cycle_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.cycle_id IS 'Cycle de planification (uniquement pour les stories)';


--
-- Name: COLUMN sttns_work_items.effort_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.effort_points IS 'Points d''effort estimés (capacity planning)';


--
-- Name: COLUMN sttns_work_items.rice_reach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.rice_reach IS 'RICE: Nombre de personnes touchées par trimestre (×1000)';


--
-- Name: COLUMN sttns_work_items.rice_impact; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.rice_impact IS 'RICE: Impact par personne (0-3, multiplié par 100 pour stockage)';


--
-- Name: COLUMN sttns_work_items.rice_confidence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.rice_confidence IS 'RICE: Confiance en l''estimation (%)';


--
-- Name: COLUMN sttns_work_items.rice_effort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.rice_effort IS 'RICE: Effort en personnes-mois (×100 pour stockage)';


--
-- Name: COLUMN sttns_work_items.rice_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.rice_score IS 'RICE: (Reach × Impact × Confidence%) / Effort — confidence en pourcentage 1–100';


--
-- Name: COLUMN sttns_work_items.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sttns_work_items.metadata IS 'Payload Spine (description, impact, effort_days, complexity, spine_role, notion_url, doc_url, …)';


--
-- Name: sttns_work_item_children; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sttns_work_item_children WITH (security_invoker='true') AS
 SELECT wi.id,
    wi.project_id,
    wi.type,
    wi.parent_id,
    wi.status,
    wi.assignee_id,
    wi.priority,
    wi.title,
    wi.code,
    wi.sort_order,
    wi.tree_path,
    wi.created_at,
    wi.updated_at,
    wi.archived_at,
    wi.created_by,
    wi.updated_by,
    parent.type AS parent_type,
    parent.title AS parent_title
   FROM (public.sttns_work_items wi
     LEFT JOIN public.sttns_work_items parent ON ((wi.parent_id = parent.id)))
  WHERE (wi.archived_at IS NULL);


--
-- Name: VIEW sttns_work_item_children; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.sttns_work_item_children IS 'Enfants directs avec parent typé. security_invoker : RLS sttns_work_items appliquée à l''appelant.';


--
-- Name: sttns_work_item_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_work_item_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_item_id uuid NOT NULL,
    actor_id uuid,
    event_type public.sttns_work_item_event_type NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sttns_work_item_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_work_item_events IS 'Audit immuable de tous les changements sur les work items';


--
-- Name: sttns_work_item_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sttns_work_item_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    target_id uuid NOT NULL,
    type text DEFAULT 'solves'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT work_item_links_no_self CHECK ((source_id <> target_id))
);


--
-- Name: TABLE sttns_work_item_links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sttns_work_item_links IS 'Liens typés entre work items — ex: JTBD (source) résout Pain Point (target).';


--
-- Name: sttns_work_items_hierarchy; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sttns_work_items_hierarchy WITH (security_invoker='true') AS
 SELECT id,
    project_id,
    type,
    parent_id,
    status,
    assignee_id,
    priority,
    title,
    code,
    sort_order,
    tree_path,
    created_at,
    updated_at,
    archived_at,
    created_by,
    updated_by,
        CASE
            WHEN (tree_path = ''::text) THEN 0
            ELSE (length(tree_path) - length(replace(tree_path, '/'::text, ''::text)))
        END AS depth,
        CASE
            WHEN (tree_path = ''::text) THEN NULL::uuid
            ELSE (split_part(tree_path, '/'::text, 1))::uuid
        END AS root_epic_id
   FROM public.sttns_work_items wi
  WHERE (archived_at IS NULL);


--
-- Name: VIEW sttns_work_items_hierarchy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.sttns_work_items_hierarchy IS 'Hiérarchie work items (depth, root_epic_id). security_invoker : RLS sttns_work_items appliquée à l''appelant.';


--
-- Name: sttns_context_links sttns_context_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_context_links
    ADD CONSTRAINT sttns_context_links_pkey PRIMARY KEY (id);


--
-- Name: sttns_cycles sttns_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_cycles
    ADD CONSTRAINT sttns_cycles_pkey PRIMARY KEY (id);


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_discovery_drafts
    ADD CONSTRAINT sttns_discovery_drafts_pkey PRIMARY KEY (id);


--
-- Name: sttns_epics sttns_epics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_epics
    ADD CONSTRAINT sttns_epics_pkey PRIMARY KEY (id);


--
-- Name: sttns_feature_links sttns_feature_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_feature_links
    ADD CONSTRAINT sttns_feature_links_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_events sttns_initiative_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_events
    ADD CONSTRAINT sttns_initiative_events_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_history
    ADD CONSTRAINT sttns_initiative_execution_history_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_execution_proposals sttns_initiative_execution_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_proposals
    ADD CONSTRAINT sttns_initiative_execution_proposals_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_planning_history sttns_initiative_planning_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_planning_history
    ADD CONSTRAINT sttns_initiative_planning_history_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_reviews sttns_initiative_reviews_initiative_id_reviewer_id_validati_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_reviews
    ADD CONSTRAINT sttns_initiative_reviews_initiative_id_reviewer_id_validati_key UNIQUE (initiative_id, reviewer_id, validation_step);


--
-- Name: sttns_initiative_reviews sttns_initiative_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_reviews
    ADD CONSTRAINT sttns_initiative_reviews_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_tasks
    ADD CONSTRAINT sttns_initiative_tasks_pkey PRIMARY KEY (id);


--
-- Name: sttns_initiatives sttns_initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_pkey PRIMARY KEY (id);


--
-- Name: sttns_modules sttns_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_modules
    ADD CONSTRAINT sttns_modules_pkey PRIMARY KEY (id);


--
-- Name: sttns_modules sttns_modules_project_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_modules
    ADD CONSTRAINT sttns_modules_project_id_code_key UNIQUE (project_id, code);


--
-- Name: sttns_peer_reviews sttns_peer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_peer_reviews
    ADD CONSTRAINT sttns_peer_reviews_pkey PRIMARY KEY (id);


--
-- Name: sttns_peer_reviews sttns_peer_reviews_project_id_asset_type_asset_id_reviewer__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_peer_reviews
    ADD CONSTRAINT sttns_peer_reviews_project_id_asset_type_asset_id_reviewer__key UNIQUE (project_id, asset_type, asset_id, reviewer_id);


--
-- Name: sttns_persona_job_type_defs sttns_persona_job_type_defs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_job_type_defs
    ADD CONSTRAINT sttns_persona_job_type_defs_pkey PRIMARY KEY (id);


--
-- Name: sttns_persona_job_type_defs sttns_persona_job_type_defs_project_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_job_type_defs
    ADD CONSTRAINT sttns_persona_job_type_defs_project_id_code_key UNIQUE (project_id, code);


--
-- Name: sttns_persona_jobs sttns_persona_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_jobs
    ADD CONSTRAINT sttns_persona_jobs_pkey PRIMARY KEY (id);


--
-- Name: sttns_persona_pain_points sttns_persona_pain_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_pain_points
    ADD CONSTRAINT sttns_persona_pain_points_pkey PRIMARY KEY (id);


--
-- Name: sttns_persona_tier_defs sttns_persona_tier_defs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_tier_defs
    ADD CONSTRAINT sttns_persona_tier_defs_pkey PRIMARY KEY (id);


--
-- Name: sttns_persona_tier_defs sttns_persona_tier_defs_project_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_tier_defs
    ADD CONSTRAINT sttns_persona_tier_defs_project_id_code_key UNIQUE (project_id, code);


--
-- Name: sttns_personas sttns_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_personas
    ADD CONSTRAINT sttns_personas_pkey PRIMARY KEY (id);


--
-- Name: sttns_profiles sttns_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_profiles
    ADD CONSTRAINT sttns_profiles_pkey PRIMARY KEY (id);


--
-- Name: sttns_project_invites sttns_project_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_invites
    ADD CONSTRAINT sttns_project_invites_pkey PRIMARY KEY (id);


--
-- Name: sttns_project_members sttns_project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_members
    ADD CONSTRAINT sttns_project_members_pkey PRIMARY KEY (id);


--
-- Name: sttns_project_members sttns_project_members_project_id_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_members
    ADD CONSTRAINT sttns_project_members_project_id_user_id_role_key UNIQUE (project_id, user_id, role);


--
-- Name: sttns_project_metrics sttns_project_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_metrics
    ADD CONSTRAINT sttns_project_metrics_pkey PRIMARY KEY (id);


--
-- Name: sttns_project_settings_audit sttns_project_settings_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_settings_audit
    ADD CONSTRAINT sttns_project_settings_audit_pkey PRIMARY KEY (id);


--
-- Name: sttns_projects sttns_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_projects
    ADD CONSTRAINT sttns_projects_pkey PRIMARY KEY (id);


--
-- Name: sttns_projects sttns_projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_projects
    ADD CONSTRAINT sttns_projects_slug_key UNIQUE (slug);


--
-- Name: sttns_releases sttns_releases_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_releases
    ADD CONSTRAINT sttns_releases_label_unique UNIQUE (project_id, label);


--
-- Name: sttns_releases sttns_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_releases
    ADD CONSTRAINT sttns_releases_pkey PRIMARY KEY (id);


--
-- Name: sttns_user_stories sttns_user_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_pkey PRIMARY KEY (id);


--
-- Name: sttns_user_story_personas sttns_user_story_personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_story_personas
    ADD CONSTRAINT sttns_user_story_personas_pkey PRIMARY KEY (user_story_id, persona_id);


--
-- Name: sttns_user_tasks sttns_user_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_tasks
    ADD CONSTRAINT sttns_user_tasks_pkey PRIMARY KEY (id);


--
-- Name: sttns_work_item_events sttns_work_item_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_events
    ADD CONSTRAINT sttns_work_item_events_pkey PRIMARY KEY (id);


--
-- Name: sttns_work_item_links sttns_work_item_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_links
    ADD CONSTRAINT sttns_work_item_links_pkey PRIMARY KEY (id);


--
-- Name: sttns_work_items sttns_work_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT sttns_work_items_pkey PRIMARY KEY (id);


--
-- Name: sttns_work_items unique_code_per_project; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT unique_code_per_project UNIQUE (project_id, code);


--
-- Name: sttns_context_links unique_context_link; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_context_links
    ADD CONSTRAINT unique_context_link UNIQUE (work_item_id, context_type, context_id);


--
-- Name: sttns_work_item_links unique_work_item_link; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_links
    ADD CONSTRAINT unique_work_item_link UNIQUE (source_id, target_id, type);


--
-- Name: idx_context_links_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_context_links_context ON public.sttns_context_links USING btree (context_type, context_id);


--
-- Name: idx_context_links_work_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_context_links_work_item ON public.sttns_context_links USING btree (work_item_id);


--
-- Name: idx_cycles_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cycles_project ON public.sttns_cycles USING btree (project_id, is_active);


--
-- Name: idx_sttns_discovery_drafts_owner_project_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_discovery_drafts_owner_project_updated ON public.sttns_discovery_drafts USING btree (project_id, owner_id, updated_at DESC);


--
-- Name: idx_sttns_discovery_drafts_project_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_discovery_drafts_project_updated ON public.sttns_discovery_drafts USING btree (project_id, updated_at DESC);


--
-- Name: idx_sttns_epics_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_epics_project ON public.sttns_epics USING btree (project_id);


--
-- Name: idx_sttns_events_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_events_initiative ON public.sttns_initiative_events USING btree (initiative_id);


--
-- Name: idx_sttns_execution_proposals_one_pending_per_project; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sttns_execution_proposals_one_pending_per_project ON public.sttns_initiative_execution_proposals USING btree (project_id) WHERE (status = 'pending'::public.sttns_execution_proposal_status);


--
-- Name: idx_sttns_execution_proposals_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_execution_proposals_project ON public.sttns_initiative_execution_proposals USING btree (project_id, status, created_at DESC);


--
-- Name: idx_sttns_feature_links_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_feature_links_initiative ON public.sttns_feature_links USING btree (initiative_id);


--
-- Name: idx_sttns_initiative_execution_history_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiative_execution_history_initiative ON public.sttns_initiative_execution_history USING btree (initiative_id, created_at DESC);


--
-- Name: idx_sttns_initiative_tasks_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiative_tasks_initiative ON public.sttns_initiative_tasks USING btree (initiative_id);


--
-- Name: idx_sttns_initiative_tasks_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiative_tasks_project ON public.sttns_initiative_tasks USING btree (project_id);


--
-- Name: idx_sttns_initiative_tasks_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiative_tasks_sort ON public.sttns_initiative_tasks USING btree (initiative_id, sort_order);


--
-- Name: idx_sttns_initiatives_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_archived_at ON public.sttns_initiatives USING btree (archived_at);


--
-- Name: idx_sttns_initiatives_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_decision ON public.sttns_initiatives USING btree (decision);


--
-- Name: idx_sttns_initiatives_execution_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_execution_assignee ON public.sttns_initiatives USING btree (project_id, execution_assignee_id) WHERE (archived_at IS NULL);


--
-- Name: idx_sttns_initiatives_execution_backlog; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_execution_backlog ON public.sttns_initiatives USING btree (project_id, execution_status, execution_sort_order) WHERE (archived_at IS NULL);


--
-- Name: idx_sttns_initiatives_lifecycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_lifecycle ON public.sttns_initiatives USING btree (project_id, lifecycle_status);


--
-- Name: idx_sttns_initiatives_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_persona ON public.sttns_initiatives USING btree (persona_id);


--
-- Name: idx_sttns_initiatives_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_project ON public.sttns_initiatives USING btree (project_id);


--
-- Name: idx_sttns_initiatives_release; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_release ON public.sttns_initiatives USING btree (release_id);


--
-- Name: idx_sttns_initiatives_replaces; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_replaces ON public.sttns_initiatives USING btree (replaces_initiative_id);


--
-- Name: idx_sttns_initiatives_rice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_rice ON public.sttns_initiatives USING btree (rice_score DESC NULLS LAST);


--
-- Name: idx_sttns_initiatives_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_status ON public.sttns_initiatives USING btree (status);


--
-- Name: idx_sttns_initiatives_user_story; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_initiatives_user_story ON public.sttns_initiatives USING btree (user_story_id);


--
-- Name: idx_sttns_members_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_members_project ON public.sttns_project_members USING btree (project_id);


--
-- Name: idx_sttns_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_members_user ON public.sttns_project_members USING btree (user_id);


--
-- Name: idx_sttns_modules_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_modules_archived_at ON public.sttns_modules USING btree (archived_at);


--
-- Name: idx_sttns_modules_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_modules_project ON public.sttns_modules USING btree (project_id);


--
-- Name: idx_sttns_peer_reviews_asset; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_peer_reviews_asset ON public.sttns_peer_reviews USING btree (project_id, asset_type, asset_id);


--
-- Name: idx_sttns_persona_job_type_defs_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_job_type_defs_project ON public.sttns_persona_job_type_defs USING btree (project_id, sort_order);


--
-- Name: idx_sttns_persona_jobs_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_jobs_persona ON public.sttns_persona_jobs USING btree (persona_id);


--
-- Name: idx_sttns_persona_jobs_resolved_pains; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_jobs_resolved_pains ON public.sttns_persona_jobs USING gin (resolved_pain_point_ids);


--
-- Name: idx_sttns_persona_jobs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_jobs_type ON public.sttns_persona_jobs USING btree (persona_id, job_type);


--
-- Name: idx_sttns_persona_pain_points_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_pain_points_persona ON public.sttns_persona_pain_points USING btree (persona_id);


--
-- Name: idx_sttns_persona_tier_defs_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_persona_tier_defs_project ON public.sttns_persona_tier_defs USING btree (project_id, sort_order);


--
-- Name: idx_sttns_personas_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_personas_archived_at ON public.sttns_personas USING btree (archived_at);


--
-- Name: idx_sttns_personas_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_personas_project ON public.sttns_personas USING btree (project_id);


--
-- Name: idx_sttns_personas_project_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sttns_personas_project_code ON public.sttns_personas USING btree (project_id, upper(persona_code)) WHERE ((persona_code IS NOT NULL) AND (archived_at IS NULL));


--
-- Name: idx_sttns_planning_history_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_planning_history_initiative ON public.sttns_initiative_planning_history USING btree (initiative_id, created_at DESC);


--
-- Name: idx_sttns_planning_history_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_planning_history_project ON public.sttns_initiative_planning_history USING btree (project_id);


--
-- Name: idx_sttns_project_invites_email_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_project_invites_email_pending ON public.sttns_project_invites USING btree (lower(email), status) WHERE (status = 'pending'::text);


--
-- Name: idx_sttns_project_invites_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_project_invites_project ON public.sttns_project_invites USING btree (project_id, status);


--
-- Name: idx_sttns_releases_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_releases_project ON public.sttns_releases USING btree (project_id);


--
-- Name: idx_sttns_releases_project_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_releases_project_status ON public.sttns_releases USING btree (project_id, status);


--
-- Name: idx_sttns_reviews_initiative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_reviews_initiative ON public.sttns_initiative_reviews USING btree (initiative_id);


--
-- Name: idx_sttns_user_stories_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_user_stories_archived_at ON public.sttns_user_stories USING btree (archived_at);


--
-- Name: idx_sttns_user_stories_epic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_user_stories_epic ON public.sttns_user_stories USING btree (epic_id);


--
-- Name: idx_sttns_user_stories_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_user_stories_project ON public.sttns_user_stories USING btree (project_id);


--
-- Name: idx_sttns_user_stories_target_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_user_stories_target_job ON public.sttns_user_stories USING btree (target_persona_job_id);


--
-- Name: idx_sttns_user_tasks_open_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sttns_user_tasks_open_unique ON public.sttns_user_tasks USING btree (user_id, task_type, asset_type, asset_id) WHERE ((status = 'open'::text) AND (asset_id IS NOT NULL));


--
-- Name: idx_sttns_user_tasks_user_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_user_tasks_user_open ON public.sttns_user_tasks USING btree (user_id, status) WHERE (status = 'open'::text);


--
-- Name: idx_sttns_usp_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sttns_usp_persona ON public.sttns_user_story_personas USING btree (persona_id);


--
-- Name: idx_work_item_events_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_events_actor ON public.sttns_work_item_events USING btree (actor_id, created_at DESC);


--
-- Name: idx_work_item_events_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_events_item ON public.sttns_work_item_events USING btree (work_item_id, created_at DESC);


--
-- Name: idx_work_item_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_events_type ON public.sttns_work_item_events USING btree (event_type, created_at DESC);


--
-- Name: idx_work_item_links_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_links_source ON public.sttns_work_item_links USING btree (source_id);


--
-- Name: idx_work_item_links_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_links_target ON public.sttns_work_item_links USING btree (target_id);


--
-- Name: idx_work_item_links_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_item_links_type ON public.sttns_work_item_links USING btree (type);


--
-- Name: idx_work_items_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_assignee ON public.sttns_work_items USING btree (assignee_id) WHERE ((assignee_id IS NOT NULL) AND (archived_at IS NULL));


--
-- Name: idx_work_items_cycle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_cycle ON public.sttns_work_items USING btree (cycle_id) WHERE ((cycle_id IS NOT NULL) AND (archived_at IS NULL));


--
-- Name: idx_work_items_jobs_by_persona; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_jobs_by_persona ON public.sttns_work_items USING btree (parent_id, type) WHERE ((type = 'job'::public.sttns_work_item_type) AND (archived_at IS NULL));


--
-- Name: INDEX idx_work_items_jobs_by_persona; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_work_items_jobs_by_persona IS 'Optimise la récupération des JTBD par persona (Constitution: héritage forcé)';


--
-- Name: idx_work_items_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_parent ON public.sttns_work_items USING btree (parent_id) WHERE ((parent_id IS NOT NULL) AND (archived_at IS NULL));


--
-- Name: idx_work_items_personas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_personas ON public.sttns_work_items USING btree (project_id, type) WHERE ((type = 'persona'::public.sttns_work_item_type) AND (archived_at IS NULL));


--
-- Name: INDEX idx_work_items_personas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_work_items_personas IS 'Optimise la récupération des personas actifs par projet';


--
-- Name: idx_work_items_project_list; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_project_list ON public.sttns_work_items USING btree (project_id, type, status, sort_order) WHERE (archived_at IS NULL);


--
-- Name: idx_work_items_rice_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_rice_score ON public.sttns_work_items USING btree (rice_score DESC) WHERE ((rice_score > (0)::numeric) AND (archived_at IS NULL));


--
-- Name: idx_work_items_tree_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_items_tree_path ON public.sttns_work_items USING btree (tree_path);


--
-- Name: sttns_project_metrics_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sttns_project_metrics_parent_idx ON public.sttns_project_metrics USING btree (parent_id);


--
-- Name: sttns_project_metrics_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sttns_project_metrics_project_idx ON public.sttns_project_metrics USING btree (project_id, sort_order);


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_initiative_tasks_updated_at BEFORE UPDATE ON public.sttns_initiative_tasks FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_initiatives sttns_initiatives_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_initiatives_updated_at BEFORE UPDATE ON public.sttns_initiatives FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_peer_reviews sttns_peer_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_peer_reviews_updated_at BEFORE UPDATE ON public.sttns_peer_reviews FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_personas sttns_personas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_personas_updated_at BEFORE UPDATE ON public.sttns_personas FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_profiles sttns_profiles_apply_invites; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_profiles_apply_invites AFTER INSERT OR UPDATE OF email ON public.sttns_profiles FOR EACH ROW WHEN ((new.email IS NOT NULL)) EXECUTE FUNCTION public.sttns_profiles_apply_invites_trigger();


--
-- Name: sttns_profiles sttns_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_profiles_updated_at BEFORE UPDATE ON public.sttns_profiles FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_project_metrics sttns_project_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_project_metrics_updated_at BEFORE UPDATE ON public.sttns_project_metrics FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_projects sttns_projects_governance_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_projects_governance_guard BEFORE UPDATE ON public.sttns_projects FOR EACH ROW EXECUTE FUNCTION public.sttns_guard_project_governance();


--
-- Name: sttns_initiative_reviews sttns_review_advance_workflow; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_review_advance_workflow AFTER INSERT OR UPDATE ON public.sttns_initiative_reviews FOR EACH ROW EXECUTE FUNCTION public.sttns_on_review_insert();


--
-- Name: sttns_user_stories sttns_user_stories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_user_stories_updated_at BEFORE UPDATE ON public.sttns_user_stories FOR EACH ROW EXECUTE FUNCTION public.sttns_set_updated_at();


--
-- Name: sttns_user_stories sttns_user_story_epic_matches_project; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sttns_user_story_epic_matches_project BEFORE INSERT OR UPDATE OF epic_id, project_id ON public.sttns_user_stories FOR EACH ROW EXECUTE FUNCTION public.sttns_user_story_epic_matches_project();


--
-- Name: sttns_work_items trigger_audit_assignee_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_assignee_change AFTER UPDATE OF assignee_id ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_assignee_change();


--
-- Name: sttns_work_items trigger_audit_parent_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_parent_change AFTER UPDATE OF parent_id ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_parent_change();


--
-- Name: sttns_work_items trigger_audit_priority_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_priority_change AFTER UPDATE OF priority ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_priority_change();


--
-- Name: sttns_work_items trigger_audit_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_status_change AFTER UPDATE OF status ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_status_change();


--
-- Name: sttns_work_item_links trigger_audit_work_item_link_added; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_work_item_link_added AFTER INSERT ON public.sttns_work_item_links FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_work_item_link_added();


--
-- Name: sttns_work_item_links trigger_audit_work_item_link_removed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_work_item_link_removed AFTER DELETE ON public.sttns_work_item_links FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_work_item_link_removed();


--
-- Name: sttns_work_items trigger_audit_work_item_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_work_item_updated AFTER UPDATE ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_audit_work_item_updated();


--
-- Name: sttns_work_items trigger_validate_no_cycle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validate_no_cycle BEFORE INSERT OR UPDATE OF tree_path ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_validate_no_cycle();


--
-- Name: sttns_work_items trigger_validate_parent_not_archived; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validate_parent_not_archived BEFORE INSERT OR UPDATE OF parent_id ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_validate_parent_not_archived();


--
-- Name: sttns_work_items trigger_validate_parent_type; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validate_parent_type BEFORE INSERT OR UPDATE OF parent_id ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_validate_parent_type();


--
-- Name: sttns_work_item_links trigger_validate_work_item_link_project; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_validate_work_item_link_project BEFORE INSERT OR UPDATE OF source_id, target_id ON public.sttns_work_item_links FOR EACH ROW EXECUTE FUNCTION public.sttns_validate_work_item_link_same_project();


--
-- Name: sttns_work_items trigger_work_item_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_work_item_created AFTER INSERT ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_log_work_item_created();


--
-- Name: sttns_work_items trigger_work_item_soft_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_work_item_soft_delete AFTER UPDATE OF archived_at ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_work_item_soft_delete();


--
-- Name: sttns_work_items trigger_work_items_calc_tree_path; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_work_items_calc_tree_path BEFORE INSERT OR UPDATE OF parent_id ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_calculate_tree_path();


--
-- Name: sttns_work_items trigger_work_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_work_items_updated_at BEFORE UPDATE ON public.sttns_work_items FOR EACH ROW EXECUTE FUNCTION public.sttns_work_items_set_updated_at();


--
-- Name: sttns_context_links sttns_context_links_work_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_context_links
    ADD CONSTRAINT sttns_context_links_work_item_id_fkey FOREIGN KEY (work_item_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_cycles sttns_cycles_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_cycles
    ADD CONSTRAINT sttns_cycles_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_discovery_drafts
    ADD CONSTRAINT sttns_discovery_drafts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.sttns_profiles(id) ON DELETE CASCADE;


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_discovery_drafts
    ADD CONSTRAINT sttns_discovery_drafts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_epics sttns_epics_ceo_final_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_epics
    ADD CONSTRAINT sttns_epics_ceo_final_by_fkey FOREIGN KEY (ceo_final_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sttns_epics sttns_epics_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_epics
    ADD CONSTRAINT sttns_epics_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_epics sttns_epics_primary_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_epics
    ADD CONSTRAINT sttns_epics_primary_persona_id_fkey FOREIGN KEY (primary_persona_id) REFERENCES public.sttns_work_items(id) ON DELETE SET NULL;


--
-- Name: sttns_epics sttns_epics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_epics
    ADD CONSTRAINT sttns_epics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_feature_links sttns_feature_links_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_feature_links
    ADD CONSTRAINT sttns_feature_links_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_feature_links sttns_feature_links_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_feature_links
    ADD CONSTRAINT sttns_feature_links_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_events sttns_initiative_events_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_events
    ADD CONSTRAINT sttns_initiative_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_events sttns_initiative_events_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_events
    ADD CONSTRAINT sttns_initiative_events_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_history
    ADD CONSTRAINT sttns_initiative_execution_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.sttns_profiles(id) ON DELETE RESTRICT;


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_history
    ADD CONSTRAINT sttns_initiative_execution_history_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_history
    ADD CONSTRAINT sttns_initiative_execution_history_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.sttns_initiative_execution_proposals(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_history
    ADD CONSTRAINT sttns_initiative_execution_history_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_execution_proposals sttns_initiative_execution_proposals_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_proposals
    ADD CONSTRAINT sttns_initiative_execution_proposals_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_execution_proposals sttns_initiative_execution_proposals_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_proposals
    ADD CONSTRAINT sttns_initiative_execution_proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_execution_proposals sttns_initiative_execution_proposals_proposed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_proposals
    ADD CONSTRAINT sttns_initiative_execution_proposals_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES public.sttns_profiles(id) ON DELETE RESTRICT;


--
-- Name: sttns_initiative_execution_proposals sttns_initiative_execution_proposals_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_execution_proposals
    ADD CONSTRAINT sttns_initiative_execution_proposals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_planning_history sttns_initiative_planning_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_planning_history
    ADD CONSTRAINT sttns_initiative_planning_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_planning_history sttns_initiative_planning_history_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_planning_history
    ADD CONSTRAINT sttns_initiative_planning_history_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_planning_history sttns_initiative_planning_history_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_planning_history
    ADD CONSTRAINT sttns_initiative_planning_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_planning_history sttns_initiative_planning_history_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_planning_history
    ADD CONSTRAINT sttns_initiative_planning_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.sttns_initiative_tasks(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_reviews sttns_initiative_reviews_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_reviews
    ADD CONSTRAINT sttns_initiative_reviews_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_reviews sttns_initiative_reviews_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_reviews
    ADD CONSTRAINT sttns_initiative_reviews_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_reviews sttns_initiative_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_reviews
    ADD CONSTRAINT sttns_initiative_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.sttns_profiles(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_tasks
    ADD CONSTRAINT sttns_initiative_tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_tasks
    ADD CONSTRAINT sttns_initiative_tasks_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE CASCADE;


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiative_tasks
    ADD CONSTRAINT sttns_initiative_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiatives sttns_initiatives_ceo_final_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_ceo_final_by_fkey FOREIGN KEY (ceo_final_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_epic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_epic_id_fkey FOREIGN KEY (epic_id) REFERENCES public.sttns_epics(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_execution_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_execution_assignee_id_fkey FOREIGN KEY (execution_assignee_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_metric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES public.sttns_project_metrics(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.sttns_modules(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.sttns_work_items(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_initiatives sttns_initiatives_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_release_id_fkey FOREIGN KEY (release_id) REFERENCES public.sttns_releases(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_replaces_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_replaces_initiative_id_fkey FOREIGN KEY (replaces_initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_initiatives sttns_initiatives_user_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_initiatives
    ADD CONSTRAINT sttns_initiatives_user_story_id_fkey FOREIGN KEY (user_story_id) REFERENCES public.sttns_user_stories(id) ON DELETE SET NULL;


--
-- Name: sttns_modules sttns_modules_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_modules
    ADD CONSTRAINT sttns_modules_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_peer_reviews sttns_peer_reviews_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_peer_reviews
    ADD CONSTRAINT sttns_peer_reviews_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_peer_reviews sttns_peer_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_peer_reviews
    ADD CONSTRAINT sttns_peer_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.sttns_profiles(id) ON DELETE CASCADE;


--
-- Name: sttns_persona_job_type_defs sttns_persona_job_type_defs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_job_type_defs
    ADD CONSTRAINT sttns_persona_job_type_defs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_persona_jobs sttns_persona_jobs_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_jobs
    ADD CONSTRAINT sttns_persona_jobs_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.sttns_personas(id) ON DELETE CASCADE;


--
-- Name: sttns_persona_pain_points sttns_persona_pain_points_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_pain_points
    ADD CONSTRAINT sttns_persona_pain_points_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.sttns_personas(id) ON DELETE CASCADE;


--
-- Name: sttns_persona_tier_defs sttns_persona_tier_defs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_persona_tier_defs
    ADD CONSTRAINT sttns_persona_tier_defs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_personas sttns_personas_ceo_final_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_personas
    ADD CONSTRAINT sttns_personas_ceo_final_by_fkey FOREIGN KEY (ceo_final_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sttns_personas sttns_personas_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_personas
    ADD CONSTRAINT sttns_personas_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_personas sttns_personas_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_personas
    ADD CONSTRAINT sttns_personas_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_profiles sttns_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_profiles
    ADD CONSTRAINT sttns_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sttns_project_invites sttns_project_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_invites
    ADD CONSTRAINT sttns_project_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_project_invites sttns_project_invites_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_invites
    ADD CONSTRAINT sttns_project_invites_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_project_invites sttns_project_invites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_invites
    ADD CONSTRAINT sttns_project_invites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_project_members sttns_project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_members
    ADD CONSTRAINT sttns_project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_project_members sttns_project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_members
    ADD CONSTRAINT sttns_project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sttns_profiles(id) ON DELETE CASCADE;


--
-- Name: sttns_project_metrics sttns_project_metrics_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_metrics
    ADD CONSTRAINT sttns_project_metrics_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sttns_project_metrics(id) ON DELETE CASCADE;


--
-- Name: sttns_project_metrics sttns_project_metrics_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_metrics
    ADD CONSTRAINT sttns_project_metrics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_project_settings_audit sttns_project_settings_audit_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_settings_audit
    ADD CONSTRAINT sttns_project_settings_audit_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.sttns_profiles(id);


--
-- Name: sttns_project_settings_audit sttns_project_settings_audit_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_project_settings_audit
    ADD CONSTRAINT sttns_project_settings_audit_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_projects sttns_projects_ceo_delegate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_projects
    ADD CONSTRAINT sttns_projects_ceo_delegate_user_id_fkey FOREIGN KEY (ceo_delegate_user_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_projects sttns_projects_personas_cast_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_projects
    ADD CONSTRAINT sttns_projects_personas_cast_locked_by_fkey FOREIGN KEY (personas_cast_locked_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_releases sttns_releases_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_releases
    ADD CONSTRAINT sttns_releases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_user_stories sttns_user_stories_ceo_final_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_ceo_final_by_fkey FOREIGN KEY (ceo_final_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_epic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_epic_id_fkey FOREIGN KEY (epic_id) REFERENCES public.sttns_epics(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_impact_metric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_impact_metric_id_fkey FOREIGN KEY (impact_metric_id) REFERENCES public.sttns_project_metrics(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.sttns_initiatives(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_primary_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_primary_persona_id_fkey FOREIGN KEY (primary_persona_id) REFERENCES public.sttns_work_items(id) ON DELETE SET NULL;


--
-- Name: sttns_user_stories sttns_user_stories_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_user_stories sttns_user_stories_target_persona_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_stories
    ADD CONSTRAINT sttns_user_stories_target_persona_job_id_fkey FOREIGN KEY (target_persona_job_id) REFERENCES public.sttns_work_items(id) ON DELETE SET NULL;


--
-- Name: sttns_user_story_personas sttns_user_story_personas_persona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_story_personas
    ADD CONSTRAINT sttns_user_story_personas_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_user_story_personas sttns_user_story_personas_user_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_story_personas
    ADD CONSTRAINT sttns_user_story_personas_user_story_id_fkey FOREIGN KEY (user_story_id) REFERENCES public.sttns_user_stories(id) ON DELETE CASCADE;


--
-- Name: sttns_user_tasks sttns_user_tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_tasks
    ADD CONSTRAINT sttns_user_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_user_tasks sttns_user_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_user_tasks
    ADD CONSTRAINT sttns_user_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.sttns_profiles(id) ON DELETE CASCADE;


--
-- Name: sttns_work_item_events sttns_work_item_events_work_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_events
    ADD CONSTRAINT sttns_work_item_events_work_item_id_fkey FOREIGN KEY (work_item_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_work_item_links sttns_work_item_links_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_links
    ADD CONSTRAINT sttns_work_item_links_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_work_item_links sttns_work_item_links_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_item_links
    ADD CONSTRAINT sttns_work_item_links_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_work_items sttns_work_items_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT sttns_work_items_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.sttns_profiles(id) ON DELETE SET NULL;


--
-- Name: sttns_work_items sttns_work_items_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT sttns_work_items_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.sttns_cycles(id) ON DELETE SET NULL;


--
-- Name: sttns_work_items sttns_work_items_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT sttns_work_items_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.sttns_work_items(id) ON DELETE CASCADE;


--
-- Name: sttns_work_items sttns_work_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sttns_work_items
    ADD CONSTRAINT sttns_work_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.sttns_projects(id) ON DELETE CASCADE;


--
-- Name: sttns_cycles Allow INSERT for project members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow INSERT for project members" ON public.sttns_cycles FOR INSERT TO authenticated WITH CHECK ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_context_links context_links_select_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY context_links_select_project_members ON public.sttns_context_links FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_context_links.work_item_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_context_links context_links_write_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY context_links_write_project_members ON public.sttns_context_links TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_context_links.work_item_id) AND (pm.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_context_links.work_item_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_context_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_context_links ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_cycles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_cycles ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_cycles sttns_cycles_delete_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_cycles_delete_project_members ON public.sttns_cycles FOR DELETE TO authenticated USING ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_cycles sttns_cycles_select_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_cycles_select_project_members ON public.sttns_cycles FOR SELECT TO authenticated USING ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_cycles sttns_cycles_update_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_cycles_update_project_members ON public.sttns_cycles FOR UPDATE TO authenticated USING ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin())) WITH CHECK ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_discovery_drafts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_discovery_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_discovery_drafts_delete ON public.sttns_discovery_drafts FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_discovery_drafts_insert ON public.sttns_discovery_drafts FOR INSERT TO authenticated WITH CHECK (((owner_id = auth.uid()) AND public.sttns_is_project_member(project_id)));


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_discovery_drafts_select ON public.sttns_discovery_drafts FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_discovery_drafts sttns_discovery_drafts_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_discovery_drafts_update ON public.sttns_discovery_drafts FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_epics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_epics ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_epics sttns_epics_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_epics_delete ON public.sttns_epics FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_epics sttns_epics_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_epics_insert ON public.sttns_epics FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_epics sttns_epics_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_epics_select ON public.sttns_epics FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_epics sttns_epics_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_epics_update ON public.sttns_epics FOR UPDATE TO authenticated USING ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (status <> 'draft'::public.sttns_epic_status) OR (created_by IS NULL) OR (created_by = auth.uid())))) WITH CHECK ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (status <> 'draft'::public.sttns_epic_status) OR (created_by IS NULL) OR (created_by = auth.uid()))));


--
-- Name: sttns_initiative_events sttns_events_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_events_insert ON public.sttns_initiative_events FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sttns_initiatives i
  WHERE ((i.id = sttns_initiative_events.initiative_id) AND public.sttns_is_project_member(i.project_id)))));


--
-- Name: sttns_initiative_events sttns_events_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_events_select ON public.sttns_initiative_events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_initiatives i
  WHERE ((i.id = sttns_initiative_events.initiative_id) AND public.sttns_is_project_member(i.project_id)))));


--
-- Name: sttns_initiative_execution_proposals sttns_execution_proposals_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_execution_proposals_insert ON public.sttns_initiative_execution_proposals FOR INSERT TO authenticated WITH CHECK (((proposed_by = auth.uid()) AND public.sttns_is_project_member(project_id)));


--
-- Name: sttns_initiative_execution_proposals sttns_execution_proposals_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_execution_proposals_select ON public.sttns_initiative_execution_proposals FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_execution_proposals sttns_execution_proposals_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_execution_proposals_update ON public.sttns_initiative_execution_proposals FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_feature_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_feature_links ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_feature_links sttns_feature_links_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_feature_links_delete ON public.sttns_feature_links FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_feature_links sttns_feature_links_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_feature_links_insert ON public.sttns_feature_links FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_feature_links sttns_feature_links_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_feature_links_select ON public.sttns_feature_links FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_feature_links sttns_feature_links_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_feature_links_update ON public.sttns_feature_links FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_events ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_execution_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_execution_history ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_execution_history_insert ON public.sttns_initiative_execution_history FOR INSERT TO authenticated WITH CHECK (((changed_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.sttns_initiatives ini
  WHERE ((ini.id = sttns_initiative_execution_history.initiative_id) AND public.sttns_is_project_member(ini.project_id))))));


--
-- Name: sttns_initiative_execution_history sttns_initiative_execution_history_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_execution_history_select ON public.sttns_initiative_execution_history FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_initiatives ini
  WHERE ((ini.id = sttns_initiative_execution_history.initiative_id) AND public.sttns_is_project_member(ini.project_id)))));


--
-- Name: sttns_initiative_execution_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_execution_proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_planning_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_planning_history ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiative_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_tasks_delete ON public.sttns_initiative_tasks FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_tasks_insert ON public.sttns_initiative_tasks FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_tasks_select ON public.sttns_initiative_tasks FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_tasks sttns_initiative_tasks_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiative_tasks_update ON public.sttns_initiative_tasks FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiatives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_initiatives ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_initiatives sttns_initiatives_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiatives_delete ON public.sttns_initiatives FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiatives sttns_initiatives_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiatives_insert ON public.sttns_initiatives FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiatives sttns_initiatives_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiatives_select ON public.sttns_initiatives FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiatives sttns_initiatives_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_initiatives_update ON public.sttns_initiatives FOR UPDATE TO authenticated USING ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (created_by IS NULL) OR (created_by = auth.uid()) OR (COALESCE(review_status, 'draft'::public.sttns_review_status) <> 'draft'::public.sttns_review_status)))) WITH CHECK ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (created_by IS NULL) OR (created_by = auth.uid()) OR (COALESCE(review_status, 'draft'::public.sttns_review_status) <> 'draft'::public.sttns_review_status))));


--
-- Name: sttns_project_members sttns_members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_members_delete ON public.sttns_project_members FOR DELETE TO authenticated USING ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_project_members sttns_members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_members_insert ON public.sttns_project_members FOR INSERT TO authenticated WITH CHECK ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id) OR ((user_id = auth.uid()) AND (role = 'ceo'::public.sttns_project_role) AND (NOT (EXISTS ( SELECT 1
   FROM public.sttns_project_members m
  WHERE (m.project_id = m.project_id)))))));


--
-- Name: sttns_project_members sttns_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_members_select ON public.sttns_project_members FOR SELECT TO authenticated USING ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_project_members sttns_members_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_members_update ON public.sttns_project_members FOR UPDATE TO authenticated USING ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id))) WITH CHECK ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_modules sttns_modules_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_modules_delete ON public.sttns_modules FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_modules sttns_modules_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_modules_insert ON public.sttns_modules FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_modules sttns_modules_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_modules_select ON public.sttns_modules FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_modules sttns_modules_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_modules_update ON public.sttns_modules FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_peer_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_peer_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_peer_reviews sttns_peer_reviews_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_peer_reviews_delete ON public.sttns_peer_reviews FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_peer_reviews sttns_peer_reviews_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_peer_reviews_insert ON public.sttns_peer_reviews FOR INSERT TO authenticated WITH CHECK (((auth.uid() = reviewer_id) AND public.sttns_is_project_member(project_id)));


--
-- Name: sttns_peer_reviews sttns_peer_reviews_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_peer_reviews_select ON public.sttns_peer_reviews FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_peer_reviews sttns_peer_reviews_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_peer_reviews_update ON public.sttns_peer_reviews FOR UPDATE TO authenticated USING (((auth.uid() = reviewer_id) AND public.sttns_is_project_member(project_id))) WITH CHECK (((auth.uid() = reviewer_id) AND public.sttns_is_project_member(project_id)));


--
-- Name: sttns_persona_job_type_defs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_persona_job_type_defs ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_persona_job_type_defs sttns_persona_job_type_defs_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_job_type_defs_all ON public.sttns_persona_job_type_defs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: sttns_persona_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_persona_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_persona_jobs sttns_persona_jobs_mutate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_jobs_mutate ON public.sttns_persona_jobs TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_jobs.persona_id) AND public.sttns_is_project_member(pe.project_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_jobs.persona_id) AND public.sttns_is_project_member(pe.project_id)))));


--
-- Name: sttns_persona_jobs sttns_persona_jobs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_jobs_select ON public.sttns_persona_jobs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_jobs.persona_id) AND public.sttns_is_project_member(pe.project_id)))));


--
-- Name: sttns_persona_pain_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_persona_pain_points ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_persona_pain_points sttns_persona_pain_points_mutate; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_pain_points_mutate ON public.sttns_persona_pain_points TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_pain_points.persona_id) AND public.sttns_is_project_member(pe.project_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_pain_points.persona_id) AND public.sttns_is_project_member(pe.project_id)))));


--
-- Name: sttns_persona_pain_points sttns_persona_pain_points_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_pain_points_select ON public.sttns_persona_pain_points FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_personas pe
  WHERE ((pe.id = sttns_persona_pain_points.persona_id) AND public.sttns_is_project_member(pe.project_id)))));


--
-- Name: sttns_persona_tier_defs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_persona_tier_defs ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_persona_tier_defs sttns_persona_tier_defs_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_persona_tier_defs_all ON public.sttns_persona_tier_defs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: sttns_personas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_personas ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_personas sttns_personas_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_personas_delete ON public.sttns_personas FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_personas sttns_personas_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_personas_insert ON public.sttns_personas FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_personas sttns_personas_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_personas_select ON public.sttns_personas FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_personas sttns_personas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_personas_update ON public.sttns_personas FOR UPDATE TO authenticated USING ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (review_status <> 'draft'::public.sttns_review_status) OR (created_by IS NULL) OR (created_by = auth.uid())))) WITH CHECK ((public.sttns_is_project_member(project_id) AND (public.sttns_is_platform_admin() OR (review_status <> 'draft'::public.sttns_review_status) OR (created_by IS NULL) OR (created_by = auth.uid()))));


--
-- Name: sttns_initiative_planning_history sttns_planning_history_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_planning_history_insert ON public.sttns_initiative_planning_history FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_planning_history sttns_planning_history_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_planning_history_select ON public.sttns_initiative_planning_history FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_profiles sttns_profiles_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_profiles_insert_own ON public.sttns_profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: sttns_profiles sttns_profiles_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_profiles_select ON public.sttns_profiles FOR SELECT TO authenticated USING (true);


--
-- Name: sttns_profiles sttns_profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_profiles_update_own ON public.sttns_profiles FOR UPDATE TO authenticated USING (((auth.uid() = id) OR public.sttns_is_platform_admin())) WITH CHECK ((((auth.uid() = id) AND (NOT (platform_role IS DISTINCT FROM ( SELECT p.platform_role
   FROM public.sttns_profiles p
  WHERE (p.id = auth.uid()))))) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_project_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_project_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_project_invites sttns_project_invites_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_invites_delete ON public.sttns_project_invites FOR DELETE TO authenticated USING ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_project_invites sttns_project_invites_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_invites_insert ON public.sttns_project_invites FOR INSERT TO authenticated WITH CHECK ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_project_invites sttns_project_invites_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_invites_select ON public.sttns_project_invites FOR SELECT TO authenticated USING ((public.sttns_is_project_member(project_id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_project_invites sttns_project_invites_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_invites_update ON public.sttns_project_invites FOR UPDATE TO authenticated USING ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id))) WITH CHECK ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_project_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_project_members ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_project_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_project_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_project_metrics sttns_project_metrics_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_metrics_delete ON public.sttns_project_metrics FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_project_metrics sttns_project_metrics_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_metrics_insert ON public.sttns_project_metrics FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_project_metrics sttns_project_metrics_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_metrics_select ON public.sttns_project_metrics FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_project_metrics sttns_project_metrics_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_metrics_update ON public.sttns_project_metrics FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_project_settings_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_project_settings_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_project_settings_audit sttns_project_settings_audit_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_settings_audit_insert ON public.sttns_project_settings_audit FOR INSERT TO authenticated WITH CHECK ((public.sttns_is_platform_admin() OR public.sttns_is_project_ceo(project_id)));


--
-- Name: sttns_project_settings_audit sttns_project_settings_audit_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_project_settings_audit_select ON public.sttns_project_settings_audit FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_projects sttns_projects_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_projects_delete ON public.sttns_projects FOR DELETE TO authenticated USING (public.sttns_is_platform_admin());


--
-- Name: sttns_projects sttns_projects_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_projects_insert ON public.sttns_projects FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: sttns_projects sttns_projects_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_projects_select ON public.sttns_projects FOR SELECT TO authenticated USING ((public.sttns_is_project_member(id) OR public.sttns_is_platform_admin() OR (NOT (EXISTS ( SELECT 1
   FROM public.sttns_project_members m
  WHERE (m.project_id = sttns_projects.id))))));


--
-- Name: POLICY sttns_projects_select ON sttns_projects; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY sttns_projects_select ON public.sttns_projects IS 'Membre ou admin voit le projet ; projet sans aucun membre visible pour revendication CEO au login.';


--
-- Name: sttns_projects sttns_projects_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_projects_update ON public.sttns_projects FOR UPDATE TO authenticated USING ((public.sttns_is_project_member(id) OR public.sttns_is_platform_admin())) WITH CHECK ((public.sttns_is_project_member(id) OR public.sttns_is_platform_admin()));


--
-- Name: sttns_releases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_releases ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_releases sttns_releases_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_releases_delete ON public.sttns_releases FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_releases sttns_releases_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_releases_insert ON public.sttns_releases FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_releases sttns_releases_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_releases_select ON public.sttns_releases FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_releases sttns_releases_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_releases_update ON public.sttns_releases FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_initiative_reviews sttns_reviews_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_reviews_insert ON public.sttns_initiative_reviews FOR INSERT TO authenticated WITH CHECK (((auth.uid() = reviewer_id) AND public.sttns_is_project_member(project_id)));


--
-- Name: sttns_initiative_reviews sttns_reviews_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_reviews_select ON public.sttns_initiative_reviews FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_user_stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_user_stories ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_user_stories sttns_user_stories_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_stories_delete ON public.sttns_user_stories FOR DELETE TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_user_stories sttns_user_stories_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_stories_insert ON public.sttns_user_stories FOR INSERT TO authenticated WITH CHECK ((public.sttns_is_project_member(project_id) AND ((epic_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.sttns_epics e
  WHERE ((e.id = sttns_user_stories.epic_id) AND (e.project_id = e.project_id) AND (e.archived_at IS NULL)))))));


--
-- Name: sttns_user_stories sttns_user_stories_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_stories_select ON public.sttns_user_stories FOR SELECT TO authenticated USING (public.sttns_is_project_member(project_id));


--
-- Name: sttns_user_stories sttns_user_stories_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_stories_update ON public.sttns_user_stories FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK ((public.sttns_is_project_member(project_id) AND ((epic_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.sttns_epics e
  WHERE ((e.id = sttns_user_stories.epic_id) AND (e.project_id = e.project_id) AND (e.archived_at IS NULL)))))));


--
-- Name: sttns_user_story_personas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_user_story_personas ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_user_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_user_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_user_tasks sttns_user_tasks_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_tasks_delete ON public.sttns_user_tasks FOR DELETE TO authenticated USING (public.sttns_is_platform_admin());


--
-- Name: sttns_user_tasks sttns_user_tasks_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_tasks_insert ON public.sttns_user_tasks FOR INSERT TO authenticated WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_user_tasks sttns_user_tasks_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_tasks_select ON public.sttns_user_tasks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.sttns_is_project_member(project_id)));


--
-- Name: sttns_user_tasks sttns_user_tasks_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_user_tasks_update ON public.sttns_user_tasks FOR UPDATE TO authenticated USING (public.sttns_is_project_member(project_id)) WITH CHECK (public.sttns_is_project_member(project_id));


--
-- Name: sttns_user_story_personas sttns_usp_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_usp_delete ON public.sttns_user_story_personas FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_user_stories us
  WHERE ((us.id = sttns_user_story_personas.user_story_id) AND public.sttns_is_project_member(us.project_id)))));


--
-- Name: sttns_user_story_personas sttns_usp_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_usp_insert ON public.sttns_user_story_personas FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sttns_user_stories us
  WHERE ((us.id = sttns_user_story_personas.user_story_id) AND public.sttns_is_project_member(us.project_id)))));


--
-- Name: sttns_user_story_personas sttns_usp_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sttns_usp_select ON public.sttns_user_story_personas FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_user_stories us
  WHERE ((us.id = sttns_user_story_personas.user_story_id) AND public.sttns_is_project_member(us.project_id)))));


--
-- Name: sttns_work_item_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_work_item_events ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_work_item_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_work_item_links ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_work_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sttns_work_items ENABLE ROW LEVEL SECURITY;

--
-- Name: sttns_work_item_events work_item_events_select_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_item_events_select_project_members ON public.sttns_work_item_events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_work_item_events.work_item_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_work_item_links work_item_links_select_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_item_links_select_project_members ON public.sttns_work_item_links FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_work_item_links.source_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_work_item_links work_item_links_write_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_item_links_write_project_members ON public.sttns_work_item_links TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_work_item_links.source_id) AND (pm.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.sttns_work_items wi
     JOIN public.sttns_project_members pm ON ((pm.project_id = wi.project_id)))
  WHERE ((wi.id = sttns_work_item_links.source_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_work_items work_items_select_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_items_select_project_members ON public.sttns_work_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_project_members pm
  WHERE ((pm.project_id = sttns_work_items.project_id) AND (pm.user_id = auth.uid())))));


--
-- Name: sttns_work_items work_items_write_project_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_items_write_project_members ON public.sttns_work_items TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.sttns_project_members pm
  WHERE ((pm.project_id = sttns_work_items.project_id) AND (pm.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sttns_project_members pm
  WHERE ((pm.project_id = sttns_work_items.project_id) AND (pm.user_id = auth.uid())))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;


--
-- Name: FUNCTION sttns_advance_workflow(p_initiative_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_advance_workflow(p_initiative_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sttns_advance_workflow(p_initiative_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_advance_workflow(p_initiative_id uuid) TO service_role;


--
-- Name: FUNCTION sttns_apply_pending_invites(p_user_id uuid, p_email text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_apply_pending_invites(p_user_id uuid, p_email text) TO anon;
GRANT ALL ON FUNCTION public.sttns_apply_pending_invites(p_user_id uuid, p_email text) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_apply_pending_invites(p_user_id uuid, p_email text) TO service_role;


--
-- Name: FUNCTION sttns_audit_assignee_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_assignee_change() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_assignee_change() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_assignee_change() TO service_role;


--
-- Name: FUNCTION sttns_audit_parent_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_parent_change() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_parent_change() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_parent_change() TO service_role;


--
-- Name: FUNCTION sttns_audit_priority_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_priority_change() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_priority_change() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_priority_change() TO service_role;


--
-- Name: FUNCTION sttns_audit_status_change(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_status_change() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_status_change() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_status_change() TO service_role;


--
-- Name: FUNCTION sttns_audit_work_item_link_added(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_added() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_added() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_added() TO service_role;


--
-- Name: FUNCTION sttns_audit_work_item_link_removed(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_removed() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_removed() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_link_removed() TO service_role;


--
-- Name: FUNCTION sttns_audit_work_item_updated(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_audit_work_item_updated() TO anon;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_updated() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_audit_work_item_updated() TO service_role;


--
-- Name: FUNCTION sttns_calculate_tree_path(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_calculate_tree_path() TO anon;
GRANT ALL ON FUNCTION public.sttns_calculate_tree_path() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_calculate_tree_path() TO service_role;


--
-- Name: FUNCTION sttns_duplicate_project(source_id uuid, new_slug text, new_name text, creator_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_duplicate_project(source_id uuid, new_slug text, new_name text, creator_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sttns_duplicate_project(source_id uuid, new_slug text, new_name text, creator_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_duplicate_project(source_id uuid, new_slug text, new_name text, creator_id uuid) TO service_role;


--
-- Name: FUNCTION sttns_guard_project_governance(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_guard_project_governance() TO anon;
GRANT ALL ON FUNCTION public.sttns_guard_project_governance() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_guard_project_governance() TO service_role;


--
-- Name: FUNCTION sttns_handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.sttns_handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_handle_new_user() TO service_role;


--
-- Name: FUNCTION sttns_is_platform_admin(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_is_platform_admin() TO anon;
GRANT ALL ON FUNCTION public.sttns_is_platform_admin() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_is_platform_admin() TO service_role;


--
-- Name: FUNCTION sttns_is_project_ceo(p_project_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_is_project_ceo(p_project_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sttns_is_project_ceo(p_project_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_is_project_ceo(p_project_id uuid) TO service_role;


--
-- Name: FUNCTION sttns_is_project_member(p_project_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_is_project_member(p_project_id uuid) TO anon;
GRANT ALL ON FUNCTION public.sttns_is_project_member(p_project_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_is_project_member(p_project_id uuid) TO service_role;


--
-- Name: FUNCTION sttns_log_work_item_created(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_log_work_item_created() TO anon;
GRANT ALL ON FUNCTION public.sttns_log_work_item_created() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_log_work_item_created() TO service_role;


--
-- Name: FUNCTION sttns_on_review_insert(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_on_review_insert() TO anon;
GRANT ALL ON FUNCTION public.sttns_on_review_insert() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_on_review_insert() TO service_role;


--
-- Name: FUNCTION sttns_profiles_apply_invites_trigger(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_profiles_apply_invites_trigger() TO anon;
GRANT ALL ON FUNCTION public.sttns_profiles_apply_invites_trigger() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_profiles_apply_invites_trigger() TO service_role;


--
-- Name: FUNCTION sttns_project_member_has_role(p_project_id uuid, p_roles public.sttns_project_role[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_project_member_has_role(p_project_id uuid, p_roles public.sttns_project_role[]) TO anon;
GRANT ALL ON FUNCTION public.sttns_project_member_has_role(p_project_id uuid, p_roles public.sttns_project_role[]) TO authenticated;
GRANT ALL ON FUNCTION public.sttns_project_member_has_role(p_project_id uuid, p_roles public.sttns_project_role[]) TO service_role;


--
-- Name: FUNCTION sttns_set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.sttns_set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_set_updated_at() TO service_role;


--
-- Name: FUNCTION sttns_user_story_epic_matches_project(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_user_story_epic_matches_project() TO anon;
GRANT ALL ON FUNCTION public.sttns_user_story_epic_matches_project() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_user_story_epic_matches_project() TO service_role;


--
-- Name: FUNCTION sttns_validate_no_cycle(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_validate_no_cycle() TO anon;
GRANT ALL ON FUNCTION public.sttns_validate_no_cycle() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_validate_no_cycle() TO service_role;


--
-- Name: FUNCTION sttns_validate_parent_not_archived(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_validate_parent_not_archived() TO anon;
GRANT ALL ON FUNCTION public.sttns_validate_parent_not_archived() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_validate_parent_not_archived() TO service_role;


--
-- Name: FUNCTION sttns_validate_parent_type(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_validate_parent_type() TO anon;
GRANT ALL ON FUNCTION public.sttns_validate_parent_type() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_validate_parent_type() TO service_role;


--
-- Name: FUNCTION sttns_validate_work_item_link_same_project(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_validate_work_item_link_same_project() TO anon;
GRANT ALL ON FUNCTION public.sttns_validate_work_item_link_same_project() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_validate_work_item_link_same_project() TO service_role;


--
-- Name: FUNCTION sttns_work_item_soft_delete(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_work_item_soft_delete() TO anon;
GRANT ALL ON FUNCTION public.sttns_work_item_soft_delete() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_work_item_soft_delete() TO service_role;


--
-- Name: FUNCTION sttns_work_items_set_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.sttns_work_items_set_updated_at() TO anon;
GRANT ALL ON FUNCTION public.sttns_work_items_set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.sttns_work_items_set_updated_at() TO service_role;


--
-- Name: TABLE sttns_context_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_context_links TO anon;
GRANT ALL ON TABLE public.sttns_context_links TO authenticated;
GRANT ALL ON TABLE public.sttns_context_links TO service_role;


--
-- Name: TABLE sttns_cycles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_cycles TO anon;
GRANT ALL ON TABLE public.sttns_cycles TO authenticated;
GRANT ALL ON TABLE public.sttns_cycles TO service_role;


--
-- Name: TABLE sttns_discovery_drafts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_discovery_drafts TO anon;
GRANT ALL ON TABLE public.sttns_discovery_drafts TO authenticated;
GRANT ALL ON TABLE public.sttns_discovery_drafts TO service_role;


--
-- Name: TABLE sttns_epics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_epics TO anon;
GRANT ALL ON TABLE public.sttns_epics TO authenticated;
GRANT ALL ON TABLE public.sttns_epics TO service_role;


--
-- Name: TABLE sttns_feature_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_feature_links TO anon;
GRANT ALL ON TABLE public.sttns_feature_links TO authenticated;
GRANT ALL ON TABLE public.sttns_feature_links TO service_role;


--
-- Name: TABLE sttns_initiative_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_events TO anon;
GRANT ALL ON TABLE public.sttns_initiative_events TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_events TO service_role;


--
-- Name: TABLE sttns_initiative_execution_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_execution_history TO anon;
GRANT ALL ON TABLE public.sttns_initiative_execution_history TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_execution_history TO service_role;


--
-- Name: TABLE sttns_initiative_execution_proposals; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_execution_proposals TO anon;
GRANT ALL ON TABLE public.sttns_initiative_execution_proposals TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_execution_proposals TO service_role;


--
-- Name: TABLE sttns_initiative_planning_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_planning_history TO anon;
GRANT ALL ON TABLE public.sttns_initiative_planning_history TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_planning_history TO service_role;


--
-- Name: TABLE sttns_initiative_reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_reviews TO anon;
GRANT ALL ON TABLE public.sttns_initiative_reviews TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_reviews TO service_role;


--
-- Name: TABLE sttns_initiative_tasks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiative_tasks TO anon;
GRANT ALL ON TABLE public.sttns_initiative_tasks TO authenticated;
GRANT ALL ON TABLE public.sttns_initiative_tasks TO service_role;


--
-- Name: TABLE sttns_initiatives; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_initiatives TO anon;
GRANT ALL ON TABLE public.sttns_initiatives TO authenticated;
GRANT ALL ON TABLE public.sttns_initiatives TO service_role;


--
-- Name: TABLE sttns_modules; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_modules TO anon;
GRANT ALL ON TABLE public.sttns_modules TO authenticated;
GRANT ALL ON TABLE public.sttns_modules TO service_role;


--
-- Name: TABLE sttns_peer_reviews; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_peer_reviews TO anon;
GRANT ALL ON TABLE public.sttns_peer_reviews TO authenticated;
GRANT ALL ON TABLE public.sttns_peer_reviews TO service_role;


--
-- Name: TABLE sttns_persona_job_type_defs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_persona_job_type_defs TO anon;
GRANT ALL ON TABLE public.sttns_persona_job_type_defs TO authenticated;
GRANT ALL ON TABLE public.sttns_persona_job_type_defs TO service_role;


--
-- Name: TABLE sttns_persona_jobs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_persona_jobs TO anon;
GRANT ALL ON TABLE public.sttns_persona_jobs TO authenticated;
GRANT ALL ON TABLE public.sttns_persona_jobs TO service_role;


--
-- Name: TABLE sttns_persona_pain_points; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_persona_pain_points TO anon;
GRANT ALL ON TABLE public.sttns_persona_pain_points TO authenticated;
GRANT ALL ON TABLE public.sttns_persona_pain_points TO service_role;


--
-- Name: TABLE sttns_persona_tier_defs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_persona_tier_defs TO anon;
GRANT ALL ON TABLE public.sttns_persona_tier_defs TO authenticated;
GRANT ALL ON TABLE public.sttns_persona_tier_defs TO service_role;


--
-- Name: TABLE sttns_personas; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_personas TO anon;
GRANT ALL ON TABLE public.sttns_personas TO authenticated;
GRANT ALL ON TABLE public.sttns_personas TO service_role;


--
-- Name: TABLE sttns_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_profiles TO anon;
GRANT ALL ON TABLE public.sttns_profiles TO authenticated;
GRANT ALL ON TABLE public.sttns_profiles TO service_role;
GRANT INSERT,UPDATE ON TABLE public.sttns_profiles TO supabase_auth_admin;


--
-- Name: TABLE sttns_project_invites; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_project_invites TO anon;
GRANT ALL ON TABLE public.sttns_project_invites TO authenticated;
GRANT ALL ON TABLE public.sttns_project_invites TO service_role;


--
-- Name: TABLE sttns_project_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_project_members TO anon;
GRANT ALL ON TABLE public.sttns_project_members TO authenticated;
GRANT ALL ON TABLE public.sttns_project_members TO service_role;


--
-- Name: TABLE sttns_project_metrics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_project_metrics TO anon;
GRANT ALL ON TABLE public.sttns_project_metrics TO authenticated;
GRANT ALL ON TABLE public.sttns_project_metrics TO service_role;


--
-- Name: TABLE sttns_project_settings_audit; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_project_settings_audit TO anon;
GRANT ALL ON TABLE public.sttns_project_settings_audit TO authenticated;
GRANT ALL ON TABLE public.sttns_project_settings_audit TO service_role;


--
-- Name: TABLE sttns_projects; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_projects TO anon;
GRANT ALL ON TABLE public.sttns_projects TO authenticated;
GRANT ALL ON TABLE public.sttns_projects TO service_role;


--
-- Name: TABLE sttns_releases; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_releases TO anon;
GRANT ALL ON TABLE public.sttns_releases TO authenticated;
GRANT ALL ON TABLE public.sttns_releases TO service_role;


--
-- Name: TABLE sttns_user_stories; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_user_stories TO anon;
GRANT ALL ON TABLE public.sttns_user_stories TO authenticated;
GRANT ALL ON TABLE public.sttns_user_stories TO service_role;


--
-- Name: TABLE sttns_user_story_personas; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_user_story_personas TO anon;
GRANT ALL ON TABLE public.sttns_user_story_personas TO authenticated;
GRANT ALL ON TABLE public.sttns_user_story_personas TO service_role;


--
-- Name: TABLE sttns_user_tasks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_user_tasks TO anon;
GRANT ALL ON TABLE public.sttns_user_tasks TO authenticated;
GRANT ALL ON TABLE public.sttns_user_tasks TO service_role;


--
-- Name: TABLE sttns_work_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_work_items TO anon;
GRANT ALL ON TABLE public.sttns_work_items TO authenticated;
GRANT ALL ON TABLE public.sttns_work_items TO service_role;


--
-- Name: TABLE sttns_work_item_children; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_work_item_children TO anon;
GRANT ALL ON TABLE public.sttns_work_item_children TO authenticated;
GRANT ALL ON TABLE public.sttns_work_item_children TO service_role;


--
-- Name: TABLE sttns_work_item_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_work_item_events TO anon;
GRANT ALL ON TABLE public.sttns_work_item_events TO authenticated;
GRANT ALL ON TABLE public.sttns_work_item_events TO service_role;


--
-- Name: TABLE sttns_work_item_links; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_work_item_links TO anon;
GRANT ALL ON TABLE public.sttns_work_item_links TO authenticated;
GRANT ALL ON TABLE public.sttns_work_item_links TO service_role;


--
-- Name: TABLE sttns_work_items_hierarchy; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sttns_work_items_hierarchy TO anon;
GRANT ALL ON TABLE public.sttns_work_items_hierarchy TO authenticated;
GRANT ALL ON TABLE public.sttns_work_items_hierarchy TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--



-- ---------------------------------------------------------------------------
-- Hors schéma public : création de profil à l'inscription, stockage des images
-- ---------------------------------------------------------------------------
SELECT pg_catalog.set_config('search_path', 'public, extensions', false);
CREATE TRIGGER on_auth_user_created_sttns AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION sttns_handle_new_user();
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('avatars', 'avatars', 't', 5242880, '{image/jpeg,image/png,image/webp,image/gif}') ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('persona-photos', 'persona-photos', 't', 5242880, '{image/jpeg,image/png,image/webp,image/gif}') ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Avatars are publicly readable" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'avatars'::text));
CREATE POLICY "Persona photos are publicly readable" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'persona-photos'::text));
CREATE POLICY "Project members can delete persona photos" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'persona-photos'::text) AND sttns_is_project_member(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Project members can update persona photos" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'persona-photos'::text) AND sttns_is_project_member(((storage.foldername(name))[1])::uuid))) WITH CHECK (((bucket_id = 'persona-photos'::text) AND sttns_is_project_member(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Project members can upload persona photos" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'persona-photos'::text) AND sttns_is_project_member(((storage.foldername(name))[1])::uuid)));
CREATE POLICY "Users can delete their own avatar" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Users can update their own avatar" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
CREATE POLICY "Users can upload their own avatar" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
