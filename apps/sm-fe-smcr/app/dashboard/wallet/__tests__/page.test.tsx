jest.mock("server-only", () => ({}));

import { PermissionGate } from "@/components/auth/permission-gate";
import EserviceTemplatesPage from "../eservice-templates/page";
import WalletPage from "../page";

describe("wallet route permissions", () => {
  it.each([
    {
      Page: WalletPage,
      permission: "wallet.read",
      returnUrl: "/dashboard/wallet",
    },
    {
      Page: EserviceTemplatesPage,
      permission: "wallet.templates.read",
      returnUrl: "/dashboard/wallet/eservice-templates",
    },
  ])("configures $returnUrl with $permission", ({ Page, permission, returnUrl }) => {
    const element = Page();

    expect(element.type).toBe(PermissionGate);
    expect(element.props).toMatchObject({ permission, returnUrl });
  });
});
