CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"crm_activity_id" uuid CONSTRAINT "uq_calls_crm_activity_id" UNIQUE,
	"title" text,
	"institution_id" uuid,
	"institution_name" text,
	"product_id" text NOT NULL,
	"call_date" timestamp with time zone NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calls_product_id_check" CHECK ("product_id" IN ('prod-io','prod-interop','prod-pn','prod-pagopa','prod-io-sign'))
);
--> statement-breakpoint
CREATE INDEX "idx_calls_call_date" ON "calls" ("call_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_calls_institution_id" ON "calls" ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_calls_product_id" ON "calls" ("product_id");