import { LogsHeader } from "@/components/logs/logs-header";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="bg-neutral-50 h-screen w-full overflow-hidden p-3 flex flex-col gap-3">
      <LogsHeader />

      {children}
    </div>
  );
}
