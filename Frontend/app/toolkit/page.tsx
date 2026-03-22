"use client";

import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ClipboardList, FileText, GraduationCap, Lightbulb, Lock, Sparkles, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "Question Paper Generator",
    description: "Generate customized question papers with AI based on topic, difficulty, and marking scheme.",
    icon: ClipboardList,
    color: "bg-violet-50 text-violet-600",
    active: true,
    path: "/assignments/create",
  },
  {
    title: "Lesson Planner",
    description: "Create structured lesson plans with objectives, activities, and assessment strategies.",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    active: false,
    path: "#",
  },
  {
    title: "Quiz Generator",
    description: "Build quick quizzes with auto-grading for formative assessments in your classroom.",
    icon: Lightbulb,
    color: "bg-amber-50 text-amber-600",
    active: false,
    path: "#",
  },
  {
    title: "Rubric Builder",
    description: "Design clear grading rubrics to ensure consistent and fair assessment of student work.",
    icon: GraduationCap,
    color: "bg-emerald-50 text-emerald-600",
    active: false,
    path: "#",
  },
];

export default function ToolkitPage() {
  const router = useRouter();

  return (
    <AppLayout title="AI Teacher's Toolkit">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h1 
              className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              AI Teacher&apos;s Toolkit
            </h1>
          </div>
          <p className="text-sm font-semibold text-muted-foreground/70">
            Powerful AI tools to supercharge your teaching workflow
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.title}
              onClick={() => tool.active && router.push(tool.path)}
              className={`rounded-[24px] border border-neutral-100 bg-card p-6 md:p-8 shadow-sm transition-all group relative overflow-hidden ${
                tool.active 
                  ? 'hover:shadow-lg cursor-pointer' 
                  : 'opacity-75'
              }`}
            >
              {/* Coming Soon badge */}
              {!tool.active && (
                <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-neutral-100 text-muted-foreground/70 px-3 py-1 rounded-full text-xs font-bold">
                  <Lock className="h-3 w-3" />
                  Coming Soon
                </div>
              )}

              <div className={`h-12 w-12 rounded-2xl ${tool.color} flex items-center justify-center mb-5`}>
                <tool.icon className="h-6 w-6" />
              </div>

              <h3 
                className="text-[20px] font-[800] tracking-tight text-foreground/90 mb-2" 
                style={{ fontFamily: 'var(--font-bricolage)' }}
              >
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed mb-5">
                {tool.description}
              </p>

              {tool.active ? (
                <Button 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-5 h-10 gap-2 font-bold text-sm"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="h-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
