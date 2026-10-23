import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import type { MonitoringDb } from "../client";
import { getMonitoringDb } from "../client";
import {
  calls,
  type Call,
  type Environment,
  type NewCall,
  type ProductId,
} from "../schema";

/**
 * `environment` è obbligatorio anche se la colonna ha default PROD: chi scrive
 * deve dichiarare l'ambiente, così una call UAT non finisce tra quelle di
 * produzione per dimenticanza.
 */
export type UpsertCallInput = Omit<
  NewCall,
  "id" | "createdAt" | "updatedAt" | "environment"
> & { environment: Environment };

/** Verso di ordinamento su call_date: `desc` parte dalla call più recente. */
export const LIST_CALLS_ORDERS = ["asc", "desc"] as const;
export type ListCallsOrder = (typeof LIST_CALLS_ORDERS)[number];

/** Filtri della lista call, condivisi tra la lettura della pagina e il conteggio. */
export interface ListCallsFilters {
  /** Ambiente Dynamics da cui provengono le call (UAT o PROD). */
  environment: Environment;
  productId?: ProductId;
  institutionId?: string;
  /** Limite inferiore (incluso) su call_date. */
  callDateFrom?: Date;
  /** Limite superiore (incluso) su call_date. */
  callDateTo?: Date;
}

export interface ListCallsOptions extends ListCallsFilters {
  limit: number;
  /** Numero di call da saltare prima della pagina richiesta (default 0). */
  offset?: number;
  /** Verso di ordinamento su call_date (default `desc`). */
  order?: ListCallsOrder;
}

/**
 * Costruisce la query di upsert senza eseguirla.
 * Isolata per poter essere testata ispezionando l'SQL generato.
 *
 * I campi opzionali usano coalesce(excluded.x, calls.x): un retry con un
 * payload parziale (es. senza title) non deve azzerare un valore già
 * salvato da una chiamata precedente per lo stesso crm_activity_id.
 *
 * `environment` non è nel set: l'ambiente di una call è fissato alla prima
 * registrazione e un retry non può spostarla da UAT a PROD o viceversa.
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

/** Condizioni WHERE della lista call: l'ambiente sempre, gli altri filtri se presenti. */
function buildListCallsWhere(filters: ListCallsFilters): SQL | undefined {
  const conditions = [eq(calls.environment, filters.environment)];

  if (filters.productId) {
    conditions.push(eq(calls.productId, filters.productId));
  }

  if (filters.institutionId) {
    conditions.push(eq(calls.institutionId, filters.institutionId));
  }

  if (filters.callDateFrom) {
    conditions.push(gte(calls.callDate, filters.callDateFrom));
  }

  if (filters.callDateTo) {
    conditions.push(lte(calls.callDate, filters.callDateTo));
  }

  return and(...conditions);
}

/**
 * Costruisce la query di lettura senza eseguirla.
 *
 * A parità di call_date ordina anche per id, nello stesso verso: senza un
 * ordinamento totale Postgres può restituire le righe con la stessa data in
 * ordine diverso tra una pagina e l'altra, duplicandole o saltandole.
 */
export function buildListCalls(db: MonitoringDb, options: ListCallsOptions) {
  const direction = options.order === "asc" ? asc : desc;

  return db
    .select()
    .from(calls)
    .where(buildListCallsWhere(options))
    .orderBy(direction(calls.callDate), direction(calls.id))
    .limit(options.limit)
    .offset(options.offset ?? 0);
}

/** Elenca una pagina di call dell'ambiente, opzionalmente filtrate per prodotto, ente o range di data. */
export async function listCalls(options: ListCallsOptions): Promise<Call[]> {
  return buildListCalls(getMonitoringDb(), options);
}

/** Costruisce la query di conteggio con gli stessi filtri della lista, senza eseguirla. */
export function buildCountCalls(db: MonitoringDb, filters: ListCallsFilters) {
  return db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(calls)
    .where(buildListCallsWhere(filters));
}

/** Numero totale di call che soddisfano i filtri, indipendente dalla pagina richiesta. */
export async function countCalls(filters: ListCallsFilters): Promise<number> {
  const rows = await buildCountCalls(getMonitoringDb(), filters);

  return rows[0]?.total ?? 0;
}

const SUMMARY_ROSTER_SIZE = 3;

