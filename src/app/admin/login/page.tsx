import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminSession } from "@/lib/session";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

async function loginAction(formData: FormData) {
  "use server";
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/admin/login?error=1");
  }

  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (!admin || !admin.isActive) {
    redirect("/admin/login?error=1");
  }

  const isValid = await compare(password, admin.passwordHash);

  if (isValid) {
    await createAdminSession(admin.id);
    redirect("/admin");
  } else {
    redirect("/admin/login?error=1");
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const isAlreadyLoggedIn = await verifyAdminSession();
  
  if (isAlreadyLoggedIn) {
    redirect("/admin");
  }

  const count = await prisma.admin.count();
  if (count === 0) {
    redirect("/admin/setup");
  }

  const awaitedSearchParams = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={loginAction}>
          {awaitedSearchParams.error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              Invalid email or password.
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
