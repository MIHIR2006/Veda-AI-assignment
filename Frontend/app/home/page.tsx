"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { Plus, ClipboardList, CheckCircle2, Clock, Sparkles, ArrowRight, Zap, Target, Brain, GraduationCap, BookOpen, Users } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchAssignments();
  }, [fetchAssignments]);

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a: AssignmentData) => a.status === 'completed').length;
  const pendingAssignments = assignments.filter((a: AssignmentData) => a.status === 'pending').length;
  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const stats = [
    { label: "Total Assignments", value: totalAssignments, icon: ClipboardList, color: "bg-blue-50 text-blue-600", border: "border-blue-100", glow: "hover:shadow-blue-100/50" },
    { label: "Completed", value: completedAssignments, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100", glow: "hover:shadow-emerald-100/50" },
    { label: "In Progress", value: pendingAssignments, icon: Clock, color: "bg-amber-50 text-amber-600", border: "border-amber-100", glow: "hover:shadow-amber-100/50" },
  ];

  const features = [
    { icon: Brain, label: "AI-Powered", desc: "Smart question generation" },
    { icon: Target, label: "Accurate", desc: "Precise grading & feedback" },
    { icon: Zap, label: "Fast", desc: "Generate papers in seconds" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 md:p-12 shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent opacity-50" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute top-8 right-8 animate-float opacity-20">
            <GraduationCap className="w-24 h-24 text-white" />
          </div>
          <div className="absolute bottom-8 left-1/4 animate-float opacity-15" style={{ animationDelay: '1s' }}>
            <BookOpen className="w-16 h-16 text-white" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float opacity-10" style={{ animationDelay: '2s' }}>
            <Users className="w-20 h-20 text-white" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-scale-in">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm font-semibold text-white/90">AI-Powered Teaching</span>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-[800] tracking-tight text-white mb-4 leading-[1.1]" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Welcome to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 animate-gradient bg-[length:200%_auto]">VedaAI</span>
            </h1>
            
            <p className="text-lg text-white/60 font-medium mb-8 max-w-xl">
              Create intelligent assignments, generate question papers, and provide AI-powered grading with ease.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => router.push("/assignments/create")} 
                className="bg-white hover:bg-neutral-100 text-zinc-900 rounded-full px-8 h-12 gap-2 shadow-lg font-bold text-base animate-scale-in"
                style={{ animationDelay: '0.2s' }}
              >
                <Sparkles className="h-5 w-5 text-amber-500" />
                Create Assignment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/test/join")} 
                className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-full px-8 h-12 gap-2 font-semibold text-base animate-scale-in"
                style={{ animationDelay: '0.3s' }}
              >
                <GraduationCap className="h-5 w-5 text-amber-400" />
                Join a Test
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/toolkit")} 
                className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-full px-8 h-12 gap-2 font-semibold text-base animate-scale-in"
                style={{ animationDelay: '0.4s' }}
              >
                Explore Toolkit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div 
              key={feature.label}
              className="rounded-[24px] border border-neutral-100 bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-[800] text-foreground" style={{ fontFamily: 'var(--font-bricolage)' }}>
                    {feature.label}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className={`rounded-[24px] border ${stat.border} bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 ${stat.glow} animate-slide-up group`}
              style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full bg-neutral-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p 
                className="text-[32px] font-[800] tracking-tight text-foreground/90 leading-none mb-1" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {isMounted ? stat.value : "–"}
              </p>
              <p className="text-sm font-semibold text-muted-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Assignments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-[20px] font-[800] tracking-tight text-foreground/90" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Recent Assignments
            </h2>
            {totalAssignments > 0 && (
              <button 
                onClick={() => router.push("/assignments")} 
                className="text-sm font-bold text-muted-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {recentAssignments.length === 0 ? (
            <div className="rounded-[24px] border border-neutral-100 bg-card p-8 text-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground/60 mb-4">
                  No assignments created yet. Get started by creating your first one!
                </p>
                <Button 
                  variant="dark" 
                  onClick={() => router.push("/assignments/create")} 
                  className="gap-2 rounded-full px-6"
                >
                  <Plus className="h-4 w-4" />
                  Create First Assignment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((assignment: AssignmentData, index: number) => (
                <div
                  key={assignment._id}
                  onClick={() => router.push(`/assignments/${assignment._id}`)}
                  className="rounded-[24px] border border-neutral-100 bg-card p-5 md:p-6 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-[18px] font-[800] tracking-tight text-foreground/90 capitalize truncate" 
                      style={{ fontFamily: 'var(--font-bricolage)' }}
                    >
                      {assignment.topic || 'Untitled'}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground/50 mt-1">
                      {isMounted ? new Date(assignment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      assignment.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : assignment.status === 'pending' 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'bg-red-50 text-red-600'
                    }`}>
                      {assignment.status === 'completed' ? 'Completed' : assignment.status === 'pending' ? 'Generating' : 'Failed'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