export interface CallsSummaryProductCount {
  productId: ProductId;
  calls: number;
}

export interface CallsSummary {
  totalCalls: number;
  roster: Array<CallsSummaryProductCount & { position: number }>;
}

export interface CallsSummaryRange {
  /** Limite inferiore (incluso) su call_date. */
  from?: Date;
  /** Limite superiore (incluso) su call_date. */
  to?: Date;
}

export interface CallsSummaryOptions {
  /** Ambiente Dynamics da cui provengono le call (UAT o PROD). */
  environment: Environment;
  /** Anno solare; usato solo se `dateFrom`/`dateTo` non sono specificati. */
  year?: number;
  /** Limite inferiore (incluso) su call_date. Se presente (da solo o con `dateTo`), ha precedenza su `year`. */
  dateFrom?: Date;
  /** Limite superiore (incluso) su call_date. Se presente (da solo o con `dateFrom`), ha precedenza su `year`. */
  dateTo?: Date;
}

/**
 * Risolve le opzioni di sintesi in un range esplicito [from, to] (entrambi
 * opzionali, entrambi inclusi). Se è specificato almeno uno tra `dateFrom`/
 * `dateTo` questi hanno precedenza su `year`; altrimenti si usa l'anno
 * (default: anno corrente UTC), convertito nell'intero anno solare.
 *
 * Isolata dal resto per essere testabile senza database.
 */
export function resolveCallsSummaryRange(
  options: Omit<CallsSummaryOptions, "environment">,
): CallsSummaryRange {
  if (options.dateFrom !== undefined || options.dateTo !== undefined) {
    return { from: options.dateFrom, to: options.dateTo };
  }

  const year = options.year ?? new Date().getUTCFullYear();

  return {
    from: new Date(Date.UTC(year, 0, 1)),
    // Ultimo istante dell'anno: coerente con la semantica "incluso" di `to`,
    // evita di dover mescolare un confronto lt/lte diverso da quello usato
    // per il range esplicito.
    to: new Date(Date.UTC(year + 1, 0, 1) - 1),
  };
}

/**
 * Costruisce la query di aggregazione per prodotto sul range richiesto, senza
 * eseguirla. Isolata per poter essere testata ispezionando l'SQL generato.
 *
 * Ritorna tutti i prodotti con almeno una call nel range (non solo i primi 3):
 * il totale del roster (`getCallsSummary`) deve sommare l'intero range, non
 * solo i prodotti in classifica.
 */
export function buildCallsSummary(
  db: MonitoringDb,
  environment: Environment,
  range: CallsSummaryRange,
) {
  const filters = [eq(calls.environment, environment)];

  if (range.from) {
    filters.push(gte(calls.callDate, range.from));
  }

  if (range.to) {
    filters.push(lte(calls.callDate, range.to));
  }

  return db
    .select({
      productId: calls.productId,
      calls: sql<number>`count(*)`.mapWith(Number),
    })
    .from(calls)
    .where(and(...filters))
    .groupBy(calls.productId)
    .orderBy(desc(sql`count(*)`), asc(calls.productId));
}

/**
 * Aggrega le righe per-prodotto (già ordinate per conteggio) in una sintesi:
 * il totale somma *tutte* le righe, il roster prende solo le prime 3.
 * Isolata dall'esecuzione della query per essere testabile senza database.
 */
export function summarizeCallCounts(
  rows: CallsSummaryProductCount[],
): CallsSummary {
  const totalCalls = rows.reduce((sum, row) => sum + row.calls, 0);
  const roster = rows
    .slice(0, SUMMARY_ROSTER_SIZE)
    .map((row, index) => ({ ...row, position: index + 1 }));

  return { totalCalls, roster };
}

/**
 * Sintesi delle call dell'ambiente per l'anno o il range richiesto (default:
 * anno corrente UTC): totale complessivo e i primi 3 prodotti per numero di call, con
 * posizione in classifica (a parità di conteggio, ordine alfabetico di
 * productId).
 */
export async function getCallsSummary(
  options: CallsSummaryOptions,
): Promise<CallsSummary> {
  const range = resolveCallsSummaryRange(options);
  const rows = await buildCallsSummary(
    getMonitoringDb(),
    options.environment,
    range,
  );

  return summarizeCallCounts(rows);
}
