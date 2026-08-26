import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mockTeams } from "../mock-data";
import {
  type TeamDetailTeam,
  TeamDetailView,
  TeamsListView,
} from "../team-management-ui";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt || undefined} data-image-src={src} />
  ),
}));

describe("Team management mock UI", () => {
  it("links every team row to its detail route and exposes its status", () => {
    const html = renderToStaticMarkup(<TeamsListView teams={mockTeams} />);

    expect(html).toContain('href="/dashboard/teams/1"');
    expect(html).toContain('href="/dashboard/teams/2"');
    expect(html).toContain('href="/dashboard/teams/3"');
    expect(html).toContain('title="Attivo"');
    expect(html).toContain('title="Inattivo"');
  });

  it("renders the selected team summary, members and permissions", () => {
    const team: TeamDetailTeam = {
      createdAt: new Date("2026-06-12T12:00:00.000Z"),
      createdBy: {
        email: "g.ferrari@email.com",
        firstname: "Giacomo",
        id: 2,
        lastname: "Ferrari",
      },
      department: "SM",
      description: "Team dedicato alle operazioni SM.",
      id: 1,
      members: [
        {
          email: "a.skywalker@email.com",
          firstname: "Anakin",
          id: 1,
          lastname: "Skywalker",
          status: "active",
        },
      ],
      name: "Service management",
      permissions: [
        {
          code: "overview.search",
          description: "Ricerca enti",
          id: 1,
          name: "Search",
          status: "active",
        },
      ],
      slug: "service-management",
      status: "active",
    };

    const html = renderToStaticMarkup(<TeamDetailView team={team} />);

    expect(html).toContain("Service management");
    expect(html).toContain("Giacomo");
    expect(html).toContain("Team dedicato alle operazioni SM.");
    expect(html).toContain("SM");
    expect(html).toContain("Anakin Skywalker");
    expect(html).toContain("overview.search");
    expect(html).toContain("Aggiungi utente");
    expect(html).toContain("Aggiungi permesso");
  });
});
