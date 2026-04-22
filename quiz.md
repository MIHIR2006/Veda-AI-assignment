Backend/src/index.ts

app.use('/api', apiRoutes);

import './workers/consumer.js';
import './workers/evaluator.js';



Backend/src/models/Assignment.ts

status: 'pending' | 'completed' | 'failed';  paper?: any;  userId?: string;  joinCode?: string;  timeLimit?: number;  createdAt: Date;  updatedAt: Date;}@@ -30,7 +32,9 @@ const AssignmentSchema: Schema = new Schema(      default: 'pending'     },    paper: { type: Schema.Types.Mixed },    userId: { type: String }    userId: { type: String },    joinCode: { type: String, unique: true, sparse: true },    timeLimit: { type: Number, default: 60 }  },  { timestamps: true });



Backend/src/models/Submission.ts

import mongoose, { Schema, Document } from 'mongoose';

interface IEvaluatedAnswer {
  questionText: string;
  studentAnswer: string;
  feedback: string;
  marksAwarded: number;
}

export interface ISubmission extends Document {
  assignmentId: string;
  userId: string;
  studentName: string;
  answers: { [key: string]: string };
  status: 'pending' | 'evaluated' | 'failed';
  totalMarksAwarded?: number;
  overallFeedback?: string;
  weakTopics?: string[];
  detailedFeedback?: IEvaluatedAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const EvaluatedAnswerSchema: Schema = new Schema({
  questionText: { type: String, required: true },
  studentAnswer: { type: String },
  feedback: { type: String, required: true },
  marksAwarded: { type: Number, required: true }
});

const SubmissionSchema: Schema = new Schema(
  {
    assignmentId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    studentName: { type: String, required: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'failed'],
      default: 'pending'
    },
    totalMarksAwarded: { type: Number },
    overallFeedback: { type: String },
    weakTopics: [{ type: String }],
    detailedFeedback: [EvaluatedAnswerSchema]
  },
  { timestamps: true }
);

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);











Backend/src/workers/consumer.ts


 'PaperGenerationQueue',
  async (job) => {
    const { topic, marks, difficulty, questionTypes, instructions, jobId, imageBase64, mimeType } = job.data;
    

    try {
      console.log(`Processing AI job ${jobId} for topic: ${topic}`);
      if (imageBase64) {
        console.log(`Job ${jobId} includes visual lesson notes!`);
      }
      

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      

      const prompt = `
        You are an expert educator. Create an exam paper matching the following criteria:
        - Topic: ${topic}
@@ -52,41 +52,40 @@ const worker = new Worker(
          ]
        }
      `;
      

      let finalPrompt: any = prompt;
      

      if (imageBase64 && mimeType) {
        const base64DataStr = imageBase64.replace(/^data:.*;base64,/, "");
        

        finalPrompt = [
          prompt + "\n\nCRITICAL: Please strictly use the attached lesson notes (image or PDF) as context to generate your questions.",
          { inlineData: { data: base64DataStr, mimeType } }
        ];
      }
      

      const result = await model.generateContent(finalPrompt);
      const outputText = result.response.text();
      
      // lookup this order 

      const paperData = JSON.parse(outputText);
      

      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'completed', paper: paperData }
      );
      

      io.to(jobId).emit('AI_COMPLETE', { paperData, jobId });
      console.log(`Successfully completed and emitted results for job ${jobId}`);
      await redisConnection.del('assignments_list');
      

    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      

      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'failed' }
      );
      

      io.to(jobId).emit('AI_ERROR', { error: 'Failed to generate question paper' });
      await redisConnection.del('assignments_list');
      throw error;

Backend/src/workers/evaluator.ts

import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from '../index.js';
import dotenv from 'dotenv';
import { Submission } from '../models/Submission.js';
import { Assignment } from '../models/Assignment.js';

