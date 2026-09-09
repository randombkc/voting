"use server";

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createAdminSession } from "@/lib/session";

const prisma = new PrismaClient();

export async function checkSetupRequired() {
  const count = await prisma.admin.count();
  return count === 0;
}

export async function setupFirstAdmin(data: FormData) {
  const count = await prisma.admin.count();
  if (count > 0) {
    return { success: false, error: "Setup is already complete." };
  }

  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const password = data.get("password") as string;

  if (!name || !email || !password || password.length < 8) {
    return { success: false, error: "Please provide name, email, and a password of at least 8 characters." };
  }

  try {
    const passwordHash = await hash(password, 12);
    
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
      }
    });

    await createAdminSession(admin.id);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message || "Failed to setup admin." };
  }
}
