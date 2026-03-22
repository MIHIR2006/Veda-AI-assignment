"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, Plus, Search, Filter, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { toast } from "sonner";

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, fetchAssignments, loadingAssignments, deleteAssignment } = useAssignmentStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'dueDate'>('newest');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments
    .filter((a: AssignmentData) =>
      a.topic?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: AssignmentData, b: AssignmentData) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const success = await deleteAssignment(id);
    if (success) {
      toast.success("Assignment deleted successfully");
    } else {
      toast.error("Failed to delete assignment");
    }
  };

  if (loadingAssignments) {
    return (
      <AppLayout title="Assignment" showBack onBack={() => router.push("/")}>
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (assignments.length === 0) {
    return (
      <AppLayout title="Assignment" showBack onBack={() => router.push("/")}>
        <div className="flex flex-1 flex-col items-center justify-center py-24 animate-fade-in">
          <div className="mb-6 h-40 w-40 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-neutral-200/50 rounded-full blur-3xl opacity-50" />
            <div 
              className="h-32 w-32 rounded-full bg-white flex items-center justify-center shadow-inner"
              style={{ maskImage: 'radial-gradient(circle, black 60%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 100%)' }}
            >
              <Search className="h-12 w-12 text-muted-foreground/20" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">No assignments yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let AI
            assist with grading.
          </p>
          <Button variant="dark" size="lg" onClick={() => router.push("/assignments/create")} className="gap-2">
            <Plus className="h-5 w-5" />
            Create Your First Assignment
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Assignment" showBack onBack={() => router.push("/")}>
      <div className="animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <h1 className="text-2xl font-bold">Assignments</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and create assignments for your classes.
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-2 border border-neutral-100 shadow-sm flex items-center justify-between mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:bg-neutral-50 px-4">
                <Filter className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-sm font-medium">Filter By</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('newest')}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>Oldest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('dueDate')}>By Due Date</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative w-full max-w-sm mr-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search Assignment"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-neutral-200 rounded-full focus-visible:ring-primary/20 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((assignment: AssignmentData) => (
            <div
              key={assignment._id}
              onClick={() => router.push(`/assignments/${assignment._id}`)}
              className="rounded-[24px] border border-neutral-100 bg-card p-5 md:p-8 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[116px] md:min-h-[162px]"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-[24px] font-[800] tracking-[-0.04em] leading-[1.2] text-foreground/90 capitalize" style={{ fontFamily: 'var(--font-bricolage)' }}>
                  {assignment.topic || 'Untitled Assignment'}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 -mt-1 text-muted-foreground/80 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-8 w-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="gap-2 font-medium" onClick={(e) => { e.stopPropagation(); router.push(`/assignments/${assignment._id}`); }}>
                      <Eye className="h-4 w-4" />
                      View Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive font-medium" onClick={(e) => handleDelete(e, assignment._id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between text-[13.5px] mt-auto">
                <span className="text-muted-foreground/70">
                  <span className="font-bold text-foreground">Assigned on</span> : {isMounted ? new Date(assignment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}
                </span>
                {assignment.dueDate && (
                  <span className="text-muted-foreground/70">
                    <span className="font-bold text-foreground">Due</span> : {isMounted ? new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-8 z-50 mt-14 flex justify-center">
          <Button 
            variant="dark" 
            onClick={() => router.push("/assignments/create")} 
            className="w-[208px] h-[46px] gap-1 shadow-2xl rounded-full border-[1.5px] border-zinc-700 font-bold"
          >
            <Plus className="h-5 w-5" />
            Create Assignment
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
