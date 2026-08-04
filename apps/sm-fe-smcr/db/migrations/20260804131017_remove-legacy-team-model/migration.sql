-- Preserve any legacy records that have not been copied to the canonical model yet.
INSERT INTO "members" (
	"firstname",
	"lastname",
	"email",
	"createdAt",
	"updatedAt"
)
SELECT
	COALESCE(NULLIF(split_part(btrim(legacy_user."name"), ' ', 1), ''), 'Unknown'),
	COALESCE(
		NULLIF(
			btrim(
				regexp_replace(
					btrim(legacy_user."name"),
					'^[^[:space:]]+[[:space:]]*',
					''
				)
			),
			''
		),
		'User'
	),
	legacy_user."email",
	COALESCE(legacy_user."createdAt", now()),
	COALESCE(legacy_user."updatedAt", legacy_user."createdAt", now())
FROM "user" AS legacy_user
WHERE NOT EXISTS (
	SELECT 1
	FROM "members" AS canonical_member
	WHERE lower(canonical_member."email") = lower(legacy_user."email")
);
--> statement-breakpoint
INSERT INTO "teams" (
	"name",
	"slug",
	"icon",
	"createdAt",
	"updatedAt"
)
SELECT
	legacy_team."name",
	legacy_team."slug",
	legacy_team."image",
	legacy_team."createdAt",
	COALESCE(legacy_team."updatedAt", legacy_team."createdAt", now())
FROM "team" AS legacy_team
WHERE NOT EXISTS (
	SELECT 1
	FROM "teams" AS canonical_team
	WHERE canonical_team."slug" = legacy_team."slug"
		OR canonical_team."name" = legacy_team."name"
);
--> statement-breakpoint
INSERT INTO "member_teams" ("memberId", "teamId", "createdAt")
SELECT
	canonical_member."id",
	canonical_team."id",
	legacy_membership."createdAt"
FROM "member" AS legacy_membership
INNER JOIN "user" AS legacy_user
	ON legacy_user."id" = legacy_membership."userId"
INNER JOIN "members" AS canonical_member
	ON lower(canonical_member."email") = lower(legacy_user."email")
INNER JOIN "team" AS legacy_team
	ON legacy_team."id" = legacy_membership."teamId"
INNER JOIN LATERAL (
	SELECT matched_team."id"
	FROM "teams" AS matched_team
	WHERE matched_team."slug" = legacy_team."slug"
		OR matched_team."name" = legacy_team."name"
	ORDER BY (matched_team."slug" = legacy_team."slug") DESC
	LIMIT 1
) AS canonical_team ON true
WHERE NOT EXISTS (
	SELECT 1
	FROM "member_teams" AS canonical_membership
	WHERE canonical_membership."memberId" = canonical_member."id"
		AND canonical_membership."teamId" = canonical_team."id"
);
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_userId_fkey";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_userid_fkey";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "team_userid_fkey";--> statement-breakpoint
ALTER TABLE "preferences" DROP CONSTRAINT "preferences_team_id_fkey";--> statement-breakpoint
ALTER TABLE "preferences" DROP CONSTRAINT "preferences_user_id_fkey";--> statement-breakpoint
DROP TABLE "member";--> statement-breakpoint
DROP TABLE "preferences";--> statement-breakpoint
DROP TABLE "team";--> statement-breakpoint
DROP TABLE "user";--> statement-breakpoint
ALTER TABLE "member_teams" RENAME CONSTRAINT "member_teams_memberId_fkey" TO "member_teams_memberId_members_id_fkey";--> statement-breakpoint
ALTER TABLE "member_teams" RENAME CONSTRAINT "member_teams_teamId_fkey" TO "member_teams_teamId_teams_id_fkey";--> statement-breakpoint
ALTER TABLE "permissions" RENAME CONSTRAINT "permissions_feature_id_fkey" TO "permissions_featureId_features_id_fkey";--> statement-breakpoint
ALTER TABLE "team_permissions" RENAME CONSTRAINT "team_permissions_teamid_fkey" TO "team_permissions_teamId_teams_id_fkey";--> statement-breakpoint
ALTER TABLE "team_permissions" RENAME CONSTRAINT "team_permissions_permissionid_fkey" TO "team_permissions_permissionId_permissions_id_fkey";--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_email_key" UNIQUE("email");
