import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { memberTeams, teams } from "@/db/schema";
import { getOrCreateCurrentAppUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const memberId = Number(userId);

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  try {
    const currentUser = await getOrCreateCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId !== currentUser.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const memberships = await db
      .select({
        createdAt: memberTeams.createdAt,
        teamCreatedAt: teams.createdAt,
        teamId: teams.id,
        teamName: teams.name,
        teamSlug: teams.slug,
        teamUpdatedAt: teams.updatedAt,
      })
      .from(memberTeams)
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .where(eq(memberTeams.memberId, memberId));

    return NextResponse.json(
      memberships.map((membership) => ({
        createdAt: membership.createdAt.toISOString(),
        id: `${memberId}:${membership.teamId}`,
        role: "member" as const,
        team: {
          createdAt: membership.teamCreatedAt,
          id: String(membership.teamId),
          name: membership.teamName,
          slug: membership.teamSlug,
          updatedAt: membership.teamUpdatedAt,
        },
        userId,
      })),
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
