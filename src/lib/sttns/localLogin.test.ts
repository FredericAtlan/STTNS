import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalLoginEnabled } from "./localLogin";

afterEach(() => vi.unstubAllEnvs());

describe("isLocalLoginEnabled", () => {
  it("actif seulement avec le drapeau, un Supabase local et une requête locale", () => {
    vi.stubEnv("STTNS_LOCAL_LOGIN", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(isLocalLoginEnabled("http://localhost:3001/login")).toBe(true);
    expect(isLocalLoginEnabled("https://sttns.exemple.fr/login")).toBe(false);
  });
  it("inactif avec un Supabase hébergé ou sans drapeau", () => {
    vi.stubEnv("STTNS_LOCAL_LOGIN", "1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(isLocalLoginEnabled("http://localhost:3001/login")).toBe(false);
    vi.stubEnv("STTNS_LOCAL_LOGIN", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(isLocalLoginEnabled("http://localhost:3001/login")).toBe(false);
  });
});
