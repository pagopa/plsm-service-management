import { PermissionGate } from "@/components/auth/permission-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGate permission="logs.read" returnUrl="/dashboard/logs">
      <div className="flex h-dvh min-h-[28rem] w-full min-w-0 max-w-full flex-col gap-3 overflow-y-auto bg-muted/40 p-3">
        {children}
      </div>
    </PermissionGate>
  );
}
