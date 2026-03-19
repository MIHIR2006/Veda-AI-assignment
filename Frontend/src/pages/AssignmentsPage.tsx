import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Assignment {
  id: string;
  title: string;
  assignedOn: string;
  dueDate?: string;
}

const mockAssignments: Assignment[] = [
  { id: "1", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
  { id: "2", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
  { id: "3", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
  { id: "4", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
  { id: "5", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
  { id: "6", title: "Quiz on Electricity", assignedOn: "20-06-2025", dueDate: "21-06-2025" },
];

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const [assignments] = useState<Assignment[]>(mockAssignments);
  const [search, setSearch] = useState("");

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (assignments.length === 0) {
    return (
      <AppLayout title="Assignment" showBack onBack={() => navigate("/")}>
        <div className="flex flex-1 flex-col items-center justify-center py-24 animate-fade-in">
          <div className="mb-6 h-40 w-40 rounded-full bg-accent flex items-center justify-center">
            <Search className="h-16 w-16 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">No assignments yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let AI
            assist with grading.
          </p>
          <Button variant="dark" size="lg" onClick={() => navigate("/assignments/create")} className="gap-2">
            <Plus className="h-5 w-5" />
            Create Your First Assignment
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Assignment" showBack onBack={() => navigate("/")}>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <h1 className="text-2xl font-bold">Assignments</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and create assignments for your classes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button variant="ghost" className="gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filter By
          </Button>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Assignment"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-8">
                <h3 className="text-lg font-bold underline decoration-1 underline-offset-2">
                  {assignment.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="h-4 w-4" />
                      View Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">Assigned on</span> : {assignment.assignedOn}
                </span>
                {assignment.dueDate && (
                  <span>
                    <span className="font-semibold text-foreground">Due</span> : {assignment.dueDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-50">
          <Button variant="dark" size="lg" onClick={() => navigate("/assignments/create")} className="gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            Create Assignment
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
