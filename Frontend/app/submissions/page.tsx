"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ClipboardList, Target, Clock, ArrowRight } from "lucide-react";

export default function MyTestsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/submissions/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch (error) {
      toast.error("Could not load your test history.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="My Tests">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Tests">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12 mt-4">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex flex-col items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-[800] tracking-tight font-bricolage text-zinc-900">Your Attempted Tests</h1>
            <p className="text-muted-foreground font-semibold">Review your past scores and AI feedback</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-100 bg-white p-12 text-center shadow-sm">
            <Target className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-700 mb-2">No Tests Attempted</h3>
            <p className="text-neutral-500 mb-6">You haven't attempted any tests yet. Got a Join Code?</p>
            <Button onClick={() => router.push("/test/join")} variant="dark" className="rounded-full px-8">
              Join a Test
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="rounded-[24px] border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-start justify-between mb-4">
                  <div className="pr-4">
                    <h3 className="text-lg font-[800] font-bricolage text-zinc-900 truncate">
                      {sub.topic}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    sub.status === 'evaluated' ? 'bg-emerald-100 text-emerald-700' :
                    sub.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {sub.status.toUpperCase()}
                  </span>
                </div>

                {sub.status === 'evaluated' ? (
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-[800] text-zinc-900 font-bricolage leading-none">
                      {sub.totalMarks}
                    </span>
                    <span className="text-sm font-bold text-neutral-400">/ {sub.maxMarks} marks</span>
                  </div>
                ) : (
                  <div className="mb-6 h-8 flex items-center">
                    <span className="text-sm font-bold text-neutral-400">Evaluation Pending...</span>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full rounded-xl font-bold bg-neutral-50 border-neutral-200 hover:bg-neutral-100 group-hover:border-primary/30"
                  onClick={() => router.push(`/submissions/${sub.id}`)}
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
