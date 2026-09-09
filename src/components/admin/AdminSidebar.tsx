"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Committee", href: "/admin/committee" },
  { name: "Candidates", href: "/admin/candidates" },
  { name: "Voting", href: "/admin/voting" },
  { name: "Results", href: "/admin/results" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h1>Batch 2023</h1>
        <span>Admin</span>
      </div>
      
      <nav className="admin-nav" aria-label="Admin navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={isActive ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <form action="/admin/logout" method="POST">
          <button
            type="submit"
            className="admin-nav-link admin-logout"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
