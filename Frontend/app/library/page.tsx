"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { FolderOpen, FileText, ArrowRight, Plus, Lock } from "lucide-react";

export default function LibraryPage() {
  const router = useRouter();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchAssignments();
  }, [fetchAssignments]);

  const completedAssignments = assignments.filter((a: AssignmentData) => a.status === 'completed');

  return (
    <AppLayout title="My Library">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" 
            style={{ fontFamily: 'var(--font-bricolage)' }}
          >
            My Library
          </h1>
          <p className="text-sm font-semibold text-muted-foreground/70">
            Access your saved question papers, templates, and teaching resources
          </p>
        </div>

        {/* Generated Papers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-[20px] font-[800] tracking-tight text-foreground/90" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              Generated Question Papers
            </h2>
            <span className="text-xs font-bold text-muted-foreground/50 bg-neutral-100 px-3 py-1.5 rounded-full">
              {isMounted ? completedAssignments.length : 0} papers
            </span>
          </div>

          {completedAssignments.length === 0 ? (
            <div className="rounded-[24px] border border-neutral-100 bg-card p-8 text-center shadow-sm">
              <div className="inline-flex h-14 w-14 rounded-full bg-neutral-100 items-center justify-center mb-4">
                <FolderOpen className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground/60 mb-4">
                No question papers generated yet
              </p>
              <Button 
                variant="dark" 
                onClick={() => router.push("/assignments/create")} 
                className="gap-2 rounded-full px-6"
              >
                <Plus className="h-4 w-4" />
                Create Your First
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedAssignments.map((assignment: AssignmentData) => (
                <div
                  key={assignment._id}
                  onClick={() => router.push(`/assignments/${assignment._id}`)}
                  className="rounded-[24px] border border-neutral-100 bg-card p-5 md:p-6 hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
                >
                  <div className="h-11 w-11 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-[18px] font-[800] tracking-tight text-foreground/90 capitalize truncate mb-1" 
                      style={{ fontFamily: 'var(--font-bricolage)' }}
                    >
                      {assignment.topic || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground/50">
                      <span>{isMounted ? new Date(assignment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                      <span>•</span>
                      <span>{assignment.marks} marks</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors mt-2 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates & Resources - Coming Soon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[24px] border border-neutral-100 bg-card p-6 shadow-sm opacity-75">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-[18px] font-[800] tracking-tight text-foreground/90" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Templates
              </h3>
              <span className="flex items-center gap-1 bg-neutral-100 text-muted-foreground/70 px-3 py-1 rounded-full text-xs font-bold">
                <Lock className="h-3 w-3" />
                Soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed">
              Save your favorite paper configurations as reusable templates for quick generation.
            </p>
          </div>
          <div className="rounded-[24px] border border-neutral-100 bg-card p-6 shadow-sm opacity-75">
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-[18px] font-[800] tracking-tight text-foreground/90" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                Resources
              </h3>
              <span className="flex items-center gap-1 bg-neutral-100 text-muted-foreground/70 px-3 py-1 rounded-full text-xs font-bold">
                <Lock className="h-3 w-3" />
                Soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed">
              Upload and organize teaching materials, syllabus documents, and reference files.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
