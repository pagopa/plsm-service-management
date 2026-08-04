-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "test";
--> statement-breakpoint
CREATE TABLE "ama_access" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ama_access_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"selfcare_access" boolean DEFAULT false,
	"legal_access" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "features_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL CONSTRAINT "features_name_key" UNIQUE,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"timestamp" timestamp with time zone NOT NULL,
	"level" text NOT NULL,
	"service" text NOT NULL,
	"message" text NOT NULL,
	"request" text,
	"context" jsonb,
	CONSTRAINT "logs_level_check" CHECK ((level = ANY (ARRAY['DEBUG'::text, 'INFO'::text, 'WARN'::text, 'ERROR'::text]))),
	CONSTRAINT "logs_service_check" CHECK ((service = ANY (ARRAY['SMCR'::text, 'AMA'::text])))
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3),
	"teamId" text,
	CONSTRAINT "member_userid_teamid_unique" UNIQUE("userId","teamId")
);
--> statement-breakpoint
CREATE TABLE "member_teams" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "member_teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"memberId" integer NOT NULL,
	"teamId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_teams_unique_pair" UNIQUE("memberId","teamId")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"featureId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL CONSTRAINT "preferences_user_id_unique" UNIQUE,
	"team_id" text,
	"color_mode" varchar(20) NOT NULL,
	CONSTRAINT "valid_color_mode" CHECK (((color_mode)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3),
	"slug" text NOT NULL CONSTRAINT "team_slug_key" UNIQUE
);
--> statement-breakpoint
CREATE TABLE "team_permissions" (
	"id" serial PRIMARY KEY,
	"teamId" integer NOT NULL,
	"permissionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "team_permissions_teamid_permissionid_key" UNIQUE("teamId","permissionId")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL CONSTRAINT "teams_name_key" UNIQUE,
	"slug" text NOT NULL CONSTRAINT "teams_slug_key" UNIQUE,
	"icon" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE INDEX "idx_logs_request" ON "logs" ("request");--> statement-breakpoint
CREATE INDEX "idx_logs_service_level_timestamp_desc" ON "logs" ("service","level","timestamp" DESC);--> statement-breakpoint
CREATE INDEX "idx_logs_timestamp_desc" ON "logs" ("timestamp" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" ("email");--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userid_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "team_userid_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id");--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_feature_id_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_permissionid_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_permissions" ADD CONSTRAINT "team_permissions_teamid_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_teams" ADD CONSTRAINT "member_teams_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member_teams" ADD CONSTRAINT "member_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE;
*/