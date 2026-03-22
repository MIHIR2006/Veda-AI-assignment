"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { Plus, ClipboardList, CheckCircle2, Clock, Sparkles, ArrowRight } from "lucide-react";

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
    { label: "Total Assignments", value: totalAssignments, icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
    { label: "Completed", value: completedAssignments, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "In Progress", value: pendingAssignments, icon: Clock, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 
            className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            Welcome back
          </h1>
          <p className="text-sm font-semibold text-muted-foreground/70">
            Here&apos;s an overview of your teaching dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="rounded-[24px] border border-neutral-100 bg-card p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
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

        {/* Quick Actions */}
        <div className="rounded-[24px] border border-neutral-100 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 md:p-8 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 
              className="text-[20px] font-[800] tracking-tight text-white" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              AI-Powered Question Paper
            </h2>
          </div>
          <p className="text-sm text-white/50 font-medium mb-5 ml-8">
            Generate customized question papers in seconds using AI
          </p>
          <Button 
            onClick={() => router.push("/assignments/create")} 
            className="bg-white hover:bg-neutral-100 text-zinc-900 rounded-full px-6 h-11 gap-2 shadow-lg font-bold"
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
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
            <div className="rounded-[24px] border border-neutral-100 bg-card p-8 text-center shadow-sm">
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
          ) : (
            <div className="space-y-3">
              {recentAssignments.map((assignment: AssignmentData) => (
                <div
                  key={assignment._id}
                  onClick={() => router.push(`/assignments/${assignment._id}`)}
                  className="rounded-[24px] border border-neutral-100 bg-card p-5 md:p-6 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
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
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors" />
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
