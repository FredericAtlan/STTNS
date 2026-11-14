import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/sttns/access";

export async function requirePlatformAdminPage() {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) redirect("/");
  return admin;
}
