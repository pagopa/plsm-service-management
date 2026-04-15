import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "./constants";
import type { AuthSession } from "./jwt";
import { verifyAuthToken } from "./jwt";
import { sanitizeReturnUrl } from "./proxy";

export type CurrentAppUser = {
  email: string;
  id: string;
  name: string;
};

type CurrentAppUserResult = {
  created: boolean;
  user: CurrentAppUser;
};

export async function getServerSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return verifyAuthToken(token);
}

export async function requireServerSession(
  returnUrl = "/dashboard",
): Promise<AuthSession> {
  const session = await getServerSession();

  if (!session) {
    redirect(
      `/api/auth/login?returnUrl=${encodeURIComponent(sanitizeReturnUrl(returnUrl))}`,
    );
  }

  return session;
}

export async function getOrCreateCurrentAppUser(): Promise<CurrentAppUserResult | null> {
  const session = await getServerSession();

  if (!session?.email) {
    return null;
  }

  const { randomUUID } = await import("crypto");
  const { default: pg } = await import("@/lib/knex");

  const existingUser = await pg
    .select("id", "name", "email")
    .from<CurrentAppUser>("user")
    .where("email", session.email)
    .first();

  if (existingUser) {
    return {
      created: false,
      user: existingUser,
    };
  }

  const [createdUser] = await pg("user")
    .insert({
      createdAt: pg.fn.now(),
      email: session.email,
      id: randomUUID(),
      name: session.name,
      updatedAt: pg.fn.now(),
    })
    .returning(["id", "name", "email"]);

  return {
    created: true,
    user: createdUser,
  };
}
