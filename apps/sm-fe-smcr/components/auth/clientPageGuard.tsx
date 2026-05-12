"use client";

import { useSession } from "@/context/sessionProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader } from "../loader";
import { useRouteAccess } from "@/hooks/useRouteAccess";
import useAuthStore from "@/lib/store/auth.store";
import { readMemberByEmail } from "@/lib/services/members.service";
import clientLogger from "@/lib/logger/logger.client";

export default function ClientPageGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isReady } = useSession();
  const { canAccess, isChecking, reason } = useRouteAccess();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const [isMemberDataLoaded, setIsMemberDataLoaded] = useState(false);

  // Load member data with teams into authStore
  useEffect(() => {
    if (!isReady || !user?.email) {
      setIsMemberDataLoaded(false);
      return;
    }

    readMemberByEmail(user.email).then((result) => {
      if (!result.error && result.data) {
        setAuthUser(result.data);
      }
      setIsMemberDataLoaded(true);
    });
  }, [isReady, user?.email, setAuthUser]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Handle access denied redirects
  useEffect(() => {
    // Don't do anything while still loading or if already redirected
    if (!isReady || isChecking || hasRedirected.current) return;

    // Access denied - redirect once
    if (canAccess === false) {
      hasRedirected.current = true;

      if (reason === "not_authenticated") {
        void clientLogger.warn(
          { info: { event: "access.denied", metadata: { pathname, reason } } },
          "Accesso negato: utente non autenticato",
        );
        router.replace("/unauthorized");
      } else {
        void clientLogger.warn(
          {
            info: {
              event: "access.denied",
              metadata: { user: user?.email, pathname, reason },
            },
          },
          "Accesso negato: permessi insufficienti",
        );
        router.replace("/dashboard");
      }
    }
  }, [canAccess, isChecking, isReady, reason, user, pathname, router]);

  // Show loading state while checking
  if (isLoading || !isReady || isChecking || !isMemberDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-bg-dashboard">
        <Loader text="Ti stiamo autenticando in sicurezza..." />
      </div>
    );
  }

  // Access denied - show nothing while redirecting
  if (canAccess === false) {
    return null;
  }

  // Access granted - render children
  return <>{children}</>;
}
