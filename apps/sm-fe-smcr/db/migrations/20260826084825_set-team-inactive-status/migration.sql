ALTER TABLE "teams" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
UPDATE "teams"
SET "status" = CASE
	WHEN "status" = 'active' THEN 'active'
	ELSE 'inactive'
END;--> statement-breakpoint
DROP TYPE "team_status";--> statement-breakpoint
CREATE TYPE "team_status" AS ENUM('active', 'inactive');--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "status" SET DATA TYPE "team_status" USING "status"::"team_status";--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "status" SET DEFAULT 'inactive'::"team_status";
