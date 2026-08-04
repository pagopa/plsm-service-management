import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getMockTeamById, mockTeams } from "../mock-data";
import { TeamDetailView, TeamsListView } from "../team-management-ui";

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
    expect(html).toContain('title="Bozza"');
    expect(html).toContain('title="Sospeso"');
  });

  it("renders the selected team summary, members and permissions", () => {
    const team = getMockTeamById("1");

    expect(team).toBeDefined();

    const html = renderToStaticMarkup(<TeamDetailView team={team!} />);

    expect(html).toContain("Service management");
    expect(html).toContain("Anakin Skywalker");
    expect(html).toContain("overview.search");
    expect(html).toContain("Aggiungi utente");
    expect(html).toContain("Aggiungi permesso");
  });
});
