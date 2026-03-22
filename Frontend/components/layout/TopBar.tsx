"use client";

import { ArrowLeft, Bell, ChevronDown, LayoutGrid, ClipboardList, MessageSquare, Book, ChartPie } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const getIconForTitle = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('home')) return LayoutGrid;
  if (t.includes('assignment')) return ClipboardList;
  if (t.includes('group')) return MessageSquare;
  if (t.includes('toolkit')) return Book;
  if (t.includes('library')) return ChartPie;
  return LayoutGrid;
};

export function TopBar({ title, showBack, onBack }: TopBarProps) {
  const displayTitle = title || "Home";
  const Icon = getIconForTitle(displayTitle);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border border-border bg-white px-6 rounded-[24px] mb-6 shadow-sm sticky top-3 md:top-4 z-50">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-neutral-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2.5 text-foreground/90">
          <Icon className="h-5 w-5 text-zinc-900/80" />
          <span className="text-[16px] font-[800] tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
            {displayTitle}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-neutral-100">
          <Bell className="h-6 w-6 text-muted-foreground/80" />
          <span className="absolute right-[10px] top-[10px] h-2.5 w-2.5 rounded-full border-2 border-white bg-primary shadow-sm" />
        </Button>
        <div className="flex items-center gap-2 cursor-pointer bg-neutral-100 py-1.5 pl-1.5 pr-3 rounded-full hover:bg-neutral-200/70 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-800 text-zinc-100 text-xs shadow-sm">MG</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold hidden sm:block truncate">Mihir Goswami</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
