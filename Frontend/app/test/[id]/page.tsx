"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Clock, Send, AlertCircle, BookOpen, Target } from "lucide-react";

export default function TestTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Flatten questions for easier rendering and indexing
  const [flatQuestions, setFlatQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignment();
    fetchUserSession();
  }, [id]);

  const fetchUserSession = async () => {
    const session = await getSession();
    if (session?.user?.name) {
      setStudentName(session.user.name);
    }
  };

  const fetchAssignment = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/assignments/${id}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      
      if (!res.ok) {
        throw new Error("Failed to load test");
      }
      
      const data = await res.json();
      setAssignment(data);
      
      // Flatten questions
      const questions: any[] = [];
      let qIndex = 0;
      if (data.paper && data.paper.sections) {
        data.paper.sections.forEach((section: any) => {
          section.questions.forEach((q: any) => {
            questions.push({ ...q, globalIndex: qIndex, sectionTitle: section.title });
            qIndex++;
          });
        });
      }
      setFlatQuestions(questions);
    } catch (error) {
      toast.error("Could not load test details");
      router.push("/test/join");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setHasStarted(true);
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [index.toString()]: value
    }));
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit? You cannot change your answers after submission.")) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/submissions`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          assignmentId: id,
          studentName,
          answers
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit test");
      }

      toast.success("Test submitted successfully!");
      router.push(`/submissions/${data.submissionId}`);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!assignment || !assignment.paper) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Unavailable</h2>
          <p className="text-muted-foreground mb-6">The requested test could not be found or is not ready yet.</p>
          <Button onClick={() => router.push("/test/join")} variant="dark" className="rounded-full">
            Back to Join
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!hasStarted) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto mt-12 animate-fade-in">
          <div className="rounded-[32px] border border-neutral-100 bg-white p-8 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-[800] font-bricolage mb-2">{assignment.topic}</h1>
            
            <div className="flex flex-wrap gap-4 mb-8 text-sm font-semibold text-neutral-500">
              <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <Clock className="w-4 h-4" /> {assignment.timeLimit || 60} Minutes
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <Target className="w-4 h-4" /> {assignment.marks} Marks
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="block text-sm font-bold text-zinc-900">Enter Your Full Name</label>
              <Input 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. John Doe"
                className="h-12 bg-neutral-50"
              />
            </div>

            <Button 
              onClick={handleStart} 
              variant="dark" 
              className="w-full h-14 rounded-xl text-lg font-bold"
              disabled={!studentName.trim()}
            >
              Start Test Now
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
        
        {/* Sticky Header */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-md border border-neutral-200 shadow-sm rounded-2xl p-4 flex items-center justify-between mb-8">
          <div>
            <h2 className="font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-sm">{assignment.topic}</h2>
            <p className="text-xs font-semibold text-muted-foreground">{studentName}</p>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full gap-2 shadow-md"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Test
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          {flatQuestions.map((q) => (
            <div key={q.globalIndex} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                  {q.globalIndex + 1}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 block">
                    {q.sectionTitle}
                  </span>
                  <p className="text-lg font-medium text-zinc-900 leading-relaxed">
                    {q.text}
                  </p>
                  <div className="mt-2 text-xs font-bold text-neutral-400">
                    [{q.marks} Marks]
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pl-12">
                <Textarea 
                  placeholder="Write your answer here..."
                  className="min-h-[150px] bg-neutral-50/50 resize-y border-neutral-200 focus:border-primary/50 focus:ring-primary/20"
                  value={answers[q.globalIndex.toString()] || ""}
                  onChange={(e) => handleAnswerChange(q.globalIndex, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full gap-2 shadow-lg px-8 h-14 text-base"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Finish & Submit Test
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
