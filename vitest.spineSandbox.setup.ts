/**
 * Charge le bac à sable Spine Why avant les suites d'intégrité.
 * Pas de DB réelle — fixture déterministe en mémoire (idempotent).
 */
import {
  assertSpineWhySandboxIntegrity,
  buildSpineWhySandbox,
  type SpineWhySandbox,
} from "@/lib/sttns/spineWhySandbox";

declare global {
  // eslint-disable-next-line no-var
  var __STTNS_SPINE_WHY_SANDBOX__: SpineWhySandbox | undefined;
}

const sandbox = buildSpineWhySandbox();
assertSpineWhySandboxIntegrity(sandbox);
globalThis.__STTNS_SPINE_WHY_SANDBOX__ = sandbox;
