import { Eye } from "lucide-react";

interface Props {
  authorName: string;
}

export function DraftReadOnlyBanner({ authorName }: Props) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <Eye className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
      <p>
        <span className="font-bold">Mode lecture seule</span>
        {" — "}
        Brouillon en cours de rédaction par <strong>{authorName}</strong>. Vous pouvez consulter
        le contenu, mais seul l&apos;auteur peut le modifier ou le soumettre.
      </p>
    </div>
  );
}