dotenv.config();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const worker = new Worker(
  'EvaluationQueue',
  async (job) => {
    const { submissionId, assignmentId } = job.data;

    try {
      console.log(`Processing evaluation job for submission: ${submissionId}`);

      const submission = await Submission.findById(submissionId);
      const assignment = await Assignment.findById(assignmentId);

      if (!submission || !assignment) {
        throw new Error('Submission or assignment not found');
      }

      let questionContext = '';
      let totalMaxMarks = 0;
      const questionMap: any = {};

      let qIndex = 0;
      if (assignment.paper && assignment.paper.sections) {
        assignment.paper.sections.forEach((section: any) => {
          section.questions.forEach((q: any) => {
            questionContext += `Question ${qIndex}: ${q.text} (Marks: ${q.marks})\n`;
            totalMaxMarks += q.marks;
            questionMap[qIndex] = q;
            qIndex++;
          });
        });
      }

      const answersContext = Object.entries(submission.answers)
        .map(([index, ans]) => `Answer to Question ${index}: ${ans}`)
        .join('\n\n');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        You are an expert educator evaluator. 
        You are evaluating a student's submission for the topic: "${assignment.topic}".
        Total maximum marks for the assignment: ${totalMaxMarks}.

        Here are the questions they were asked:
        ${questionContext}

        Here are the student's answers:
        ${answersContext}

        Evaluate the student's answers strictly but fairly.
        
        You must return raw JSON matching exactly this structure:
        {
          "totalMarksAwarded": number,
          "overallFeedback": "String describing overall performance, strengths, and weaknesses",
          "weakTopics": ["Topic 1", "Topic 2"],
          "detailedFeedback": [
            {
              "questionText": "The actual text of the question",
              "studentAnswer": "The student's answer text",
              "feedback": "Specific feedback for this answer",
              "marksAwarded": number
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      const evaluationData = JSON.parse(outputText);

      submission.status = 'evaluated';
      submission.totalMarksAwarded = evaluationData.totalMarksAwarded;
      submission.overallFeedback = evaluationData.overallFeedback;
      submission.weakTopics = evaluationData.weakTopics;
      submission.detailedFeedback = evaluationData.detailedFeedback;

      await submission.save();


      io.emit(`EVALUATION_COMPLETE_${submissionId}`, { submissionId });
      console.log(`Successfully completed evaluation for submission ${submissionId}`);

    } catch (error) {
      console.error(`Error processing evaluation job ${job.data.submissionId}:`, error);

      await Submission.findByIdAndUpdate(submissionId, { status: 'failed' });

      io.emit(`EVALUATION_ERROR_${submissionId}`, { error: 'Failed to evaluate submission' });
      throw error;
    }
  },
  { connection: redisConnection as any }
);

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs on EvaluationQueue');
});

worker.on('error', (err) => {
  console.error('Evaluation worker encountered an error:', err);
});








Frontend/app/assignments/[id]/analytics/page.tsx


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









Frontend/app/assignments/[id]/page.tsx


import { AppLayout } from "@/components/layout/AppLayout";import { Button } from "@/components/ui/button";import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";import { Download, RefreshCw, FileText, Sparkles } from "lucide-react";import { Download, RefreshCw, FileText, Sparkles, Key, BarChart3 } from "lucide-react";import { getSession } from "next-auth/react";export default function AssignmentResultPage() {@@ -141,6 +141,23 @@ export default function AssignmentResultPage() {                </span>              </Button>              {assignment?.joinCode && (                <div className="h-11 px-6 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center gap-2 shadow-sm font-bold">                  <Key className="h-4 w-4" />                  Code: <span className="tracking-widest">{assignment.joinCode}</span>                </div>              )}              <Button                 onClick={() => router.push(`/assignments/${id}/analytics`)}                 className="h-11 px-6 bg-white hover:bg-neutral-100 text-[#1A1A1A] rounded-full flex items-center gap-2 shadow-lg group transition-all border-0"              >                <BarChart3 className="h-5 w-5" />                <span className="text-[16px] font-[800] tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>                  Analytics                </span>              </Button>                            <Button                 onClick={handleRegenerate}                 className="h-11 px-6 bg-white/10 hover:bg-white text-white hover:text-[#1A1A1A] border border-white/20 rounded-full flex items-center gap-2 transition-all shadow-lg border-0 group"











Frontend/app/home/page.tsx


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
                className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-full px-8 h-12 gap-2 font-semibold text-base"
                className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-full px-8 h-12 gap-2 font-semibold text-base animate-scale-in"
                style={{ animationDelay: '0.4s' }}
              >
                Explore Toolkit
                <ArrowRight className="h-4 w-4" />










Frontend/app/submissions/[id]/page.tsx

"use client";

import { useEffect, useState, use } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { Loader2, CheckCircle2, TrendingDown, Target, BrainCircuit, ArrowLeft } from "lucide-react";
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

  if (submission.status === 'pending') {
    return (
      <AppLayout>
        <div className="flex flex-col h-[60vh] items-center justify-center text-center max-w-md mx-auto animate-fade-in px-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-[800] mb-2 font-bricolage">AI is evaluating...</h2>
          <p className="text-muted-foreground font-medium">
            Please wait while our Gemini LLM carefully reads and evaluates your answers. This usually takes 10-30 seconds.
          </p>
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






Frontend/app/submissions/page.tsx


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








Frontend/app/test/join/page.tsx



"use client";import { useState } from "react";import { useRouter } from "next/navigation";import { getSession } from "next-auth/react";import { AppLayout } from "@/components/layout/AppLayout";import { Button } from "@/components/ui/button";import { Input } from "@/components/ui/input";import { toast } from "sonner";import { GraduationCap, ArrowRight, Key, Loader2 } from "lucide-react";export default function JoinTestPage() {  const router = useRouter();  const [joinCode, setJoinCode] = useState("");  const [isLoading, setIsLoading] = useState(false);  const handleJoin = async (e: React.FormEvent) => {    e.preventDefault();    if (!joinCode) return;    setIsLoading(true);    try {      const session = await getSession();      const token = (session as any)?.user?.accessToken;      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';            const res = await fetch(`${apiUrl}/api/assignments/join/${joinCode.toUpperCase()}`, {        headers: {          "Authorization": `Bearer ${token}`        }      });      const data = await res.json();      if (!res.ok) {        toast.error(data.error || "Failed to join test");        if (data.submissionId) {          // If already submitted, offer to view results          router.push(`/submissions/${data.submissionId}`);        }        setIsLoading(false);        return;      }      toast.success("Successfully found test!");      router.push(`/test/${data._id}`);    } catch (error) {      toast.error("Something went wrong");      setIsLoading(false);    }  };  return (    <AppLayout>      <div className="max-w-md mx-auto mt-20 animate-fade-in">        <div className="rounded-[32px] border border-neutral-100 bg-card p-8 shadow-xl text-center relative overflow-hidden">          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />                    <div className="relative z-10">            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-6">              <GraduationCap className="h-10 w-10 text-white" />            </div>            <h1 className="text-3xl font-[800] tracking-tight mb-2 text-foreground" style={{ fontFamily: 'var(--font-bricolage)' }}>              Join a Test            </h1>            <p className="text-muted-foreground font-medium mb-8">              Enter the 6-character code provided by your teacher to begin the test.            </p>            <form onSubmit={handleJoin} className="space-y-4">              <div className="relative">                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />                <Input                  type="text"                  placeholder="Enter join code (e.g., A1B2C3)"                  value={joinCode}                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}                  className="pl-12 h-14 text-center text-lg font-bold tracking-widest uppercase bg-neutral-50/50 border-neutral-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"                  maxLength={6}                  required                />              </div>              <Button                 type="submit"                 variant="dark"                className="w-full h-14 text-lg font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all"                disabled={isLoading || joinCode.length < 6}              >                {isLoading ? (                  <Loader2 className="h-5 w-5 animate-spin" />                ) : (                  <>                    Continue to Test                    <ArrowRight className="h-5 w-5" />                  </>                )}              </Button>            </form>          </div>        </div>      </div>    </AppLayout>  );}



Frontend/components/layout/AppSidebar.tsx




 { label: "Home", icon: LayoutGrid, path: "/home" },
    { label: "My Groups", icon: MessageSquare, path: "/groups" },
    { label: "Assignments", icon: ClipboardList, path: "/assignments", badge: assignments.length > 0 ? assignments.length : null },
    { label: "AI Teacher's Toolkit", icon: Book, path: "/toolkit" },
    { label: "My Tests", icon: Book, path: "/submissions" },
    { label: "AI Teacher's Toolkit", icon: Sparkles, path: "/toolkit" },
    { label: "My Library", icon: ChartPie, path: "/library" },
  ];

@@ -54,8 +55,8 @@ export function AppSidebar() {

      <nav className="flex-1 space-y-2 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
          (item.path !== "/home" && item.path !== "/" && pathname.startsWith(item.path));
          const isActive = pathname === item.path ||
            (item.path !== "/home" && item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}









Frontend/components/layout/TopBar.tsx


   </div>
            <DropdownMenuSeparator />
            {socialLinks.map((link) => (
              <DropdownMenuItem 
                key={link.label} 
                className="gap-3 font-semibold cursor-pointer rounded-lg py-2.5" 
              <DropdownMenuItem
                key={link.label}
                className="gap-3 font-semibold cursor-pointer rounded-lg py-2.5"
                onClick={() => window.open(link.url, '_blank')}
              >
                <link.icon className={`h-4 w-4 ${link.color}`} />
@@ -84,7 +84,7 @@ export function TopBar({ title, showBack, onBack }: TopBarProps) {
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
            <DropdownMenuItem
              className="gap-3 font-semibold cursor-pointer rounded-lg py-2.5"
              onClick={() => window.location.href = '/settings'}
            >




Frontend/package.json


  "face-api.js": "^0.22.2",


Frontend/store/assignmentStore.ts


joinCode?: string;
      