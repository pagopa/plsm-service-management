export type MockTeamStatus = "active" | "draft" | "suspended";

export type MockMemberStatus = "active" | "inactive" | "suspended";

export type MockTeamMember = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: MockMemberStatus;
};

export type MockTeamPermission = {
  id: string;
  name: string;
  code: string;
  area: string;
};

export type MockTeam = {
  id: string;
  name: string;
  description: string;
  department: string;
  createdAt: string;
  createdBy: {
    name: string;
    avatar: string;
  };
  status: MockTeamStatus;
  memberCount: number;
  permissionCount: number;
  members: MockTeamMember[];
  permissions: MockTeamPermission[];
};

const mockMembers = {
  anakin: {
    id: "anakin",
    name: "Anakin Skywalker",
    email: "a.skywalker@email.com",
    avatar: "/mock/teams/anakin-skywalker.png",
    status: "active",
  },
  bojack: {
    id: "bojack",
    name: "Bojack Horseman",
    email: "b.horseman@email.com",
    avatar: "/mock/teams/bojack-horseman.png",
    status: "active",
  },
  todd: {
    id: "todd",
    name: "Todd Chavez",
    email: "t.chavez@email.com",
    avatar: "/mock/teams/todd-chavez.png",
    status: "suspended",
  },
  han: {
    id: "han",
    name: "Han Solo",
    email: "h.solo@email.com",
    avatar: "/mock/teams/han-solo.png",
    status: "inactive",
  },
  leia: {
    id: "leia",
    name: "Leia Organa",
    email: "l.organa@email.com",
    avatar: "/mock/teams/leia-organa.png",
    status: "suspended",
  },
} satisfies Record<string, MockTeamMember>;

export const mockTeams: MockTeam[] = [
  {
    id: "1",
    name: "Service management",
    description: "Team dedicato alle operazioni SM.",
    department: "SM",
    createdAt: "12 giugno 2026",
    createdBy: {
      name: "Giacomo Ferrari",
      avatar: "/mock/teams/giacomo-ferrari.png",
    },
    status: "active",
    memberCount: 18,
    permissionCount: 17,
    members: [
      mockMembers.anakin,
      mockMembers.bojack,
      mockMembers.todd,
      mockMembers.han,
      mockMembers.leia,
    ],
    permissions: [
      {
        id: "overview-search",
        name: "Search",
        code: "overview.search",
        area: "Overview",
      },
      {
        id: "overview-institution-update",
        name: "Institution update",
        code: "overview.institution.update",
        area: "Overview",
      },
      {
        id: "admin-permission-create",
        name: "Create permission",
        code: "admin.permission.create",
        area: "Admin",
      },
    ],
  },
  {
    id: "2",
    name: "Admin",
    description: "Team per admin SMCR.",
    department: "Platform",
    createdAt: "18 giugno 2026",
    createdBy: {
      name: "Giacomo Ferrari",
      avatar: "/mock/teams/giacomo-ferrari.png",
    },
    status: "draft",
    memberCount: 4,
    permissionCount: 6,
    members: [
      mockMembers.anakin,
      mockMembers.bojack,
      mockMembers.han,
      mockMembers.leia,
    ],
    permissions: [
      {
        id: "admin-team-read",
        name: "Read teams",
        code: "admin.team.read",
        area: "Admin",
      },
      {
        id: "admin-team-update",
        name: "Update team",
        code: "admin.team.update",
        area: "Admin",
      },
      {
        id: "admin-member-assign",
        name: "Assign member",
        code: "admin.member.assign",
        area: "Admin",
      },
    ],
  },
  {
    id: "3",
    name: "Portale fatturazione",
    description: "Team per la gestione di PF.",
    department: "PF",
    createdAt: "24 giugno 2026",
    createdBy: {
      name: "Giacomo Ferrari",
      avatar: "/mock/teams/giacomo-ferrari.png",
    },
    status: "suspended",
    memberCount: 12,
    permissionCount: 5,
    members: [mockMembers.anakin, mockMembers.todd, mockMembers.leia],
    permissions: [
      {
        id: "billing-read",
        name: "Read billing files",
        code: "billing.files.read",
        area: "Fatturazione",
      },
      {
        id: "billing-upload",
        name: "Upload billing file",
        code: "billing.files.upload",
        area: "Fatturazione",
      },
      {
        id: "billing-download",
        name: "Download billing file",
        code: "billing.files.download",
        area: "Fatturazione",
      },
    ],
  },
];

export function getMockTeamById(teamId: string) {
  return mockTeams.find((team) => team.id === teamId);
}
