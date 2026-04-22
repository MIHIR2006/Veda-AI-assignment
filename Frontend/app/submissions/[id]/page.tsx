"use client";

import { useEffect, useState, use } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { Loader2, CheckCircle2, TrendingDown, Target, BrainCircuit, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

export default function SubmissionResultPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
    
    // Connect socket for real-time evaluation updates
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const socket = io(socketUrl);
    
    socket.on(`EVALUATION_COMPLETE_${id}`, () => {
      toast.success("AI Evaluation Complete!");
      fetchSubmission();
    });

    socket.on(`EVALUATION_ERROR_${id}`, (data) => {
      toast.error(data.error || "Failed to evaluate");
      fetchSubmission();
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/submissions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load submission");
      const data = await res.json();
      setSubmission(data);
    } catch (error) {
      toast.error("Could not load results");
    } finally {
      setLoading(false);
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

  if (!submission) return null;

  const handleReevaluate = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/submissions/${id}/reevaluate`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to re-evaluate");
      toast.success("Re-evaluation started");
      fetchSubmission();
    } catch (error) {
      toast.error("Could not start re-evaluation");
    }
  };

  if (submission.status === 'pending') {
    return (
      <AppLayout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-center max-w-md mx-auto animate-fade-in px-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-[800] mb-2 font-bricolage">AI is evaluating...</h2>
          <p className="text-muted-foreground font-medium mb-6">
            Please wait while our Gemini LLM carefully reads and evaluates your answers. This usually takes 10-30 seconds.
          </p>
          <Button onClick={handleReevaluate} variant="outline" className="rounded-full px-6 font-bold bg-white text-zinc-900 border-neutral-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Re-evaluate
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (submission.status === 'failed') {
    return (
      <AppLayout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-center max-w-md mx-auto animate-fade-in px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-[800] mb-2 font-bricolage text-zinc-900">Evaluation Failed</h2>
          <p className="text-muted-foreground font-medium mb-8">
            The AI encountered an issue while trying to grade your submission. You can request a re-evaluation to try again.
          </p>
          <Button onClick={handleReevaluate} className="rounded-full px-8 h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry AI Evaluation
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
        
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Hero Result Section */}
        <div className="rounded-[32px] bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-white shadow-xl relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          
          <div className="relative z-10">
            <h1 className="text-xl text-white/60 font-bold mb-2 uppercase tracking-widest">Test Results</h1>
            <div className="text-7xl font-[800] tracking-tighter text-amber-400 mb-6 font-bricolage">
              {submission.totalMarksAwarded} <span className="text-3xl text-white/40">marks</span>
            </div>
            
            <p className="text-lg bg-white/10 p-6 rounded-2xl border border-white/10 max-w-2xl mx-auto">
              "{submission.overallFeedback}"
            </p>
          </div>
        </div>

        {/* Weak Topics */}
        {submission.weakTopics && submission.weakTopics.length > 0 && (
          <div className="rounded-[24px] border border-red-100 bg-red-50 p-6">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <TrendingDown className="w-5 h-5" />
              <h3 className="text-lg font-bold">Topics to Revise</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {submission.weakTopics.map((topic: string, idx: number) => (
                <span key={idx} className="bg-white text-red-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm border border-red-100">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="space-y-6">
          <h2 className="text-2xl font-[800] font-bricolage text-zinc-900 mt-8 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Detailed Evaluation
          </h2>

          {submission.detailedFeedback?.map((item: any, idx: number) => (
            <div key={idx} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-base font-bold text-zinc-900 leading-relaxed">
                  <span className="text-primary mr-2">Q{idx + 1}.</span> {item.questionText}
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {item.marksAwarded} marks
                </span>
              </div>
              
              <div className="mt-4 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <span className="text-xs font-bold uppercase text-neutral-400 mb-1 block">Your Answer</span>
                <p className="text-neutral-700 text-sm">{item.studentAnswer || "No answer provided."}</p>
              </div>

              <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <span className="text-xs font-bold uppercase text-amber-500 mb-1 block flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" /> AI Feedback
                </span>
                <p className="text-amber-900 text-sm font-medium">{item.feedback}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
