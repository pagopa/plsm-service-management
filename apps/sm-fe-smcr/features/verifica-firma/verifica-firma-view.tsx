"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  FileSignature,
  Globe,
  HelpCircle,
  ShieldCheck,
  UploadCloud,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { validateSignature } from "@/lib/services/verifica-firma.service";
import { cn } from "@/lib/utils";
import {
  SignatureIndication,
  SignatureResult,
  ValidationResponse,
} from "./types";

const ACCEPTED = ".pdf,.p7m";

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "long",
  timeStyle: "short",
});

function formatSigningTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

function fileTypeLabel(type: ValidationResponse["fileType"]): string {
  return type === "pdf" ? "PDF firmato (PAdES)" : "Busta crittografica (.p7m)";
}

/* ============================== INDICATION META ============================== */
const INDICATION_META: Record<
  SignatureIndication,
  {
    label: string;
    icon: typeof CheckCircle2;
    badge: string;
    ring: string;
    iconTone: string;
  }
> = {
  TOTAL_PASSED: {
    label: "VALIDA",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-700",
    ring: "border-green-200",
    iconTone: "bg-green-600 text-white",
  },
  INDETERMINATE: {
    label: "INDETERMINATA",
    icon: HelpCircle,
    badge: "bg-amber-100 text-amber-700",
    ring: "border-amber-200",
    iconTone: "bg-amber-500 text-white",
  },
  TOTAL_FAILED: {
    label: "NON VALIDA",
    icon: XCircle,
    badge: "bg-red-100 text-red-700",
    ring: "border-red-200",
    iconTone: "bg-red-600 text-white",
  },
};

