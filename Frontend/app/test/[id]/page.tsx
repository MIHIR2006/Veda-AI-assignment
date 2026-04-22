"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Clock, Send, AlertCircle, BookOpen, Target, Camera } from "lucide-react";
import * as faceapi from "face-api.js";

export default function TestTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Proctoring States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionRef = useRef<NodeJS.Timeout>(null);
  const modelsLoadedRef = useRef(false);
  const violationCountRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Flatten questions
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

  // Load face-api models — local first, GitHub fallback
  useEffect(() => {
    const loadModels = async () => {
      try {
        const LOCAL_MODEL_URL = '/models';
        await faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_URL);
        console.log('[Proctoring] Face-api models loaded from LOCAL /models');
        modelsLoadedRef.current = true;
        setModelsLoaded(true);
      } catch (localErr) {
        console.warn("[Proctoring] Local model load failed, trying GitHub fallback...", localErr);
        try {
          const GITHUB_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
          await faceapi.nets.tinyFaceDetector.loadFromUri(GITHUB_URL);
          console.log('[Proctoring] Face-api models loaded from GitHub');
          modelsLoadedRef.current = true;
          setModelsLoaded(true);
        } catch (err) {
          console.error("Failed to load face-api models from both sources", err);
          modelsLoadedRef.current = false;
          setModelsLoaded(true); 
        }
      }
    };
    loadModels();
  }, []);

  const forceSubmit = useCallback(async (reason: string) => {
    if (isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    toast.error(`Test terminated: ${reason}`);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.log(e));
    }

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
          answers // Submit answers collected so far
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit test");
      }

      toast.success("Test auto-submitted successfully due to violation!");
      router.push(`/submissions/${data.submissionId}`);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during force submit");
    }
  }, [answers, id, router, studentName]);

  const startFaceDetection = useCallback(() => {
    if (detectionRef.current) clearInterval(detectionRef.current);

    // If models haven't loaded yet, retry after a delay
    if (!modelsLoadedRef.current) {
      console.log('[Proctoring] Models not loaded yet, retrying in 2s...');
      setTimeout(() => startFaceDetection(), 2000);
      return;
    }

    console.log('[Proctoring] Starting face detection polling');

    detectionRef.current = setInterval(async () => {
      try {
        if (videoRef.current && videoRef.current.readyState === 4) {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })
          );

          if (detections.length > 1) {
            violationCountRef.current += 1;
            setViolationCount(violationCountRef.current);
            setWarningMessage(
              `⚠️ MULTIPLE FACES DETECTED (${detections.length})! Violation ${violationCountRef.current}/3 — Ensure you are alone.`
            );
            toast.error(`Multiple faces detected! Violation ${violationCountRef.current}/3`);

            // Auto-submit after 3 multi-face violations
            if (violationCountRef.current >= 3 && !isSubmittingRef.current) {
              forceSubmit('Multiple persons detected repeatedly. Test auto-submitted.');
            }
          } else if (detections.length === 0) {
            setWarningMessage("⚠️ Face not visible! Remain in frame.");
          } else {
            setWarningMessage("");
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 2000);
  }, [forceSubmit]);

  useEffect(() => {
    if (hasStarted && stream && videoRef.current) {
      console.log('[Proctoring] Attaching camera stream to video element');
      videoRef.current.srcObject = stream;
      if (videoRef.current.readyState >= 1) {
        startFaceDetection();
      }
    }
  }, [hasStarted, stream, startFaceDetection]);

  const handleStart = async () => {
    if (!studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      // 1. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // 2. Request Camera
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });

      setStream(s);
      streamRef.current = s;
      setHasStarted(true);
      hasStartedRef.current = true;
      
      toast.success("Proctoring started. Stay in frame.");
    } catch (err) {
      console.error("Permission error:", err);
      setCameraError("Camera permission and Fullscreen access are strictly required to start the test.");
      toast.error("Failed to start proctoring. Please allow permissions.");
    }
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
    isSubmittingRef.current = true;

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.log(e));
    }

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
      isSubmittingRef.current = false;
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

  if (!assignment || !assignment.paper || typeof assignment.paper === 'string') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Unavailable</h2>
          <p className="text-muted-foreground mb-6">The requested test could not be found, is not ready yet, or is using a deprecated format.</p>
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
            
            <div className="flex flex-wrap gap-4 mb-6 text-sm font-semibold text-neutral-500">
              <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <Clock className="w-4 h-4" /> {assignment.timeLimit || 60} Minutes
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <Target className="w-4 h-4" /> {assignment.marks} Marks
              </div>
              <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg border border-rose-100">
                <Camera className="w-4 h-4" /> AI Proctoring Enabled
              </div>
            </div>

            {cameraError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6">
                {cameraError}
              </div>
            )}

            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium mb-8">
              <strong>Note:</strong> This test is AI proctored. You must grant camera access and remain in fullscreen mode. Multiple faces detected will result in automatic submission.
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
              className="w-full h-14 rounded-xl text-lg font-bold gap-2"
              disabled={!studentName.trim() || !modelsLoaded}
            >
              {!modelsLoaded ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {modelsLoaded ? "Grant Camera Access & Start Test" : "Loading AI Models..."}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        
        {/* Sticky Header with Camera and Controls */}
        <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md border border-neutral-200 shadow-lg rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Camera Feed */}
            <div className="w-32 h-24 bg-black rounded-xl overflow-hidden shrink-0 border-2 border-neutral-200 relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onLoadedMetadata={startFaceDetection}
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-[800] text-zinc-900 truncate font-bricolage text-lg">{assignment.topic}</h2>
              <p className="text-sm font-bold text-muted-foreground">{studentName}</p>
              {warningMessage && (
                <p className="text-xs font-bold text-red-600 mt-1 animate-pulse">
                  {warningMessage}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full gap-2 shadow-md w-full md:w-auto shrink-0"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Test
          </Button>
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          {flatQuestions.map((q) => (
            <div key={q.globalIndex} className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <span className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-[800] text-lg flex items-center justify-center">
                  {q.globalIndex + 1}
                </span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 block">
                    {q.sectionTitle}
                  </span>
                  <p className="text-lg font-semibold text-zinc-900 leading-relaxed">
                    {q.text}
                  </p>
                  <div className="mt-3 inline-flex text-xs font-bold bg-neutral-100 text-neutral-500 px-2 py-1 rounded-md">
                    {q.marks} Marks
                  </div>
                </div>
              </div>
              
              <div className="mt-6 md:pl-14">
                <Textarea 
                  placeholder="Write your answer here..."
                  className="min-h-[200px] bg-neutral-50/50 resize-y border-neutral-200 focus:border-primary/50 focus:ring-primary/20 text-base"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-[800] rounded-full gap-2 shadow-lg px-10 h-14 text-lg"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Finish & Submit Test
          </Button>
        </div>

      </div>
    </div>
  );
}
