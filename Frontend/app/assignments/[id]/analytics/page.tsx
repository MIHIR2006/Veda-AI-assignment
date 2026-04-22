"use client";

import { useEffect, useState, use } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { Loader2, ArrowLeft, BarChart3, Users, Target, TrendingUp, Presentation } from "lucide-react";

export default function AssignmentAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/assignments/${id}/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      toast.error("Could not load analytics");
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

  if (!analytics) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignment
          </Button>
          <h1 className="text-2xl font-[800] font-bricolage flex items-center gap-2 text-zinc-900">
            <BarChart3 className="w-6 h-6 text-primary" /> Assignment Analytics
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-6 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-[800] text-blue-900 leading-none">{analytics.totalAttempts}</p>
              <p className="text-sm font-bold text-blue-600/70 mt-1">Total Attempts</p>
            </div>
          </div>
          
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-6 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-[800] text-emerald-900 leading-none">
                {analytics.averageScore.toFixed(1)}
              </p>
              <p className="text-sm font-bold text-emerald-600/70 mt-1">Avg Score</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-6 shadow-sm flex items-center gap-4">
            <div className="h-14 w-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-3xl font-[800] text-amber-900 leading-none">
                {analytics.evaluatedAttempts > 0 
                  ? Math.round((analytics.evaluatedAttempts / analytics.totalAttempts) * 100) 
                  : 0}%
              </p>
              <p className="text-sm font-bold text-amber-600/70 mt-1">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Weak Topics */}
        {analytics.commonWeakTopics?.length > 0 && (
          <div className="rounded-[24px] bg-red-50 border border-red-100 p-8 shadow-sm">
            <h2 className="text-xl font-[800] font-bricolage text-red-900 mb-6 flex items-center gap-2">
              <Presentation className="w-6 h-6" /> Class Weak Topics
            </h2>
            <div className="flex flex-wrap gap-3">
              {analytics.commonWeakTopics.map((topic: string, i: number) => (
                <span key={i} className="px-5 py-2.5 bg-white text-red-700 font-bold text-sm rounded-full shadow-sm border border-red-100">
                  {topic}
                </span>
              ))}
            </div>
            <p className="text-sm text-red-600/70 font-semibold mt-6">
              AI identified these topics as common areas of struggle among students.
            </p>
          </div>
        )}

        {/* Submissions Table */}
        <div className="rounded-[24px] border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-xl font-[800] font-bricolage text-zinc-900">Student Attempts</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-neutral-100 text-xs uppercase font-bold text-neutral-500">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {analytics.submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 font-medium">
                      No attempts yet.
                    </td>
                  </tr>
                )}
                {analytics.submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-900">{sub.studentName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'evaluated' ? 'bg-emerald-100 text-emerald-700' :
                        sub.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {sub.score !== undefined ? sub.score : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                      {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/submissions/${sub.id}`)}
                        className="rounded-full shadow-sm font-bold text-xs"
                      >
                        View Results
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
