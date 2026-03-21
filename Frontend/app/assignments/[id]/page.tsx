"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAssignmentStore, AssignmentData } from "@/store/assignmentStore";
import { Download, RefreshCw } from "lucide-react";

export default function AssignmentResultPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);

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

  const { generatedPaper, status, activeJobId, initializeSocket, disconnectSocket, startJob } = useAssignmentStore();

  useEffect(() => {
    const fetchIt = async () => {
      if (!id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAssignment(data);
          
          if (data.status === "pending" && data.jobId) {
            startJob(data.jobId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchIt();
    
  }, [id, startJob]);

  const paper = activeJobId === assignment?.jobId && status === 'completed'
    ? generatedPaper
    : assignment?.paper;
    
  const isGenerating = (assignment?.status === 'pending' && status !== 'completed') || status === 'generating';

  const handleRegenerate = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/assignments/${id}/regenerate`, { method: 'POST' });
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
            <div className="flex items-center gap-2">
              <Button onClick={handleRegenerate} variant="secondary" className="h-10 md:h-12 bg-white/10 hover:bg-white/20 text-white border-0 px-6 rounded-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleDownloadPDF} variant="secondary" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border-0">
                <Download className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div id="pdf-content" ref={contentRef} className="bg-white rounded-[2rem] p-6 md:p-12 shadow-sm border border-neutral-100 min-h-[600px] print:m-0 print:border-0 print:shadow-none print:w-[210mm] print:mx-auto">
          <div style={{ padding: '24px 48px' }}>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p>AI is thinking...</p>
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
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>Failed to load paper or paper generation failed.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
