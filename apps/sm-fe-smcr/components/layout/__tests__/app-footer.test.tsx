import { renderToStaticMarkup } from "react-dom/server";
import { AppFooter } from "@/components/layout/app-footer";

describe("AppFooter", () => {
  it("renders a full-width legal footer bar in document flow", () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain("mt-8");
    expect(html).toContain("shrink-0");
    expect(html).toContain("w-full");
    expect(html).not.toContain("fixed");
  });

  it("keeps the legal text centered", () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain("max-w-6xl");
    expect(html).toContain("font-medium");
    expect(html).toContain("text-sm");
    expect(html).toContain("PagoPA S.p.A.");
  });
});
