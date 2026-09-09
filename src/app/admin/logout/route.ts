import { redirect } from "next/navigation";
import { clearAdminSession } from "@/lib/session";

export async function POST() {
  await clearAdminSession();
  redirect("/admin/login");
}
