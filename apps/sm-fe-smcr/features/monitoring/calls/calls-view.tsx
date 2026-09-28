"use client";

import { Phone, Search, X } from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  CALL_PRODUCT_IDS,
  CALL_PRODUCT_LABELS,
  CALLS_LIMIT_DEFAULT,
  CALLS_LIMIT_MAX,
  type CallFieldError,
  type ListCallsInput,
  type MonitoringCall,
} from "@/lib/services/calls.schema";
import { listCalls } from "@/lib/services/calls.service";
import { cn } from "@/lib/utils";

import { DateTimeFilter } from "./date-time-filter";
import { CallsTable, callsColumns } from "./table";

const ALL_PRODUCTS = "all";
const fmtNum = new Intl.NumberFormat("it-IT");

type FormState = {
  productId: string;
  institutionId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  limit: string;
};

function createInitialForm(): FormState {
  return {
    productId: ALL_PRODUCTS,
    institutionId: "",
    dateFrom: undefined,
    dateTo: undefined,
    limit: String(CALLS_LIMIT_DEFAULT),
  };
}

function toListCallsInput(form: FormState): ListCallsInput {
  return {
    productId: form.productId === ALL_PRODUCTS ? undefined : form.productId,
    institutionId: form.institutionId.trim() || undefined,
    dateFrom: form.dateFrom ? form.dateFrom.toISOString() : undefined,
    dateTo: form.dateTo ? form.dateTo.toISOString() : undefined,
    limit: form.limit.trim() || undefined,
  };
}

function isDefaultForm(form: FormState) {
  return (
    form.productId === ALL_PRODUCTS &&
    form.institutionId.trim() === "" &&
    !form.dateFrom &&
    !form.dateTo &&
    form.limit.trim() === String(CALLS_LIMIT_DEFAULT)
  );
}

export function CallsView() {
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [rows, setRows] = useState<MonitoringCall[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CallFieldError[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  const search = useCallback(
    (nextForm: FormState) => {
      const id = ++requestId.current;
      setError(null);
      setFieldErrors([]);

      startTransition(async () => {
        const result = await listCalls(toListCallsInput(nextForm));
        if (requestId.current !== id) {
          return;
        }

        setHasLoaded(true);
        if (result.success) {
          setRows(result.data);
          setCount(result.count);
          setError(null);
          setFieldErrors([]);
          return;
        }

        setFieldErrors(result.fields ?? []);
        setError(
          result.fields && result.fields.length > 0 ? null : result.message,
        );
      });
    },
    [startTransition],
  );

  useEffect(() => {
    search(createInitialForm());
  }, [search]);

  const errorFor = (field: string) =>
    fieldErrors.find((item) => item.field === field)?.message;

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setFieldErrors([]);
    setError(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(form);
  };

  const clearFilters = () => {
    const nextForm = createInitialForm();
    setForm(nextForm);
    search(nextForm);
  };

  const hasFieldErrors = fieldErrors.length > 0;
  const showInitialLoading = !hasLoaded && isPending;
  const showTable = rows.length > 0 || (hasLoaded && !error && !hasFieldErrors);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
      </header>

      <Card className="gap-0 overflow-hidden border py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 md:p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              Filtri di ricerca
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errorFor("productId"))}>
                <FieldLabel htmlFor="calls-product">Prodotto</FieldLabel>
                <Select
                  value={form.productId}
                  onValueChange={(value) => updateForm({ productId: value })}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="calls-product"
                    className="w-full"
                    aria-invalid={Boolean(errorFor("productId")) || undefined}
                  >
                    <SelectValue placeholder="Tutti i prodotti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_PRODUCTS}>
                      Tutti i prodotti
                    </SelectItem>
                    {CALL_PRODUCT_IDS.map((productId) => (
                      <SelectItem key={productId} value={productId}>
                        {CALL_PRODUCT_LABELS[productId]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errorFor("productId")}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errorFor("institutionId"))}>
                <FieldLabel htmlFor="calls-institution">ID ente</FieldLabel>
                <Input
                  id="calls-institution"
                  value={form.institutionId}
                  disabled={isPending}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="GUID dell'ente"
                  aria-invalid={Boolean(errorFor("institutionId")) || undefined}
                  onChange={(event) =>
                    updateForm({ institutionId: event.target.value })
                  }
                />
                <FieldDescription>Facoltativo. Formato GUID.</FieldDescription>
                <FieldError>{errorFor("institutionId")}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errorFor("dateFrom"))}>
                <FieldLabel htmlFor="calls-date-from">Data da</FieldLabel>
                <DateTimeFilter
                  id="calls-date-from"
                  boundary="from"
                  value={form.dateFrom}
                  disabled={isPending}
                  invalid={Boolean(errorFor("dateFrom"))}
                  onChange={(dateFrom) => updateForm({ dateFrom })}
                />
                <FieldDescription>
                  Limite inferiore incluso, ora locale.
                </FieldDescription>
                <FieldError>{errorFor("dateFrom")}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errorFor("dateTo"))}>
                <FieldLabel htmlFor="calls-date-to">Data a</FieldLabel>
                <DateTimeFilter
                  id="calls-date-to"
                  boundary="to"
                  value={form.dateTo}
                  disabled={isPending}
                  invalid={Boolean(errorFor("dateTo"))}
                  onChange={(dateTo) => updateForm({ dateTo })}
                />
                <FieldDescription>
                  Limite superiore incluso, ora locale.
                </FieldDescription>
                <FieldError>{errorFor("dateTo")}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errorFor("limit"))}>
                <FieldLabel htmlFor="calls-limit">Limite</FieldLabel>
                <Input
                  id="calls-limit"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={CALLS_LIMIT_MAX}
                  step={1}
                  value={form.limit}
                  disabled={isPending}
                  aria-invalid={Boolean(errorFor("limit")) || undefined}
                  onChange={(event) =>
                    updateForm({ limit: event.target.value })
                  }
                />
                <FieldDescription>
                  Da 1 a {CALLS_LIMIT_MAX}. Predefinito {CALLS_LIMIT_DEFAULT}.
                </FieldDescription>
                <FieldError>{errorFor("limit")}</FieldError>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Spinner aria-label="Ricerca in corso" />
                ) : (
                  <Search />
                )}
                Cerca
              </Button>
              {!isDefaultForm(form) && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={clearFilters}
                >
                  <X className="size-3.5" />
                  Azzera filtri
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-4 border-t pt-4">
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            {showInitialLoading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
                <Spinner aria-label="Caricamento" />
                Caricamento call…
              </div>
            ) : (
              showTable && (
                <>
                  <div className="text-muted-foreground text-sm">
                    <span className="text-foreground font-semibold tabular-nums">
                      {fmtNum.format(count)}
                    </span>{" "}
                    {count === 1 ? "risultato" : "risultati"}
                  </div>
                  <div className={cn(isPending && "opacity-60")}>
                    <CallsTable
                      columns={callsColumns}
                      data={rows}
                      isEmpty={hasLoaded && rows.length === 0 && !error}
                    />
                  </div>
                </>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
