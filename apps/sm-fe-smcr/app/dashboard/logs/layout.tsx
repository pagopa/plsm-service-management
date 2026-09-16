import { PermissionGate } from "@/components/auth/permission-gate";
import { LogsHeader } from "@/components/logs/logs-header";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <PermissionGate permission="logs.read" returnUrl="/dashboard/logs">
      <div className="bg-neutral-50 h-screen w-full max-w-full min-w-0 overflow-hidden p-3 flex flex-col gap-3">
        <LogsHeader />

        {children}
      </div>
    </PermissionGate>
  );
}
