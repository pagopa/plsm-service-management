import { AddTeamMemberDialog } from "@/components/teams/add-team-member-dialog";
import { AddTeamPermissionDialog } from "@/components/teams/add-team-permission-dialog";
import { RemoveTeamAssignmentDialog } from "@/components/teams/remove-team-assignment-dialog";
import { TeamActionsMenu } from "@/components/teams/team-actions-menu";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Funnel,
  Search,
} from "lucide-react";
import Link from "next/link";

type TeamStatus = "active" | "inactive";
type MemberStatus = "active" | "suspended";
type PermissionStatus = "active" | "archived";

export type TeamsListTeam = {
  description: string | null;
  id: number | string;
  memberCount: number;
  name: string;
  status: TeamStatus;
};

export type TeamDetailTeam = {
  createdAt: Date;
  createdBy: {
    email: string;
    firstname: string;
    id: number;
    lastname: string;
  } | null;
  department: string | null;
  description: string | null;
  id: number;
  members: Array<{
    email: string;
    firstname: string;
    id: number;
    lastname: string;
    status: MemberStatus;
  }>;
  name: string;
  permissions: Array<{
    code: string;
    description: string | null;
    id: number;
    name: string;
    status: PermissionStatus;
  }>;
  slug: string;
  status: TeamStatus;
};

const teamStatusPresentation: Record<
  TeamStatus,
  { label: string; className: string }
> = {
  active: { label: "Attivo", className: "bg-[#00c950]" },
  inactive: { label: "Inattivo", className: "bg-[#fe9a00]" },
};

const memberStatusPresentation: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  active: { label: "Attivo", className: "text-[#00a63e]" },
  suspended: { label: "Sospeso", className: "text-[#fb2c36]" },
};

const permissionStatusPresentation: Record<
  PermissionStatus,
  { label: string; className: string }
> = {
  active: { label: "Attivo", className: "bg-[#00c950]" },
  archived: { label: "Archiviato", className: "bg-neutral-300" },
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

function TeamStatusIndicator({ status }: { status: TeamStatus }) {
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
      <CreateTeamDialog />

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
                  {team.description || "Nessuna descrizione"}
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

const teamDateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatPermissionArea(code: string) {
  const [area = code] = code.split(".");
  return `${area.charAt(0).toUpperCase()}${area.slice(1)}`;
}

function TeamSummary({ team }: { team: TeamDetailTeam }) {
  const creatorInitials = team.createdBy
    ? `${team.createdBy.firstname.charAt(0)}${team.createdBy.lastname.charAt(0)}`
    : null;

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between px-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-medium text-black">{team.name}</h1>
          <Badge
            variant={team.status === "active" ? "outline-success" : "outline-warning"}
          >
            {team.status === "active" ? "Attivo" : "Inattivo"}
          </Badge>
        </div>
        <TeamActionsMenu
          department={team.department}
          description={team.description}
          status={team.status}
          teamId={team.id}
          teamName={team.name}
        />
      </div>

      <dl className="flex w-full flex-col gap-3 px-2">
        <DetailField label="Creato da">
          {team.createdBy ? (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-neutral-200 bg-neutral-100 text-[8px] font-medium uppercase text-neutral-600"
              >
                {creatorInitials}
              </span>
              <span>
                {team.createdBy.firstname} {team.createdBy.lastname}
              </span>
            </span>
          ) : (
            <span className="text-neutral-500">Non disponibile</span>
          )}
        </DetailField>
        <DetailField label="Descrizione">
          {team.description || (
            <span className="text-neutral-500">Non disponibile</span>
          )}
        </DetailField>
        <DetailField label="Reparto">
          {team.department || (
            <span className="text-neutral-500">Non disponibile</span>
          )}
        </DetailField>
        <DetailField label="Data creazione">
          {teamDateFormatter.format(team.createdAt)}
        </DetailField>
      </dl>
    </section>
  );
}

function TeamMembers({ team }: { team: TeamDetailTeam }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="px-0 sm:-mx-2">
        <SectionHeader title="Utenti" count={`${team.members.length} utenti`} />
      </div>
      <div className="px-0 sm:-mx-2">
        <AddTeamMemberDialog
          members={team.members}
          teamId={team.id}
          teamName={team.name}
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        {team.members.map((member) => {
          const status = memberStatusPresentation[member.status];
          const initials = `${member.firstname.charAt(0)}${member.lastname.charAt(0)}`;

          return (
            <div
              key={member.id}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-neutral-100 text-[8px] font-medium uppercase text-neutral-600"
                >
                  {initials}
                </span>
                <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="shrink-0 text-sm text-black">
                    {member.firstname} {member.lastname}
                  </span>
                  <span className="truncate text-xs text-neutral-500">
                    {member.email}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className={cn("text-xs", status.className)}>
                  {status.label}
                </span>
                <RemoveTeamAssignmentDialog
                  description={`L'utente ${member.firstname} ${member.lastname} non farà più parte di questo team.`}
                  endpoint={`/api/teams/${team.id}/remove-user`}
                  itemName={`${member.firstname} ${member.lastname}`}
                  itemType="utente"
                  payload={{ memberId: member.id }}
                />
              </div>
            </div>
          );
        })}

        {team.members.length === 0 ? (
          <p className="px-2 py-4 text-sm text-neutral-500">
            Nessun utente assegnato.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TeamPermissions({ team }: { team: TeamDetailTeam }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <div className="px-0 sm:-mx-2">
        <SectionHeader
          title="Permessi"
          count={`${team.permissions.length} permessi`}
        />
      </div>
      <div className="px-0 sm:-mx-2">
        <AddTeamPermissionDialog
          permissions={team.permissions}
          teamId={team.id}
          teamName={team.name}
        />
      </div>

      <div className="flex w-full flex-col gap-3">
        {team.permissions.map((permission) => {
          const status = permissionStatusPresentation[permission.status];

          return (
            <div
              key={permission.id}
              title={permission.description ?? undefined}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-label={`Permesso: ${status.label}`}
                  className={cn(
                    "h-3 w-0.5 shrink-0 rounded-sm",
                    status.className,
                  )}
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

              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs text-neutral-800">
                  {formatPermissionArea(permission.code)}
                </span>
                <RemoveTeamAssignmentDialog
                  description={`Il permesso ${permission.code} non sarà più assegnato a questo team.`}
                  endpoint={`/api/teams/${team.id}/permissions`}
                  itemName={permission.name}
                  itemType="permesso"
                  payload={{ permissionId: permission.id }}
                />
              </div>
            </div>
          );
        })}

        {team.permissions.length === 0 ? (
          <p className="px-2 py-4 text-sm text-neutral-500">
            Nessun permesso assegnato.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function TeamDetailView({ team }: { team: TeamDetailTeam }) {
  return (
    <div className="mx-auto flex w-full max-w-[528px] flex-col gap-8 px-4 py-6 sm:px-0">
      <TeamSummary team={team} />
      <TeamMembers team={team} />
      <TeamPermissions team={team} />
    </div>
  );
}
