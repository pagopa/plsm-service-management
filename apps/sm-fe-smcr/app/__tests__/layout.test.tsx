import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("../globals.css", () => ({}), { virtual: true });

jest.mock("next/font/google", () => ({
  Space_Grotesk: () => ({ className: "space-grotesk" }),
}));

jest.mock("sonner", () => ({
  Toaster: () => null,
}));

jest.mock("nuqs/adapters/next/app", () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/context/sessionProvider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

let RootLayout: typeof import("@/app/layout").default;

beforeAll(async () => {
  ({ default: RootLayout } = await import("@/app/layout"));
});

describe("RootLayout", () => {
  it("wraps the app providers without forcing the global footer into public routes", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>page content</div>
      </RootLayout>,
    );

    expect(html).toContain("min-h-screen");
    expect(html).toContain("flex-col");
    expect(html).toContain("flex-1");
    expect(html).toContain("shrink-0");
    expect(html).toContain("PagoPA S.p.A.");
  });
});
