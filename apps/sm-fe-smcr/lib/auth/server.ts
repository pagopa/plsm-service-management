import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { members } from "@/db/schema";
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

  const [existingMember] = await db
    .select({
      email: members.email,
      firstname: members.firstname,
      id: members.id,
      lastname: members.lastname,
    })
    .from(members)
    .where(eq(members.email, session.email))
    .limit(1);

  if (existingMember) {
    return {
      created: false,
      user: {
        email: existingMember.email,
        id: String(existingMember.id),
        name: `${existingMember.firstname} ${existingMember.lastname}`.trim(),
      },
    };
  }

  const [firstname = "Unknown", ...lastnameParts] = session.name
    .trim()
    .split(/\s+/);
  const [createdMember] = await db
    .insert(members)
    .values({
      email: session.email,
      firstname,
      lastname: lastnameParts.join(" ") || "User",
    })
    .onConflictDoNothing({ target: members.email })
    .returning({
      email: members.email,
      firstname: members.firstname,
      id: members.id,
      lastname: members.lastname,
    });

  if (!createdMember) {
    const [concurrentMember] = await db
      .select({
        email: members.email,
        firstname: members.firstname,
        id: members.id,
        lastname: members.lastname,
      })
      .from(members)
      .where(eq(members.email, session.email))
      .limit(1);

    if (!concurrentMember) {
      throw new Error("Unable to create the current application member");
    }

    return {
      created: false,
      user: {
        email: concurrentMember.email,
        id: String(concurrentMember.id),
        name: `${concurrentMember.firstname} ${concurrentMember.lastname}`.trim(),
      },
    };
  }

  return {
    created: true,
    user: {
      email: createdMember.email,
      id: String(createdMember.id),
      name: `${createdMember.firstname} ${createdMember.lastname}`.trim(),
    },
  };
}
