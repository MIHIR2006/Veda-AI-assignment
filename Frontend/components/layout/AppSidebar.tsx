"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageSquare, ClipboardList, Monitor, Clock, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { label: "Home", icon: LayoutGrid, path: "/" },
  { label: "My Groups", icon: MessageSquare, path: "/groups" },
  { label: "Assignments", icon: ClipboardList, path: "/assignments", badge: 10 },
  { label: "AI Teacher's Toolkit", icon: Monitor, path: "/toolkit" },
  { label: "My Library", icon: Clock, path: "/library" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image
          src="/assets/veda-logo.png"
          alt="VedaAI"
          width={36}
          height={36}
          className="h-auto w-9"
        />
        <span className="text-xl font-bold tracking-tight">VedaAI</span>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-full bg-primary p-[3px] shadow-md">
          <Button variant="dark" size="lg" className="w-full gap-2 text-base font-semibold rounded-full" asChild>
            <Link href="/assignments/create">
              <Sparkles className="h-5 w-5" />
              Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-accent text-foreground text-xs font-bold">DP</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">Delhi Public School</p>
            <p className="text-xs text-muted-foreground">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
