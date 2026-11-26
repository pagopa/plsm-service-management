-- Run in the pg_cron metadata database; logs_db is the SMCR application database.
SELECT cron.schedule_in_database(
  'smcr-log-retention',
  '0 3 * * *',
  $job$
    DO $cleanup$
    DECLARE
      cutoff CONSTANT timestamptz := now() - interval '30 days';
      batch_size CONSTANT integer := 5000;
      deleted integer;
    BEGIN
      LOOP
        WITH expired AS MATERIALIZED (
          SELECT id FROM public.logs
          WHERE "timestamp" < cutoff
          ORDER BY "timestamp"
          LIMIT batch_size
        )
        DELETE FROM public.logs AS logs USING expired WHERE logs.id = expired.id;

        GET DIAGNOSTICS deleted = ROW_COUNT;
        COMMIT;
        EXIT WHEN deleted < batch_size;
      END LOOP;
    END
    $cleanup$;
  $job$,
  :'logs_db'
);
