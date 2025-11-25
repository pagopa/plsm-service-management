import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/sessionProvider";
import { hasAccess } from "@/lib/checkAccess";

type RouteAccessResult = {
  canAccess: boolean | null;
  isChecking: boolean;
  reason: "not_authenticated" | "insufficient_permissions" | null;
};

export function useRouteAccess(): RouteAccessResult {
  const { user, isReady } = useSession();
  const pathname = usePathname();

  return useMemo(() => {
    // Still loading session data
    if (!isReady) {
      return {
        canAccess: null,
        isChecking: true,
        reason: null,
      };
    }

    // Check if user has access to current route
    const allowed = hasAccess(user, pathname);

    return {
      canAccess: allowed,
      isChecking: false,
      reason: !allowed
        ? !user
          ? "not_authenticated"
          : "insufficient_permissions"
        : null,
    };
  }, [user, pathname, isReady]);
}
