"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, School, Mail, Globe, Moon, Sun, Bell, Shield, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const sections = [
    {
      title: "Profile",
      icon: User,
      items: [
        { label: "Full Name", value: "Mihir Goswami", type: "text" },
        { label: "Email", value: "mihirgoswami2006@gmail.com", type: "text" },
        { label: "Role", value: "Developer", type: "text" },
      ],
    },
    {
      title: "School",
      icon: School,
      items: [
        { label: "School Name", value: "Delhi Public School", type: "text" },
        { label: "Location", value: "Bokaro Steel City", type: "text" },
        { label: "Board", value: "CBSE", type: "text" },
      ],
    },
  ];

  return (
    <AppLayout title="Settings">
      <div className="animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Settings
          </h1>
          <p className="text-sm font-semibold text-muted-foreground/70">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-[24px] border border-neutral-100 bg-card p-6 md:p-8 shadow-sm mb-6">
          <div className="flex items-center gap-5 mb-6">
            <Avatar className="h-16 w-16 border-2 border-neutral-200">
              <AvatarFallback className="bg-zinc-800 text-zinc-100 text-lg font-black">MG</AvatarFallback>
            </Avatar>
            <div>
              <h2 
                className="text-[22px] font-[800] tracking-tight text-foreground/90" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Mihir Goswami
              </h2>
              <p className="text-sm font-semibold text-muted-foreground/60">Teacher • Delhi Public School</p>
            </div>
          </div>
        </div>

        {/* Info Sections */}
        {sections.map((section) => (
          <div key={section.title} className="rounded-[24px] border border-neutral-100 bg-card p-6 md:p-8 shadow-sm mb-6">
            <div className="flex items-center gap-2.5 mb-5">
              <section.icon className="h-5 w-5 text-muted-foreground/70" />
              <h3 
                className="text-[18px] font-[800] tracking-tight text-foreground/90" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {section.title}
              </h3>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <label className="text-sm font-bold text-muted-foreground/70 w-32 shrink-0">{item.label}</label>
                  <Input 
                    defaultValue={item.value} 
                    className="bg-neutral-50/80 h-11 rounded-xl border-neutral-200 font-semibold max-w-sm" 
                    readOnly 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Preferences */}
        <div className="rounded-[24px] border border-neutral-100 bg-card p-6 md:p-8 shadow-sm mb-6">
          <h3 
            className="text-[18px] font-[800] tracking-tight text-foreground/90 mb-5" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Preferences
          </h3>
          <div className="space-y-1">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-3 opacity-60">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-muted-foreground/70" /> : <Sun className="h-5 w-5 text-amber-500" />}
                <div>
                  <p className="text-sm font-bold text-foreground/90">Dark Mode</p>
                  <p className="text-xs font-medium text-muted-foreground/50">Switch between light and dark themes</p>
                </div>
              </div>
              <button 
                disabled
                className={`relative h-7 w-12 rounded-full transition-colors ${darkMode ? 'bg-zinc-800' : 'bg-neutral-200'} cursor-not-allowed`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between py-3 opacity-60">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-sm font-bold text-foreground/90">Notifications</p>
                  <p className="text-xs font-medium text-muted-foreground/50">Receive alerts for assignment updates</p>
                </div>
              </div>
              <button 
                disabled
                className={`relative h-7 w-12 rounded-full transition-colors ${notifications ? 'bg-emerald-500' : 'bg-neutral-200'} cursor-not-allowed`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-sm font-bold text-foreground/90">Language</p>
                  <p className="text-xs font-medium text-muted-foreground/50">Select your preferred language</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground/60">
                English
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-sm font-bold text-foreground/90">Privacy & Security</p>
                  <p className="text-xs font-medium text-muted-foreground/50">Manage your data and security settings</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-6 text-xs font-semibold text-muted-foreground/40">
          VedaAI v1.0.0 • Built with ❤️ for educators
        </div>
      </div>
    </AppLayout>
  );
}
