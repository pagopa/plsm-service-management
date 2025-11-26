"use client";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalConfig";

export const LoginForm = () => {
  return (
    <div className="flex items-center justify-center">
      <MicrosoftLoginButton />
    </div>
  );
};

export const MicrosoftLoginButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    // const redirectUri = process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI;
    // const loginRequestWithRedirect = {
    //   ...loginRequest,
    //   redirectUri,
    // };

    instance.loginRedirect(loginRequest).catch((error) => {
      console.error("Login error:", error);
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 bg-white text-[#5E5E5E] border border-[#8C8C8C] rounded-md px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
    >
      <MicrosoftLogoIcon className="w-5 h-5" />
      <span>Sign in with Microsoft</span>
    </button>
  );
};

// Componente SVG per il logo
const MicrosoftLogoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 23 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11.5 11.5H1V1H11.5V11.5Z" fill="#F25022" />
    <path d="M22 11.5H11.5V1H22V11.5Z" fill="#7FBA00" />
    <path d="M11.5 22H1V11.5H11.5V22Z" fill="#00A4EF" />
    <path d="M22 22H11.5V11.5H22V22Z" fill="#FFB900" />
  </svg>
);