/* ============================== FIELD ============================== */
function Field({
  icon: Ico,
  label,
  children,
  mono,
}: {
  icon: typeof User;
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

/* ============================== SIGNATURE CARD ============================== */
function SignatureCard({
  index,
  total,
  signature,
}: {
  index: number;
  total: number;
  signature: SignatureResult;
}) {
  const meta = INDICATION_META[signature.indication];
  const Ico = meta.icon;

  return (
    <Card className={cn("overflow-hidden border p-0", meta.ring)}>
      <div className="flex items-center gap-4 border-b p-5">
        <div
          className={cn(
            "grid size-[50px] shrink-0 place-items-center rounded-2xl shadow-sm",
            meta.iconTone,
          )}
        >
          <Ico className="size-6" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <User className="text-muted-foreground size-3.5" />
            {signature.signerName || "Firmatario sconosciuto"}
          </div>
          <div className="text-muted-foreground text-[13px] font-semibold">
            Firma {index + 1} di {total}
          </div>
        </div>
        <Badge
          className={cn(
            "ml-auto shrink-0 px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide",
            meta.badge,
          )}
        >
          {meta.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-px border-b bg-neutral-100 md:grid-cols-4">
        <Field icon={Building2} label="Certificatore (QTSP)">
          {signature.qtsp || "—"}
        </Field>
        <Field icon={Globe} label="Paese">
          {signature.country || "—"}
        </Field>
        <Field icon={ShieldCheck} label="Livello firma" mono>
          {signature.signatureLevel || "—"}
        </Field>
        <Field icon={Calendar} label="Data e ora firma">
          {formatSigningTime(signature.signingTime)}
        </Field>
      </div>

      {signature.issues && signature.issues.length > 0 && (
        <div className="flex flex-col gap-2 p-5">
          {signature.issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============================== RESULT STAGE ============================== */
function ResultStage({
  result,
  onReset,
}: {
  result: ValidationResponse;
  onReset: () => void;
}) {
  const allValid =
    result.validSignatures === result.totalSignatures &&
    result.totalSignatures > 0;
  const noneValid = result.validSignatures === 0;

  const summaryTone = allValid
    ? "bg-green-100 text-green-700"
    : noneValid
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="max-w-[1100px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Esito verifica</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Risultato della verifica delle firme digitali presenti nel
            documento.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          <ArrowLeft className="size-3.5" />
          Verifica un altro file
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="grid size-[50px] shrink-0 place-items-center rounded-2xl bg-linear-to-br from-teal-500 to-teal-300 text-white shadow-sm">
            <FileText className="size-5.5" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div
              className="truncate text-lg font-extrabold tracking-tight"
              title={result.fileName}
            >
              {result.fileName}
            </div>
            <div className="text-muted-foreground text-[13px] font-semibold">
              {fileTypeLabel(result.fileType)}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <Badge
              className={cn(
                "px-3 py-1.5 text-[13px] font-extrabold",
                summaryTone,
              )}
            >
              {result.validSignatures}/{result.totalSignatures} firme valide
            </Badge>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {result.signatures.map((sig, i) => (
          <SignatureCard
            key={i}
            index={i}
            total={result.totalSignatures}
            signature={sig}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================== UPLOAD STAGE ============================== */
function UploadStage({
  file,
  error,
  pending,
  onSelect,
  onClear,
  onVerify,
}: {
  file: File | null;
  error: string;
  pending: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onVerify: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6">
      <div className="mb-5 grid size-16 place-items-center rounded-[18px] bg-teal-50 text-teal-700 shadow-sm">
        <FileSignature className="size-6" />
      </div>
      <h1 className="mb-2.5 text-center text-3xl font-extrabold tracking-tight">
        Verifica firma
      </h1>
      <p className="text-muted-foreground mb-7 max-w-md text-center text-[15px] leading-relaxed">
        Carica un documento firmato (<span className="font-semibold">.pdf</span>{" "}
        o <span className="font-semibold">.p7m</span>) per verificarne le firme
        digitali in autonomia, senza strumenti esterni.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) onSelect(dropped);
        }}
        className={cn(
          "flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-colors",
          dragActive
            ? "border-teal-500 bg-teal-50"
            : "border-neutral-300 hover:border-teal-400",
        )}
      >
        <UploadCloud className="size-9 text-teal-600" />
        <div className="text-[15px] font-semibold">
          Trascina il file qui o clicca per selezionare
        </div>
        <div className="text-muted-foreground text-xs font-medium">
          Formati supportati: PDF, P7M · max 20MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) onSelect(selected);
            e.target.value = "";
          }}
        />
      </div>

      {file && (
        <div className="mt-4 flex w-full max-w-xl items-center justify-between gap-4 rounded-xl border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="size-5 shrink-0 text-teal-600" />
            <div className="flex min-w-0 flex-col">
              <span
                className="truncate text-sm font-semibold"
                title={file.name}
              >
                {file.name}
              </span>
              <span className="text-muted-foreground text-xs">
                {(file.size / 1048576).toFixed(2)} MB
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onClear}
            aria-label="Rimuovi file"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "mt-3.5 min-h-[18px] text-center text-[13px]",
          error ? "text-destructive font-semibold" : "text-transparent",
        )}
        role={error ? "alert" : undefined}
      >
        {error || "."}
      </div>

      <Button
        type="button"
        disabled={!file || pending}
        onClick={onVerify}
        className="mt-1 min-w-[200px] bg-teal-600 px-6 hover:bg-teal-700"
      >
        {pending ? (
          <>
            <Spinner className="size-4" />
            Verifica in corso…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" />
            Verifica firma
          </>
        )}
      </Button>
    </div>
  );
}

/* ============================== MAIN VIEW ============================== */
export function VerificaFirmaView() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const verify = () => {
    if (!file) return;
    setError("");
    startTransition(async () => {
      const res = await validateSignature(file);
      if (res.error || !res.data) {
        setError(res.error ?? "Errore durante la verifica della firma.");
        return;
      }
      setResult(res.data);
    });
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  if (result) {
    return <ResultStage result={result} onReset={reset} />;
  }

  return (
    <UploadStage
      file={file}
      error={error}
      pending={pending}
      onSelect={(f) => {
        setFile(f);
        setError("");
      }}
      onClear={reset}
      onVerify={verify}
    />
  );
}
