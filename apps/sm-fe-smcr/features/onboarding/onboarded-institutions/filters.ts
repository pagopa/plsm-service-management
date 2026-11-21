export const ONBOARDED_INSTITUTIONS_PATH = "/dashboard/onboarding/enti";

export type OnboardedInstitutionsFilters = {
  product: string;
  from: string;
  to: string;
  search: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const romeDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Giorno (Europe/Rome) in formato `YYYY-MM-DD`. */
export function toRomeDay(date: Date | number) {
  return romeDayFormatter.format(date);
}

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function parseDay(value: string | string[] | undefined) {
  const day = firstValue(value);
  return DAY_REGEX.test(day) ? day : "";
}

export function parseOnboardedInstitutionsFilters(
  searchParams: SearchParams,
): OnboardedInstitutionsFilters {
  return {
    product: firstValue(searchParams.product),
    from: parseDay(searchParams.from),
    to: parseDay(searchParams.to),
    search: firstValue(searchParams.search),
  };
}

export function buildOnboardedInstitutionsHref(
  filters: Partial<OnboardedInstitutionsFilters>,
) {
  const params = new URLSearchParams();
  if (filters.product) params.set("product", filters.product);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const search = filters.search?.trim();
  if (search) params.set("search", search);
  const query = params.toString();
  return query
    ? `${ONBOARDED_INSTITUTIONS_PATH}?${query}`
    : ONBOARDED_INSTITUTIONS_PATH;
}

/** Mese corrente (Europe/Rome): dal 1° del mese a oggi incluso. */
export function currentMonthRange(now = new Date()) {
  const to = toRomeDay(now);
  return { from: `${to.slice(0, 8)}01`, to };
}
