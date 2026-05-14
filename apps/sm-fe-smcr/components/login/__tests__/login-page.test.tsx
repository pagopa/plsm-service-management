import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    className,
  }: {
    alt: string;
    className?: string;
  }) => <div data-alt={alt} className={className} />,
}));

jest.mock("public/login_bg.png", () => ({
  __esModule: true,
  default: { src: "/login_bg.png" },
}), { virtual: true });

jest.mock("public/logo_4.svg", () => ({
  __esModule: true,
  default: { src: "/logo_4.svg" },
}), { virtual: true });

jest.mock("../../auth/login", () => ({
  LoginForm: () => <div>login form</div>,
}));

jest.mock("../../ui/switch", () => ({
  Switch: () => <button type="button">toggle</button>,
}));

jest.mock("@/config/env", () => ({
  clientEnv: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

jest.mock("@/lib/logger/logger.client", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

import { LoginPage } from "../login-page";

describe("LoginPage", () => {
  it("keeps the original full-height login split layout", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain("h-screen");
    expect(html).toContain("mt-52");
    expect(html).toContain("absolute left-0 bottom-0");
    expect(html).toContain('data-alt="login image"');
    expect(html).toContain("Team PLSM");
  });
});
