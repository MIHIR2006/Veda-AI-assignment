"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageSquare, ClipboardList, Book, ChartPie, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { useAssignmentStore } from "@/store/assignmentStore";
import { useEffect } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const { assignments, fetchAssignments } = useAssignmentStore();

  useEffect(() => {
    if (assignments.length === 0) {
      fetchAssignments();
    }
  }, [fetchAssignments, assignments.length]);

  const navItems = [
    { label: "Home", icon: LayoutGrid, path: "/" },
    { label: "My Groups", icon: MessageSquare, path: "/groups" },
    { label: "Assignments", icon: ClipboardList, path: "/assignments", badge: assignments.length > 0 ? assignments.length : null },
    { label: "AI Teacher's Toolkit", icon: Book, path: "/toolkit" },
    { label: "My Library", icon: ChartPie, path: "/library" },
  ];

  return (
    <aside className="hidden lg:flex w-[270px] shrink-0 sticky top-3 md:top-4 self-start flex-col h-[calc(100vh-24px)] md:h-[calc(100vh-32px)] border border-border bg-white rounded-[24px] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image
          src="/assets/veda-logo.png"
          alt="VedaAI"
          width={36}
          height={36}
          className="h-9 w-9"
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

      <nav className="flex-1 space-y-2 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                isActive
                  ? "bg-neutral-100/80 text-foreground ring-1 ring-neutral-200/50 shadow-sm"
                  : "text-muted-foreground hover:bg-neutral-50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-foreground" : "text-muted-foreground/70")} />
              {item.label}
              {item.badge && (
                <span className="ml-auto flex h-5 min-w-[32px] items-center justify-center rounded-full bg-[#E97441] px-2 text-[11px] font-black text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-all"
        >
          <Settings className="h-5 w-5 text-muted-foreground/70" />
          Settings
        </Link>
      </div>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 bg-neutral-100 p-3 rounded-[20px] border border-neutral-200/50 shadow-sm">
          <Avatar className="h-12 w-12 rounded-full border-2 border-white shadow-sm">
            <AvatarFallback className="bg-[#F5E6DA] text-[#8B5E3C] text-xs font-black">DP</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground truncate">Delhi Public School</p>
            <p className="text-[11px] text-muted-foreground/80 truncate font-bold">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
