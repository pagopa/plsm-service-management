import { ReactNode } from "react";

export function TabWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background gap-4 border border-neutral-100 rounded-lg p-4">
      {children}
    </div>
  );
}
