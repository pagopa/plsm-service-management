CREATE TYPE "member_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "permission_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "team_status" AS ENUM('active', 'draft', 'suspended');--> statement-breakpoint

-- Permissions and features were still draft data. Rebuild this area around
-- granular permission codes instead of trying to reinterpret legacy records.
DROP TABLE "team_permissions";--> statement-breakpoint
DROP TABLE "permissions";--> statement-breakpoint
DROP TABLE "features";--> statement-breakpoint

-- A membership is uniquely identified by its member and team.
ALTER TABLE "member_teams" DROP CONSTRAINT "member_teams_unique_pair";--> statement-breakpoint
ALTER TABLE "member_teams" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "member_teams" ADD CONSTRAINT "member_teams_pkey" PRIMARY KEY("memberId", "teamId");--> statement-breakpoint

-- Existing members are linked to the authentication subject lazily on their
-- next login, so authSubject intentionally remains nullable during rollout.
ALTER TABLE "members" ADD COLUMN "authSubject" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "status" "member_status" DEFAULT 'active'::"member_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_auth_subject_key" UNIQUE("authSubject");--> statement-breakpoint

-- Preserve existing teams as active while new teams start as drafts.
ALTER TABLE "teams" ADD COLUMN "status" "team_status" DEFAULT 'active'::"team_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "status" SET DEFAULT 'draft'::"team_status";--> statement-breakpoint
ALTER TABLE "teams" DROP COLUMN "icon";--> statement-breakpoint

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

ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_teamId_teams_id_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_permissionId_permissions_id_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE;
