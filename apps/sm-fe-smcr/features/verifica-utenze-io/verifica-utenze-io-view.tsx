"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Globe,
  Layers,
  Mail,
  Minus,
  Search,
  Smartphone,
  SlidersHorizontal,
} from "lucide-react";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getIoProfile,
  getIoProfileVersions,
  getIoServicePreferences,
  type IoProfile,
  type IoServicePreferences,
} from "@/lib/services/verifica-utenze-io.service";
import { cn } from "@/lib/utils";

const CF_RE = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
const fmtNum = new Intl.NumberFormat("it-IT");
const PAGE_SIZE = 8;
const RECENT_KEY = "io-profile-history";
const RECENT_MAX = 5;

type RecentProfile = { cf: string; email: string };

const KNOWN_SERVICES = [
  { id: "01FR2NAY2C2BJKGNHF2SJ4YQ1A", name: "Comune di Milano — Avvisi TARI" },
  {
    id: "01HQ8M5K3P9V2N7XB4RW6TZC0D",
    name: "INPS — Comunicazioni previdenziali",
  },
  {
    id: "01J5KW9D7E3A1F8GH2QM6PYV4N",
    name: "Agenzia delle Entrate — Cartelle",
  },
];

function copy(text: string) {
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    /* noop */
  }
}

/* ============================== STATUS FLAG ============================== */
type FlagKind = "good" | "risk";

function StatusFlag({
  label,
  value,
  kind = "good",
}: {
  label: string;
  value: boolean | null | undefined;
  kind?: FlagKind;
}) {
  const on = Boolean(value);
  const isRisk = kind === "risk";

  const tone = isRisk
    ? on
      ? "bg-amber-50 text-amber-700"
      : "bg-muted text-muted-foreground"
    : on
      ? "bg-green-50 text-green-700"
      : "bg-muted text-muted-foreground";

  const iconTone = isRisk
    ? on
      ? "bg-amber-600 text-white"
      : "bg-neutral-300 text-white"
    : on
      ? "bg-green-600 text-white"
      : "bg-neutral-300 text-white";

  const Ico = isRisk ? (on ? AlertTriangle : Minus) : on ? Check : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-[13px] font-bold",
        tone,
      )}
    >
      <span
        className={cn(
          "inline-grid size-[18px] shrink-0 place-items-center rounded-full",
          iconTone,
        )}
      >
        <Ico className="size-3" strokeWidth={3} />
      </span>
      {label}
    </span>
  );
}

function BoolDot({ value }: { value: boolean | null | undefined }) {
  const on = Boolean(value);
  return (
    <span
      title={on ? "true" : "false"}
      className={cn(
        "inline-grid size-[22px] place-items-center rounded-full",
        on ? "bg-green-50 text-green-700" : "bg-muted text-neutral-400",
      )}
    >
      {on ? (
        <Check className="size-3" strokeWidth={3} />
      ) : (
        <Minus className="size-3" strokeWidth={3} />
      )}
    </span>
  );
}

