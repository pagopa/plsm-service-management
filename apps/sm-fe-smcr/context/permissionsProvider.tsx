"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";

const PermissionsContext = createContext<ReadonlySet<string> | undefined>(
  undefined,
);

export function PermissionsProvider({
  permissionCodes,
  children,
}: {
  permissionCodes: string[];
  children: ReactNode;
}) {
  const value = useMemo(() => new Set(permissionCodes), [permissionCodes]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function useHasPermission(permissionCode: string) {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error(
      "useHasPermission deve essere usato dentro PermissionsProvider",
    );
  }
  return context.has(permissionCode);
}
