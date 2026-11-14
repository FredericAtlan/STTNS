import { AdminConsoleShell } from "@/components/admin/AdminConsoleShell";
import { requirePlatformAdminPage } from "@/lib/sttns/adminGuard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdminPage();
  return <AdminConsoleShell>{children}</AdminConsoleShell>;
}
