import { ActivityIcon } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="bg-neutral-50 h-screen w-full overflow-hidden p-3 flex flex-col gap-3">
      <header className="">
        <div className="inline-flex gap-2 items-center">
          <ActivityIcon className="size-3.5 opacity-60" />
          <p className="font-medium text-lg">Logs</p>
        </div>
      </header>

      {children}
    </div>
  );
}
