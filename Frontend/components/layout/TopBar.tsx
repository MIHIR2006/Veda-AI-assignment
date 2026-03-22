"use client";

import { ArrowLeft, ChevronDown, LayoutGrid, ClipboardList, MessageSquare, Book, ChartPie, Settings, Github, Globe, Linkedin, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  if (t.includes('setting')) return Settings;
  return LayoutGrid;
};

const socialLinks = [
  { label: "GitHub", icon: Github, url: "https://github.com/MIHIR2006", color: "text-zinc-800" },
  { label: "Portfolio", icon: Globe, url: "https://mihirgoswami.is-a.dev", color: "text-violet-600" },
  { label: "LinkedIn", icon: Linkedin, url: "https://www.linkedin.com/in/mihir-goswami/", color: "text-blue-600" },
];

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer bg-neutral-100 py-1.5 pl-1.5 pr-3 rounded-full hover:bg-neutral-200/70 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-zinc-800 text-zinc-100 text-xs shadow-sm">MG</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold hidden sm:block truncate">Mihir Goswami</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-bold text-foreground">Mihir Goswami</p>
              <p className="text-xs text-muted-foreground/60 font-medium">mihirgoswami2006@gmail.com</p>
            </div>
            <DropdownMenuSeparator />
            {socialLinks.map((link) => (
              <DropdownMenuItem 
                key={link.label} 
                className="gap-3 font-semibold cursor-pointer rounded-lg py-2.5" 
                onClick={() => window.open(link.url, '_blank')}
              >
                <link.icon className={`h-4 w-4 ${link.color}`} />
                {link.label}
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/40" />
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-3 font-semibold cursor-pointer rounded-lg py-2.5"
              onClick={() => window.location.href = '/settings'}
            >
              <Settings className="h-4 w-4 text-muted-foreground/70" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
