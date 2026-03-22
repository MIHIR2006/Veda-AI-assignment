"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Share2, Bell, Lock } from "lucide-react";

const features = [
  {
    title: "Create Groups",
    description: "Organize students into classes and sections for easy management",
    icon: UserPlus,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Share Assignments",
    description: "Distribute assignments to specific groups with a single click",
    icon: Share2,
    color: "bg-violet-50 text-violet-600",
  },
  {
    title: "Notifications",
    description: "Send reminders and updates to your student groups instantly",
    icon: Bell,
    color: "bg-amber-50 text-amber-600",
  },
];

export default function GroupsPage() {
  return (
    <AppLayout title="My Groups">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            My Groups
          </h1>
          <p className="text-sm font-semibold text-muted-foreground/70">
            Create and manage student groups for streamlined assignment distribution
          </p>
        </div>

        {/* Coming Soon Hero */}
        <div className="rounded-[24px] border border-neutral-100 bg-card p-8 md:p-10 shadow-sm text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-full bg-blue-50 items-center justify-center mb-5">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h2 
            className="text-[22px] font-[800] tracking-tight text-foreground/90 mb-2" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Groups are coming soon
          </h2>
          <p className="text-sm text-muted-foreground/60 font-medium max-w-md mx-auto mb-6 leading-relaxed">
            We&apos;re building a powerful group management system so you can organize students, 
            share assignments seamlessly, and track class progress — all in one place.
          </p>
          <Button 
            disabled 
            className="bg-zinc-900 text-white rounded-full px-6 h-11 gap-2 font-bold opacity-50 cursor-not-allowed"
          >
            <Lock className="h-4 w-4" />
            Coming Soon
          </Button>
        </div>

        {/* Feature Preview */}
        <h3 
          className="text-[18px] font-[800] tracking-tight text-foreground/90 mb-4" 
          style={{ fontFamily: 'var(--font-bricolage)' }}
        >
          What to expect
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="rounded-[24px] border border-neutral-100 bg-card p-6 shadow-sm"
            >
              <div className={`h-10 w-10 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h4 
                className="text-[16px] font-[800] tracking-tight text-foreground/90 mb-1" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {feature.title}
              </h4>
              <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
