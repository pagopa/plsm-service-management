-- Seed delle call UAT (SMION-860)
--
-- Dati fittizi per il frontend di dev, che chiama la CRM Function con
-- x-dynamics-environment: UAT e legge quindi solo le righe environment = 'UAT'.
-- Le call PROD non vengono né lette né toccate.
--
-- 60 call, una ogni 5 giorni dal 06/10/2025 al 28/07/2026 (18 nel 2025, 42 nel
-- 2026), così da coprire sia l'anno precedente sia quello corrente (filtri year
-- e dateFrom/dateTo).
-- Distribuzione per prodotto: prod-io 18, prod-pagopa 12, prod-pn 12,
-- prod-interop 6, prod-io-sign 6, prod-rtp 6. prod-pagopa e prod-pn a pari
-- merito permettono di verificare l'ordinamento alfabetico del roster.
--
-- Deterministico: crm_activity_id è derivato da un hash del numero di riga,
-- quindi non collide con activity id reali di Dynamics e ON CONFLICT rende
-- l'insert idempotente.
INSERT INTO "calls" (
	"crm_activity_id",
	"title",
	"institution_id",
	"institution_name",
	"product_id",
	"call_date",
	"link",
	"environment"
)
SELECT
	md5('smion-860-uat-seed-' || n)::uuid,
	'Call di test UAT #' || n,
	(ARRAY[
		'00000000-0000-4000-8000-000000000001',
		'00000000-0000-4000-8000-000000000002',
		'00000000-0000-4000-8000-000000000003',
		'00000000-0000-4000-8000-000000000004',
		'00000000-0000-4000-8000-000000000005',
		'00000000-0000-4000-8000-000000000006'
	])[1 + n % 6]::uuid,
	(ARRAY[
		'Comune di Test Alfa (UAT)',
		'Comune di Test Beta (UAT)',
		'Regione di Test Gamma (UAT)',
		'ASL di Test Delta (UAT)',
		'Università di Test Epsilon (UAT)',
		'Provincia di Test Zeta (UAT)'
	])[1 + n % 6],
	(ARRAY[
		'prod-io', 'prod-io', 'prod-io',
		'prod-pagopa', 'prod-pagopa',
		'prod-pn', 'prod-pn',
		'prod-interop',
		'prod-io-sign',
		'prod-rtp'
	])[1 + n % 10],
	timestamptz '2025-10-01 00:00:00+00'
		+ n * interval '5 days'
		+ (9 + n % 8) * interval '1 hour',
	CASE WHEN n % 2 = 0 THEN 'https://meet.example.com/uat-' || n END,
	'UAT'
FROM generate_series(1, 60) AS n
ON CONFLICT ("crm_activity_id") DO NOTHING;
