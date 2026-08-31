-- Preserve every legacy user in the canonical members table. Team assignments
-- are intentionally not migrated: the following migration rebuilds the whole
-- team and permissions area from scratch.
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

-- Remove the singular legacy model after its users have been preserved.
-- Dropping the dependent tables first avoids relying on environment-specific
-- foreign-key names discovered during the original introspection.
DROP TABLE IF EXISTS "member";--> statement-breakpoint
DROP TABLE IF EXISTS "preferences";--> statement-breakpoint
DROP TABLE IF EXISTS "team";--> statement-breakpoint
DROP TABLE IF EXISTS "user";
