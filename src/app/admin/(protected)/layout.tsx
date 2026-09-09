import { clearAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function handleLogout() {
    "use server";
    await clearAdminSession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold tracking-tight">Admin Portal</span>
              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                Dev Guard
              </span>
            </div>
            <div className="flex items-center">
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-10">
        {children}
      </main>
    </div>
  );
}
