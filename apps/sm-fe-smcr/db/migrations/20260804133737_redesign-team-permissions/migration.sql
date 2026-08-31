CREATE TYPE "member_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "permission_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "team_status" AS ENUM('active', 'draft', 'suspended');--> statement-breakpoint

-- Team, membership and permission records are disposable legacy data. Drop
-- the complete admin model so production schema drift cannot affect the new
-- structure. The members table is deliberately preserved.
DROP TABLE IF EXISTS "team_permissions";--> statement-breakpoint
DROP TABLE IF EXISTS "permissions";--> statement-breakpoint
DROP TABLE IF EXISTS "features";--> statement-breakpoint
DROP TABLE IF EXISTS "member_teams";--> statement-breakpoint
DROP TABLE IF EXISTS "teams";--> statement-breakpoint

-- The application treats an email address as one member. If legacy imports
-- produced the same normalized email more than once, keep the oldest record.
WITH duplicate_members AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY lower(btrim("email"))
			ORDER BY "createdAt" ASC, "id" ASC
		) AS duplicate_position
	FROM "members"
)
DELETE FROM "members" AS member
USING duplicate_members AS duplicate
WHERE member."id" = duplicate."id"
	AND duplicate.duplicate_position > 1;--> statement-breakpoint

ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_email_key";--> statement-breakpoint
DROP INDEX IF EXISTS "members_email_key";--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_email_key" UNIQUE("email");--> statement-breakpoint

-- Existing members are linked to the authentication subject lazily on their
-- next login, so authSubject intentionally remains nullable during rollout.
ALTER TABLE "members" ADD COLUMN "authSubject" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "status" "member_status" DEFAULT 'active'::"member_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_auth_subject_key" UNIQUE("authSubject");--> statement-breakpoint

CREATE TABLE "teams" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "team_status" DEFAULT 'draft'::"team_status" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_key" UNIQUE("name"),
	CONSTRAINT "teams_slug_key" UNIQUE("slug")
);--> statement-breakpoint

CREATE TABLE "member_teams" (
	"memberId" integer NOT NULL,
	"teamId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_teams_pkey" PRIMARY KEY("memberId", "teamId")
);--> statement-breakpoint

CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "permission_status" DEFAULT 'active'::"permission_status" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_key" UNIQUE("code")
);--> statement-breakpoint

CREATE TABLE "team_permissions" (
	"teamId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_permissions_pkey" PRIMARY KEY("teamId", "permissionId")
);--> statement-breakpoint

ALTER TABLE "member_teams" ADD CONSTRAINT "member_teams_memberId_members_id_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_teams" ADD CONSTRAINT "member_teams_teamId_teams_id_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_teamId_teams_id_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_permissionId_permissions_id_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE;
