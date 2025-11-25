import { NextRequest, NextResponse } from "next/server";
import knex from "@/lib/knex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const members = await knex("user as u")
      .select(
        "m.id",
        "m.role",
        "t.name as teamName",
        "t.id as teamId",
        "t.image as teamImage",
        "t.createdAt as teamCreatedAt",
        "t.updatedAt as teamUpdatedAt",
      )
      .join("member as m", "u.id", "m.userId")
      .join("team as t", "m.teamId", "t.id")
      .where("u.id", userId);

    const mappedMembers: Array<any> = members.map((member) => ({
      id: member.id,
      // teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      team: {
        id: member.teamId,
        name: member.teamName,
        image: member.teamImage,
        createdAt: new Date(member.teamCreatedAt),
        updatedAt: new Date(member.teamUpdatedAt),
      },
    }));

    return NextResponse.json(mappedMembers, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
