ALTER TABLE "teams" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "createdByMemberId" integer;--> statement-breakpoint
UPDATE "teams" AS team
SET "createdByMemberId" = creator."memberId"
FROM (
	SELECT DISTINCT ON (membership."teamId")
		membership."teamId",
		membership."memberId"
	FROM "member_teams" AS membership
	ORDER BY
		membership."teamId",
		membership."createdAt" ASC,
		membership."memberId" ASC
) AS creator
WHERE creator."teamId" = team."id";--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_createdByMemberId_members_id_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "members"("id") ON DELETE SET NULL;
