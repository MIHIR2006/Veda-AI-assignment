import { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppLayout({ children, title, showBack, onBack }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-100/50 p-2 md:p-3 lg:p-4">
      <div className="mx-auto flex max-w-[1600px] gap-4">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar title={title} showBack={showBack} onBack={onBack} />
          <main className="flex-1 px-2 md:px-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
