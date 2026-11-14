import Link from "next/link";
import { redirect } from "next/navigation";
import { RecoveryLinkGenerator } from "@/components/auth/RecoveryLinkGenerator";
import { requirePlatformAdmin } from "@/lib/sttns/access";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function AuthRecoveryLinkPage({ searchParams }: Props) {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    redirect(`/login?next=${encodeURIComponent("/auth/recovery-link")}`);
  }

  const { email } = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div>
        <Link href="/" className="text-sm font-semibold text-sttns-accent hover:underline">
          ← Back to the app
        </Link>
        <h1 className="mt-3 font-display text-2xl font-extrabold">Password reset</h1>
        <p className="mt-2 text-sm text-sttns-muted">
          Reserved for the platform admin — generate a reset link without using Supabase email.
        </p>
      </div>

      <RecoveryLinkGenerator defaultEmail={email?.trim() ?? ""} />

      <p className="text-xs text-sttns-muted">
        The user opens the link and chooses a new password. Also available in{" "}
        <Link href="/admin/security" className="font-semibold text-sttns-accent hover:underline">
          Admin console → Security
        </Link>
        .
      </p>
    </div>
  );
}
