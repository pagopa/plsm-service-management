import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  EllipsisVertical,
  Funnel,
  Plus,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { MockMemberStatus, MockTeam, MockTeamStatus } from "./mock-data";

export type TeamsListTeam = {
  id: number | string;
  description: string;
  memberCount: number;
  name: string;
  status: MockTeamStatus;
};

const teamStatusPresentation: Record<
  MockTeamStatus,
  { label: string; className: string }
> = {
  active: { label: "Attivo", className: "bg-[#00c950]" },
  draft: { label: "Bozza", className: "bg-[#fe9a00]" },
  suspended: { label: "Sospeso", className: "bg-[#fb2c36]" },
};

const memberStatusPresentation: Record<
  MockMemberStatus,
  { label: string; className: string }
> = {
  active: { label: "Attivo", className: "text-[#00a63e]" },
  inactive: { label: "Inattivo", className: "text-[#737373]" },
  suspended: { label: "Sospeso", className: "text-[#fb2c36]" },
};

export function TeamManagementBreadcrumb() {
  return (
    <header className="flex h-16 w-full shrink-0 items-center border-b border-neutral-100 px-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-3 whitespace-nowrap text-base"
      >
        <span className="text-neutral-500">Admin</span>
        <span aria-hidden="true" className="text-neutral-500">
          /
        </span>
        <Link
          href="/dashboard/teams"
          className="text-neutral-800 transition-colors hover:text-black"
        >
          Teams
        </Link>
      </nav>
    </header>
  );
}

function SectionActions() {
  const actions = [
    { label: "Cerca", icon: Search },
    { label: "Ordina", icon: ArrowUpDown },
    { label: "Filtra", icon: Funnel },
  ];

  return (
    <div className="flex items-center gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          aria-label={action.label}
          title={action.label}
          className="rounded-sm text-neutral-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <action.icon className="size-3" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  headingLevel = 2,
}: {
  title: string;
  count: string;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <div className="flex w-full items-center justify-between px-2 sm:px-4">
      <div className="flex items-baseline gap-3 whitespace-nowrap">
        <Heading className="text-base font-medium text-black">{title}</Heading>
        <span className="text-xs text-neutral-500">{count}</span>
      </div>

      <SectionActions />
    </div>
  );
}

function DashedAction({ label }: { label: string }) {
  return (
    <div className="w-full px-2 sm:px-4">
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-xs font-medium text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Plus className="size-3" strokeWidth={1.75} />
        {label}
      </button>
    </div>
  );
}

function TeamStatusIndicator({ status }: { status: MockTeamStatus }) {
  const presentation = teamStatusPresentation[status];

  return (
    <span
      title={presentation.label}
      aria-label={`Stato team: ${presentation.label}`}
      className={cn("h-3 w-0.5 shrink-0 rounded-sm", presentation.className)}
    />
  );
}

export function TeamsListView({ teams }: { teams: TeamsListTeam[] }) {
  return (
    <section className="mx-auto flex w-full max-w-[544px] flex-col gap-4 px-4 py-6 sm:px-0">
      <SectionHeader
        title="Teams"
        count={`${teams.length} teams`}
        headingLevel={1}
      />
      <DashedAction label="Crea team" />

      <div className="flex w-full flex-col gap-1">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/dashboard/teams/${team.id}`}
            className="group flex w-full items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4"
          >
            <div className="flex min-w-0 items-center gap-2">
              <TeamStatusIndicator status={team.status} />

              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-sm text-black">{team.name}</span>
                <span className="truncate text-xs text-neutral-500">
                  {team.description}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-baseline gap-1 font-mono">
              <span className="text-sm text-black">{team.memberCount}</span>
              <span className="text-xs text-neutral-500">utenti</span>
            </div>
          </Link>
        ))}

        {teams.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">
            Nessun team disponibile.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-6 text-sm">
      <dt className="w-32 shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-neutral-800">{children}</dd>
    </div>
  );
}

function TeamSummary({ team }: { team: MockTeam }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between px-2">
        <h1 className="text-base font-medium text-black">{team.name}</h1>
        <button
          type="button"
          aria-label="Azioni team"
          title="Azioni team"
          className="rounded-sm text-neutral-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <EllipsisVertical className="size-3" strokeWidth={1.75} />
        </button>
      </div>

      <dl className="flex w-full flex-col gap-3 px-2">
        <DetailField label="Creato da">
          <span className="flex items-center gap-1.5">
            <Image
              src={team.createdBy.avatar}
              alt=""
              width={16}
              height={16}
              className="size-4 rounded-sm border border-neutral-200 object-cover"
            />
            <span>{team.createdBy.name}</span>
          </span>
        </DetailField>
        <DetailField label="Descrizione">{team.description}</DetailField>
        <DetailField label="Reparto">{team.department}</DetailField>
        <DetailField label="Data creazione">{team.createdAt}</DetailField>
      </dl>
    </section>
  );
}

function TeamMembers({ team }: { team: MockTeam }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="px-0 sm:-mx-2">
        <SectionHeader title="Utenti" count={`${team.members.length} utenti`} />
      </div>
      <div className="px-0 sm:-mx-2">
        <DashedAction label="Aggiungi utente" />
      </div>

      <div className="flex w-full flex-col gap-3">
        {team.members.map((member) => {
          const status = memberStatusPresentation[member.status];

          return (
            <div
              key={member.id}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src={member.avatar}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0 rounded-sm border border-neutral-200 object-cover"
                />
                <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="shrink-0 text-sm text-black">
                    {member.name}
                  </span>
                  <span className="truncate text-xs text-neutral-500">
                    {member.email}
                  </span>
                </div>
              </div>

              <span className={cn("shrink-0 text-xs", status.className)}>
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TeamPermissions({ team }: { team: MockTeam }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="px-0 sm:-mx-2">
        <SectionHeader
          title="Permessi"
          count={`${team.permissionCount} permessi`}
        />
      </div>
      <div className="px-0 sm:-mx-2">
        <DashedAction label="Aggiungi permesso" />
      </div>

      <div className="flex w-full flex-col gap-3">
        {team.permissions.map((permission) => (
          <div
            key={permission.id}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-label="Permesso attivo"
                className="h-3 w-0.5 shrink-0 rounded-sm bg-[#00c950]"
              />
              <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-sm text-black">
                  {permission.name}
                </span>
                <code className="truncate font-mono text-xs text-neutral-500">
                  {permission.code}
                </code>
              </div>
            </div>

            <span className="shrink-0 font-mono text-xs text-neutral-800">
              {permission.area}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamDetailView({ team }: { team: MockTeam }) {
  return (
    <div className="mx-auto flex w-full max-w-[528px] flex-col gap-8 px-4 py-6 sm:px-0">
      <TeamSummary team={team} />
      <TeamMembers team={team} />
      <TeamPermissions team={team} />
    </div>
  );
}
