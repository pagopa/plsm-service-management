import { renderToStaticMarkup } from "react-dom/server";
import { AppFooter } from "@/components/layout/app-footer";

describe("AppFooter", () => {
  it("renders the SMCR legal copy and responsive line break", () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain("PagoPA S.p.A.");
    expect(html).toContain("Società per azioni con socio unico");
    expect(html).toContain("Registro Imprese di Roma");
    expect(html).toContain("P.IVA 15376371009");
    expect(html).toContain("<br");
  });
});
