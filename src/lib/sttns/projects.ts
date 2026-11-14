import { createClient } from "@/lib/supabase/server";
import type { SttnsProject } from "@/types/sttns";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

export async function getProjectBySlug(slug: string): Promise<SttnsProject> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sttns_projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) notFound();
  return data as SttnsProject;
}

export async function getAllProjects(): Promise<SttnsProject[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_projects")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as SttnsProject[];
}

export async function getArchivedProjects(): Promise<SttnsProject[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_projects")
    .select("*")
    .eq("is_active", false)
    .order("name");
  return (data ?? []) as SttnsProject[];
}

export function projectPath(slug: string, ...segments: string[]) {
  return `/projects/${slug}/${segments.join("/")}`.replace(/\/$/, "");
}
