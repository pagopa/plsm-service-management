ALTER TABLE "calls" ADD COLUMN "environment" text DEFAULT 'PROD' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_calls_environment_call_date" ON "calls" ("environment","call_date" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_environment_check" CHECK ("environment" IN ('UAT','PROD'));