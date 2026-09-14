import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { MonitoringDb } from "../client";
import { getMonitoringDb } from "../client";
import { calls, type Call, type NewCall, type ProductId } from "../schema";

export type UpsertCallInput = Omit<NewCall, "id" | "createdAt" | "updatedAt">;

export interface ListCallsOptions {
  limit: number;
  productId?: ProductId;
  institutionId?: string;
  /** Limite inferiore (incluso) su call_date. */
  callDateFrom?: Date;
  /** Limite superiore (incluso) su call_date. */
  callDateTo?: Date;
}

/**
 * Costruisce la query di upsert senza eseguirla.
 * Isolata per poter essere testata ispezionando l'SQL generato.
 *
 * I campi opzionali usano coalesce(excluded.x, calls.x): un retry con un
 * payload parziale (es. senza title) non deve azzerare un valore già
 * salvato da una chiamata precedente per lo stesso crm_activity_id.
 */
export function buildUpsertCall(db: MonitoringDb, input: UpsertCallInput) {
  return db
    .insert(calls)
    .values(input)
    .onConflictDoUpdate({
      target: calls.crmActivityId,
      set: {
        title: sql`coalesce(excluded.title, ${calls.title})`,
        institutionId: sql`coalesce(excluded.institution_id, ${calls.institutionId})`,
        institutionName: sql`coalesce(excluded.institution_name, ${calls.institutionName})`,
        productId: sql`excluded.product_id`,
        callDate: sql`excluded.call_date`,
        link: sql`coalesce(excluded.link, ${calls.link})`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: calls.id });
}

/**
 * Registra una call. Se esiste già una riga con lo stesso crm_activity_id
 * la aggiorna invece di duplicarla: l'operazione è idempotente rispetto ai retry.
 */
export async function upsertCall(input: UpsertCallInput): Promise<string> {
  const rows = await buildUpsertCall(getMonitoringDb(), input);
  const row = rows[0];

  if (!row) {
    throw new Error("upsertCall did not return the persisted row id");
  }

  return row.id;
}

/** Costruisce la query di lettura senza eseguirla. */
export function buildListCalls(db: MonitoringDb, options: ListCallsOptions) {
  const filters = [];

  if (options.productId) {
    filters.push(eq(calls.productId, options.productId));
  }

  if (options.institutionId) {
    filters.push(eq(calls.institutionId, options.institutionId));
  }

  if (options.callDateFrom) {
    filters.push(gte(calls.callDate, options.callDateFrom));
  }

  if (options.callDateTo) {
    filters.push(lte(calls.callDate, options.callDateTo));
  }

  return db
    .select()
    .from(calls)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(calls.callDate))
    .limit(options.limit);
}

/** Elenca le call più recenti, opzionalmente filtrate per prodotto, ente o range di data. */
export async function listCalls(options: ListCallsOptions): Promise<Call[]> {
  return buildListCalls(getMonitoringDb(), options);
}
