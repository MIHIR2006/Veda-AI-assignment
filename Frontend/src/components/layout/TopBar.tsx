import { ArrowLeft, Bell, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function TopBar({ title, showBack, onBack }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {title && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-medium">{title}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-dark-grey text-dark-foreground text-xs">JD</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">John Doe</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
