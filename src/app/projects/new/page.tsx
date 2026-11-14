"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/projects/actions";
import { projectHomePath } from "@/lib/sttns/paths";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [nsm, setNsm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(v: string) {
    setName(v);
    setSlug(
      v
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createProjectAction({
      name,
      slug,
      description: description || null,
      nsm_label: nsm || "North Star to define",
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(projectHomePath(result.slug));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <ProjectPageHero
        eyebrow="Portfolio"
        title="New project"
        contextHelp={PAGE_CONTEXT_HELP.newProject}
      />
      <form onSubmit={handleSubmit} className="sttns-card max-w-xl space-y-4">
        <div>
          <label className="sttns-label">Project name *</label>
          <input
            required
            className="sttns-input"
            value={name}
            onChange={(e) => autoSlug(e.target.value)}
          />
        </div>
        <div>
          <label className="sttns-label">URL slug *</label>
          <input
            required
            className="sttns-input font-mono text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div>
          <label className="sttns-label">North Star (temporary)</label>
          <input
            className="sttns-input"
            value={nsm}
            onChange={(e) => setNsm(e.target.value)}
            placeholder="Primary customer value metric"
          />
        </div>
        <div>
          <label className="sttns-label">Description</label>
          <textarea
            className="sttns-input min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="sttns-btn-primary">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create project
        </button>
      </form>
    </div>
  );
}