/* ============================== RAW JSON ============================== */
function RawJson({ title, data }: { title: string; data: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const doCopy = () => {
    copy(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="mt-3.5 overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between bg-[#0d2826] px-3.5 py-2 font-mono text-xs font-semibold text-[#aef0ee]">
        <span>{title}</span>
        <button
          type="button"
          onClick={doCopy}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-[#cdeae9] hover:bg-white/20"
        >
          <Copy className="size-3" />
          {copied ? "Copiato" : "Copia JSON"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto bg-[#0b1f1e] p-4 font-mono text-[12.5px] leading-relaxed text-[#d7eceb]">
        {json}
      </pre>
    </div>
  );
}

/* ============================== SECTION HEADER ============================== */
function SectionHead({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-4 px-0.5">
      <div className="flex items-center gap-2.5 text-[19px] font-extrabold tracking-tight">
        <span className="size-2.5 rounded-full bg-teal-500" />
        {title}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <span className="text-muted-foreground font-mono text-xs font-semibold">
          {sub}
        </span>
      </div>
    </div>
  );
}

/* ============================== FIELD ============================== */
function Field({
  icon: Ico,
  label,
  children,
  mono,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col gap-1.5 p-4">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide">
        <Ico className="size-3.5" />
        {label}
      </div>
      <div
        className={cn(
          "text-foreground text-[15px] font-bold",
          mono && "font-mono text-sm font-semibold",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================== PROFILE CARD ============================== */
function ProfileCard({
  cf,
  profile,
  showRaw,
}: {
  cf: string;
  profile: IoProfile;
  showRaw: boolean;
}) {
  const langs = (profile.preferred_languages ?? [])
    .map((l) => l.replace("_", "-"))
    .join(", ");

  return (
    <section className="mb-6">
      <SectionHead title="Profilo attivo" sub={`GET /profiles/${cf}`} />
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-4 border-b p-5">
          <div className="grid size-[50px] shrink-0 place-items-center rounded-2xl bg-linear-to-br from-teal-500 to-teal-300 text-white shadow-sm">
            <Smartphone className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
              <Mail className="text-muted-foreground size-3.5" />
              {profile.email ?? "—"}
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              <span>Codice fiscale</span>
              <span className="font-mono tracking-wide">{cf}</span>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
            <span className="font-mono text-2xl font-bold leading-none text-teal-700">
              v{profile.version}
            </span>
            <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wide">
              Versione corrente
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-b bg-neutral-100 md:grid-cols-4">
          <Field icon={FileText} label="ToS accettate">
            {profile.accepted_tos_version != null
              ? profile.accepted_tos_version.toFixed(1)
              : "—"}
            <span className="text-muted-foreground ml-1 text-xs font-semibold">
              vers.
            </span>
          </Field>
          <Field icon={Smartphone} label="Ultima versione app" mono>
            {profile.last_app_version ?? "—"}
          </Field>
          <Field icon={Bell} label="Contenuto notifiche">
            {profile.push_notifications_content_type ?? "—"}
          </Field>
          <Field icon={Globe} label="Lingua preferita">
            {langs || "—"}
          </Field>
          <Field icon={Bell} label="Promemoria">
            <span
              className={cn(
                profile.reminder_status === "ENABLED"
                  ? "text-green-700"
                  : "text-muted-foreground",
              )}
            >
              {profile.reminder_status ?? "—"}
            </span>
          </Field>
          <Field icon={SlidersHorizontal} label="Pref. servizi · mode">
            {profile.service_preferences_settings?.mode ?? "—"}
          </Field>
          <Field icon={Layers} label="Pref. servizi · vers." mono>
            #{profile.service_preferences_settings?.version ?? 0}
          </Field>
          <Field icon={Layers} label="Versione profilo" mono>
            #{profile.version}
          </Field>
        </div>

        <div className="flex flex-wrap gap-2.5 p-5">
          <StatusFlag
            label="Inbox abilitata"
            value={profile.is_inbox_enabled}
          />
          <StatusFlag
            label="Email validata"
            value={profile.is_email_validated}
          />
          <StatusFlag
            label="Email abilitata"
            value={profile.is_email_enabled}
          />
          <StatusFlag
            label="Webhook abilitato"
            value={profile.is_webhook_enabled}
          />
          <StatusFlag
            label="Profilo di test"
            value={profile.is_test_profile}
            kind="risk"
          />
          <StatusFlag
            label="Email già in uso"
            value={profile.is_email_already_taken}
            kind="risk"
          />
        </div>
      </Card>
      {showRaw && <RawJson title="Response · profilo attivo" data={profile} />}
    </section>
  );
}

/* ============================== VERSIONS CARD ============================== */
function VersionsCard({
  cf,
  versions,
  currentVersion,
  hasMore,
  showRaw,
}: {
  cf: string;
  versions: IoProfile[];
  currentVersion: number;
  hasMore: boolean;
  showRaw: boolean;
}) {
  const [page, setPage] = useState(1);
  const [showDiff, setShowDiff] = useState(true);

  const totalPages = Math.max(1, Math.ceil(versions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = versions.slice(start, start + PAGE_SIZE);
  const localHasMore = safePage < totalPages;

  const changed = (gi: number, key: keyof IoProfile | "sp") => {
    if (!showDiff) return false;
    const cur = versions[gi];
    const prev = versions[gi + 1];
    if (!cur || !prev) return false;
    if (key === "sp") {
      return (
        cur.service_preferences_settings?.version !==
        prev.service_preferences_settings?.version
      );
    }
    return cur[key] !== prev[key];
  };

  return (
    <section className="mb-6">
      <SectionHead
        title="Versioni storiche"
        sub={`GET /profiles/${cf}/versions?page=1&page_size=100`}
      >
        <Label className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
          <Switch checked={showDiff} onCheckedChange={setShowDiff} />
          Evidenzia differenze
        </Label>
      </SectionHead>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                Versione
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                Versione app
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                ToS
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                Validata
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                Inbox
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                Webhook
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                Pref. servizi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const gi = start + i;
              const isCurrent = r.version === currentVersion;
              return (
                <TableRow key={r.version}>
                  <TableCell className="px-4 py-3">
                    <span className="font-mono text-sm font-bold">
                      #{r.version}
                    </span>
                    {isCurrent && (
                      <Badge className="ml-2 bg-teal-100 text-[11px] font-extrabold uppercase tracking-wide text-teal-700">
                        Attuale
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3",
                      changed(gi, "last_app_version") && "bg-teal-500/[0.07]",
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-[13px] font-medium">
                      {r.last_app_version ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3",
                      changed(gi, "accepted_tos_version") &&
                        "bg-teal-500/[0.07]",
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-[13px] font-medium">
                      {r.accepted_tos_version != null
                        ? r.accepted_tos_version.toFixed(1)
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-muted-foreground font-mono text-[13px] font-medium">
                      {r.email ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-center",
                      changed(gi, "is_email_validated") && "bg-teal-500/[0.07]",
                    )}
                  >
                    <BoolDot value={r.is_email_validated} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-center",
                      changed(gi, "is_inbox_enabled") && "bg-teal-500/[0.07]",
                    )}
                  >
                    <BoolDot value={r.is_inbox_enabled} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-center",
                      changed(gi, "is_webhook_enabled") && "bg-teal-500/[0.07]",
                    )}
                  >
                    <BoolDot value={r.is_webhook_enabled} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-3 text-center",
                      changed(gi, "sp") && "bg-teal-500/[0.07]",
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-[13px] font-medium">
                      #{r.service_preferences_settings?.version ?? 0}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="bg-muted/40 text-muted-foreground flex items-center justify-between gap-3 border-t px-4 py-3 text-[13px]">
          <div className="flex items-center gap-3.5">
            <span>
              {fmtNum.format(versions.length === 0 ? 0 : start + 1)} –{" "}
              {fmtNum.format(start + rows.length)} di{" "}
              {fmtNum.format(versions.length)} versioni
            </span>
            {hasMore && (
              <Badge className="gap-1.5 bg-amber-50 text-amber-700">
                <Layers className="size-3" />
                has_more: true
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
              Prec.
            </Button>
            <span className="tabular-nums font-semibold">
              Pagina {safePage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!localHasMore}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Succ.
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>
      {showRaw && (
        <RawJson
          title="Response · versioni (estratto)"
          data={{
            items: versions.slice(0, 2),
            page: 1,
            page_size: 100,
            has_more: hasMore,
          }}
        />
      )}
    </section>
  );
}

/* ============================== SERVICE CARD ============================== */
function ServiceCard({ cf, showRaw }: { cf: string; showRaw: boolean }) {
  const [svc, setSvc] = useState("");
  const [result, setResult] = useState<{
    svc: string;
    data: IoServicePreferences;
  } | null>(null);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  const lookup = (id?: string) => {
    const clean = (id ?? svc).trim().toUpperCase();
    if (id) setSvc(clean);
    if (clean.length < 10) {
      setErr("Inserisci un identificativo servizio valido.");
      return;
    }
    setErr("");
    setResult(null);
    startTransition(async () => {
      const res = await getIoServicePreferences(cf, clean);
      if (res.error || !res.data) {
        setErr(res.error ?? "Errore nel recupero delle preferenze servizio.");
        return;
      }
      setResult({ svc: clean, data: res.data });
    });
  };

  return (
    <section className="mb-6">
      <SectionHead
        title="Preferenze per servizio"
        sub={`GET /profiles/${cf}/services/{servizio}/preferences`}
      />
      <Card className="p-5 md:p-6">
        <CardContent className="p-0">
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            Il codice fiscale è già nel contesto di questa pagina. Inserisci
            l&apos;identificativo del servizio per verificare le preferenze
            impostate dall&apos;utente su quel servizio specifico.
          </p>

          <div className="flex flex-wrap items-stretch gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={svc}
                onChange={(e) => setSvc(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookup();
                }}
                placeholder="Identificativo servizio (es. 01FR2NAY2C2BJKGNHF2SJ4YQ1A)"
                spellCheck={false}
                className="pl-9 font-mono uppercase"
                aria-label="Identificativo servizio"
              />
            </div>
            <Button
              type="button"
              disabled={pending}
              onClick={() => lookup()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {pending ? (
                <>
                  <Spinner className="size-4" />
                  Verifica…
                </>
              ) : (
                "Verifica servizio"
              )}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-bold">
              Servizi noti:
            </span>
            {KNOWN_SERVICES.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => lookup(s.id)}
                title={s.id}
                className="font-normal"
              >
                {s.name}
                <span className="text-muted-foreground font-mono text-[11px]">
                  {s.id.slice(0, 6)}…
                </span>
              </Button>
            ))}
          </div>

          {err && (
            <p className="text-destructive mt-3 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4" />
              {err}
            </p>
          )}

          {result && !pending && (
            <div className="mt-5 border-t pt-5">
              <div className="mb-4 flex items-center gap-2.5 text-[15px] font-extrabold">
                <SlidersHorizontal className="size-4.5 text-teal-700" />
                Preferenze per il servizio
                <span className="text-muted-foreground bg-muted ml-auto rounded-md px-2.5 py-1 font-mono text-xs font-semibold">
                  {result.svc}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <StatusFlag
                  label="Inbox abilitata"
                  value={result.data.is_inbox_enabled}
                />
                <StatusFlag
                  label="Email abilitata"
                  value={result.data.is_email_enabled}
                />
                <StatusFlag
                  label="Webhook abilitato"
                  value={result.data.is_webhook_enabled}
                />
                <StatusFlag
                  label="Accesso stato lettura"
                  value={result.data.can_access_message_read_status}
                />
                <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 py-1.5 pl-2 pr-3.5 text-[13px] font-bold text-teal-700">
                  <span className="inline-grid size-[18px] shrink-0 place-items-center rounded-full bg-teal-600 text-white">
                    <Layers className="size-3" strokeWidth={3} />
                  </span>
                  settings_version #{result.data.settings_version ?? 0}
                </span>
              </div>
              {showRaw && (
                <RawJson
                  title="Response · preferenze servizio"
                  data={result.data}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/* ============================== SEARCH STAGE ============================== */
function SearchStage({
  recent,
  onSearch,
}: {
  recent: RecentProfile[];
  onSearch: (cf: string) => void;
}) {
  const [cf, setCf] = useState("");
  const [err, setErr] = useState("");

  const submit = (value?: string) => {
    const clean = (value ?? cf).trim().toUpperCase();
    if (!clean) {
      setErr("");
      return;
    }
    if (!CF_RE.test(clean)) {
      setErr(
        "Formato codice fiscale non valido (16 caratteri, es. GDAGPP84L16F284J).",
      );
      return;
    }
    setErr("");
    onSearch(clean);
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-[18px] bg-teal-50 text-teal-700 shadow-sm">
        <Smartphone className="size-6" />
      </div>
      <h1 className="mb-2.5 text-3xl font-extrabold tracking-tight">
        Verifica utenze IO
      </h1>
      <p className="text-muted-foreground mb-7 max-w-md text-[15px] leading-relaxed">
        Cerca un cittadino tramite codice fiscale per consultare il profilo IO
        attivo, lo storico delle versioni e le preferenze sui singoli servizi.
      </p>

      <div className="flex w-full max-w-xl items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-md focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100">
        <Search className="text-muted-foreground size-4.5 shrink-0" />
        <input
          value={cf}
          maxLength={16}
          autoFocus
          onChange={(e) => {
            setCf(e.target.value.toUpperCase());
            if (err) setErr("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Inserisci il codice fiscale"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-[17px] font-semibold uppercase tracking-wider outline-none placeholder:font-sans placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal"
          aria-label="Codice fiscale"
        />
        <Button
          type="button"
          onClick={() => submit()}
          className="bg-teal-600 px-5 hover:bg-teal-700"
        >
          Verifica
        </Button>
      </div>
      <div
        className={cn(
          "mt-3.5 min-h-[18px] text-[13px]",
          err ? "text-destructive font-semibold" : "text-muted-foreground",
        )}
      >
        {err || "16 caratteri alfanumerici"}
      </div>

      {recent.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
            Ricerche recenti
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {recent.map((r) => (
              <Button
                key={r.cf}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => submit(r.cf)}
                title={r.email || undefined}
                className="font-mono text-xs font-medium"
              >
                <Smartphone className="size-3.5" />
                {r.cf}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== MAIN VIEW ============================== */
type Stage = "idle" | "loading" | "result";

export function VerificaUtenzeIoView() {
  const [stage, setStage] = useState<Stage>("idle");
  const [cf, setCf] = useState("");
  const [profile, setProfile] = useState<IoProfile | null>(null);
  const [versions, setVersions] = useState<IoProfile[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useLocalStorage<{ items: RecentProfile[] }>(
    RECENT_KEY,
    { items: [] },
  );

  const search = async (code: string) => {
    setCf(code);
    setStage("loading");
    setError("");

    const [profileRes, versionsRes] = await Promise.all([
      getIoProfile(code),
      getIoProfileVersions(code, 1, 100),
    ]);

    if (profileRes.error || !profileRes.data) {
      setError(profileRes.error ?? "Errore nel recupero del profilo IO.");
      setStage("idle");
      return;
    }

    setProfile(profileRes.data);
    setVersions(versionsRes.data?.items ?? []);
    setHasMore(Boolean(versionsRes.data?.has_more));
    setRecent((prev) => ({
      items: [
        { cf: code, email: profileRes.data.email ?? "" },
        ...prev.items.filter((x) => x.cf !== code),
      ].slice(0, RECENT_MAX),
    }));
    setStage("result");
  };

  const reset = () => {
    setStage("idle");
    setProfile(null);
    setVersions([]);
    setHasMore(false);
    setCf("");
    setError("");
  };

  const doCopyCf = () => {
    copy(cf);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const versionsHeader = useMemo(
    () => (profile ? profile.version : 0),
    [profile],
  );

  if (stage === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <Spinner className="size-10 text-teal-600" />
        <p className="text-muted-foreground text-sm font-semibold">
          Recupero del profilo IO per{" "}
          <strong className="font-mono">{cf}</strong>…
        </p>
      </div>
    );
  }

  if (stage === "result" && profile) {
    return (
      <div className="max-w-[1320px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Utenza IO</h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Profilo del cittadino, storico versioni e preferenze sui servizi.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Label className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
              <Switch checked={showRaw} onCheckedChange={setShowRaw} />
              JSON grezzo
            </Label>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card py-1.5 pl-3.5 pr-1.5 font-mono text-sm font-semibold tracking-wide">
              {cf}
              <button
                type="button"
                onClick={doCopyCf}
                title="Copia codice fiscale"
                className="bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-700 grid size-[26px] place-items-center rounded-md"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </span>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <ArrowLeft className="size-3.5" />
              Nuova ricerca
            </Button>
          </div>
        </div>

        <ProfileCard cf={cf} profile={profile} showRaw={showRaw} />
        <VersionsCard
          cf={cf}
          versions={versions}
          currentVersion={versionsHeader}
          hasMore={hasMore}
          showRaw={showRaw}
        />
        <ServiceCard cf={cf} showRaw={showRaw} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p
          className="text-destructive mx-auto mb-2 max-w-xl text-center text-sm font-semibold"
          role="alert"
        >
          {error}
        </p>
      )}
      <SearchStage recent={recent.items} onSearch={search} />
    </div>
  );
}
