import { renderToStaticMarkup } from "react-dom/server";
import { AppFooter } from "@/components/layout/app-footer";

describe("AppFooter", () => {
  it("renders a fixed full-width legal footer bar", () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain("fixed");
    expect(html).toContain("inset-x-0");
    expect(html).toContain("bottom-0");
    expect(html).toContain("w-full");
    expect(html).toContain("z-0");
  });

  it("keeps the legal text centered with stronger visual rhythm", () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain("max-w-6xl");
    expect(html).toContain("font-medium");
    expect(html).toContain("text-[15px]");
    expect(html).toContain("PagoPA S.p.A.");
  });
});
