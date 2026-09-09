import { verifyAdminSession } from "@/lib/session";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = await verifyAdminSession();

  if (!isLoggedIn) {
    // For /admin/login and /admin/setup
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
