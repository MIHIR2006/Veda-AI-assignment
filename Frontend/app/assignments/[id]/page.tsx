"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { Download, RefreshCw, FileText, Sparkles, Share2, Globe, Users, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSession } from "next-auth/react";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

const loadingStates = [
  { text: "Analyzing assignment parameters..." },
  { text: "Gathering educational context..." },
  { text: "Drafting custom questions..." },
  { text: "Balancing difficulty levels..." },
  { text: "Structuring question paper..." },
  { text: "Finalizing layout..." },
  { text: "Almost there..." }
];

export default function AssignmentResultPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Sharing state
  const [shareOpen, setShareOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sharing, setSharing] = useState(false);

  const reactToPrintFn = useReactToPrint({ 
    contentRef, 
    documentTitle: assignment?.topic ? assignment.topic.replace(/[^a-zA-Z0-9 -]/g, '') : "Assignment_Paper",
    pageStyle: `
      @page {
        size: A4;
        margin: 0mm; /* Removes default browser headers/footers */
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  });

  const { generatedPaper, status, error, activeJobId, initializeSocket, disconnectSocket, startJob } = useAssignmentStore();

  useEffect(() => {
    const fetchIt = async () => {
      if (!id) return;
      try {
        const session = await getSession();
        const uid = (session as any)?.user?.id || (session as any)?.user?.userId;
        const token = (session as any)?.user?.accessToken;
        setCurrentUserId(uid);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        
        if (res.ok) {
          const data = await res.json();
          setAssignment(data);
          setIsPublic(data.isPublic || false);
          
          if (data.status === "pending" && data.jobId) {
            startJob(data.jobId);
          }
        } else {
          setErrorStatus(res.status);
        }
      } catch (err) {
        console.error(err);
        setErrorStatus(500);
      }
    };
    
    fetchIt();
    
  }, [id, startJob]);

  const paper = activeJobId === assignment?.jobId && status === 'completed'
    ? generatedPaper
    : assignment?.paper;
  const isGenerating = (assignment?.status === 'pending' && status !== 'completed' && status !== 'failed') || status === 'generating';

  // Polling fallback in case WebSocket event is missed
  useEffect(() => {
    if (!isGenerating || !id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed' || data.status === 'failed') {
            setAssignment(data);
            // If it's completed, inform the store so the global status matches
            if (data.status === 'completed' && data.jobId === activeJobId) {
               useAssignmentStore.setState({ status: 'completed', generatedPaper: data.paper });
            } else if (data.status === 'failed') {
               useAssignmentStore.setState({ status: 'failed', error: "Generation failed" });
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isGenerating, id, activeJobId]);

  const handleRegenerate = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}/regenerate`, { 
        method: 'POST',
        headers 
      });
      if (res.ok) {
        const data = await res.json();
        startJob(data.jobId);
        setAssignment(prev => prev ? { ...prev, status: 'pending', jobId: data.jobId } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = () => {
    reactToPrintFn();
  };

  const handleFetchGroupsForShare = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserGroups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareSubmit = async () => {
    try {
      setSharing(true);
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}/share`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic,
          groupId: selectedGroup || undefined
        })
      });

      if (res.ok) {
        // Update local context
        const data = await res.json();
        setAssignment(data.assignment);
        if (typeof data.assignment.isPublic === 'boolean') {
          setIsPublic(data.assignment.isPublic);
        }
        setShareOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <AppLayout title="Assignment Output" showBack onBack={() => router.push("/assignments")}>
      <div className="max-w-4xl mx-auto animate-fade-in pb-16">
        <div className="bg-[#2A2A2A] text-white rounded-[2rem] p-6 md:p-8 mb-6 shadow-md relative overflow-hidden">
          <h2 className="text-xl md:text-2xl font-semibold max-w-2xl leading-snug mb-6">
            {isGenerating ? "Generating your custom Question Paper..." :
             `Certainly! Here is the customized Question Paper for your ${assignment?.difficulty || ''} classes on the topic ${assignment?.topic || 'Unknown'}:`
            }
          </h2>
          
          {!isGenerating && paper && (
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                onClick={handleDownloadPDF} 
                className="h-11 px-6 bg-white hover:bg-neutral-100 text-[#1A1A1A] rounded-full flex items-center gap-2 shadow-lg group transition-all border-0"
              >
                <div className="relative">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-[16px] font-[800] tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
                  Download as PDF
                </span>
              </Button>
              
              <Button 
                onClick={handleRegenerate} 
                className="h-11 px-6 bg-white/10 hover:bg-white text-white hover:text-[#1A1A1A] border border-white/20 rounded-full flex items-center gap-2 transition-all shadow-lg border-0 group"
              >
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[16px] font-[800] tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
                  Regenerate
                </span>
              </Button>

              {assignment.userId && currentUserId === assignment.userId && (
                <Dialog 
                  open={shareOpen} 
                  onOpenChange={(open) => {
                    setShareOpen(open);
                    if (open) handleFetchGroupsForShare();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      className="h-11 px-6 bg-white/10 hover:bg-white text-white hover:text-[#1A1A1A] border border-white/20 rounded-full flex items-center gap-2 transition-all shadow-lg border-0 group"
                    >
                      <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-500" />
                      <span className="text-[16px] font-[800] tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
                        Share
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-[24px]">
                    <DialogHeader>
                      <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-bricolage)' }}>Share Assignment</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4 text-black">
                      <div className="flex items-center justify-between border border-neutral-100 bg-neutral-50 p-4 rounded-xl">
                        <div className="space-y-0.5">
                          <Label className="text-base font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-neutral-500" />
                            Public Link
                          </Label>
                          <p className="text-sm text-muted-foreground font-medium">Anyone with the link can view this assignment</p>
                        </div>
                        <Switch 
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-bold flex items-center gap-2">
                          <Users className="h-4 w-4 text-neutral-500" />
                          Share with a Group
                        </Label>
                        <select 
                          className="w-full h-12 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-sm font-medium"
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                          <option value="">Select a group...</option>
                          {userGroups.map(group => (
                            <option key={group._id} value={group._id}>{group.name}</option>
                          ))}
                        </select>
                      </div>

                      <Button 
                        onClick={handleShareSubmit} 
                        variant="dark" 
                        disabled={sharing}
                        className="w-full h-12 rounded-full text-base font-bold mt-4"
                      >
                        {sharing ? 'Saving...' : 'Save Sharing Settings'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        <div id="pdf-content" ref={contentRef} className="bg-white rounded-[2rem] p-6 md:p-12 shadow-sm border border-neutral-100 min-h-[600px] print:m-0 print:border-0 print:shadow-none print:w-[210mm] print:mx-auto">
          <div style={{ padding: '24px 48px' }}>
          {errorStatus === 403 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
              <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 border border-neutral-200">
                <Lock className="h-6 w-6 text-neutral-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-[800] tracking-tight text-[#1A1A1A] mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>
                Access Denied
              </h3>
              <p className="text-muted-foreground font-semibold max-w-sm mx-auto mb-6">
                This assignment is private. You must be the owner or belong to a shared group to view it.
              </p>
              <Button onClick={() => router.push("/assignments")} variant="outline" className="rounded-full shadow-sm font-bold border-neutral-200 h-10 px-6">
                Back to Assignments
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64">
              <MultiStepLoader loadingStates={loadingStates} loading={isGenerating} duration={2000} />
            </div>
          ) : paper ? (
            <div className="text-black space-y-8 font-serif">
              <div className="text-center space-y-2 mb-10">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veda School</h1>
                <p className="text-lg font-semibold">Subject: AI Generated Question Paper</p>
                <p className="text-lg font-semibold">Topic: {assignment?.topic}</p>
                <div className="mt-6 flex justify-between font-semibold text-sm md:text-base border-b-2 border-dashed border-neutral-300 pb-4">
                  <span>Time Allowed: 45 minutes</span>
                  <span>Maximum Marks: {assignment?.marks}</span>
                </div>
              </div>
              
              <div className="font-semibold text-sm md:text-base space-y-1 mb-8">
                <p>All questions are compulsory unless stated otherwise.</p>
              </div>

              <div className="space-y-3 mb-12 text-sm md:text-base">
                <p>Name: <span className="inline-block w-64 border-b border-black"></span></p>
                <p>Roll Number: <span className="inline-block w-48 border-b border-black"></span></p>
                <p>Class: ________ Section: ________</p>
              </div>

              {paper.sections?.map((section: any, idx: number) => (
                <div key={idx} className="mb-10">
                  <h3 className="text-center text-xl font-bold mb-4">{section.title}</h3>
                  {section.instructions && (
                    <p className="italic text-sm mb-6 text-neutral-700">{section.instructions}</p>
                  )}
                  
                  <div className="space-y-6">
                    {section.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="flex gap-4">
                        <span className="font-bold">{qIdx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-base leading-relaxed">{q.text}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 bg-neutral-100 rounded text-neutral-600">
                              {q.difficulty}
                            </span>
                            <span className="text-sm font-semibold text-neutral-500">[{q.marks} Marks]</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Paper Generation Failed</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {status === 'failed' && error 
                  ? error 
                  : "We encountered an issue while generating your assignment. Please try again."}
              </p>
              <Button onClick={handleRegenerate} variant="dark" className="rounded-full shadow-md gap-2" size="lg">
                <RefreshCw className="h-4 w-4" />
                Retry Generation
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
