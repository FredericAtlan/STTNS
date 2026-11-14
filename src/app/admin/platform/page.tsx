import { redirect } from "next/navigation";

export default function LegacyPlatformAdminRedirect() {
  redirect("/admin/security");
}
