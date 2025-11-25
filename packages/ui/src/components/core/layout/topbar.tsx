import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleUserRoundIcon, LogOutIcon } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function TopBar({ children }: Props) {
  return (
    <div className="ui:w-full ui:py-2 ui:px-4 ui:inline-flex ui:justify-between ui:items-center ui:border-b ui:border-b-muted">
      {children}
    </div>
  );
}

export function TopBarActions() {
  return (
    <div className="ui:inline-flex gap-2">
      <Button size="sm" variant="secondary">
        Log In
      </Button>
      <Button size="sm">Sign Up</Button>
    </div>
  );
}

type TopBarUserProps = {
  children: React.ReactNode;
  name: string;
  email: string;
};

export function TopBarUser({ children, name, email }: TopBarUserProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" aria-label="Open account menu">
          <CircleUserRoundIcon size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="ui:max-w-64" side="bottom" align="end">
        <DropdownMenuLabel className="ui:flex ui:items-start ui:gap-3">
          <div className="ui:flex ui:min-w-0 ui:flex-col">
            <span className="ui:text-foreground ui:truncate ui:text-sm ui:font-medium">
              {name}
            </span>
            <span className="ui:text-muted-foreground ui:truncate ui:text-xs ui:font-normal">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem>{children}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBarUserSignOut() {
  return (
    <div className="ui:inline-flex ui:gap-2 ui:items-center">
      <LogOutIcon size={16} className="ui:opacity-60" aria-hidden="true" />
      <span>Logout</span>
    </div>
  );
}
