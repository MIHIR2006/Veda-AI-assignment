"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Minus, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

interface QuestionRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

const questionTypes = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Fill in the Blanks",
  "True/False",
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { startJob } = useAssignmentStore();
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [fileData, setFileData] = useState<{ name: string, base64: string, mimeType: string } | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({
          name: selected.name,
          base64: reader.result as string,
          mimeType: selected.type
        });
      };
      reader.readAsDataURL(selected);
    }
  };

  const [questions, setQuestions] = useState<QuestionRow[]>([
    { id: "1", type: "Multiple Choice Questions", count: 4, marks: 1 },
    { id: "2", type: "Short Questions", count: 3, marks: 2 },
    { id: "3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
  ]);

  const addQuestionRow = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), type: questionTypes[0], count: 1, marks: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateRow = (id: string, field: keyof QuestionRow, value: number | string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const submitAssignment = async () => {
    try {
      const payload: any = {
        topic: topic || "General Science",
        marks: questions.reduce((s, q) => s + q.count * q.marks, 0),
        difficulty: "Medium",
        questionTypes: questions.map(q => q.type),
        instructions: instructions
      };
      
      if (fileData) {
        payload.imageBase64 = fileData.base64;
        payload.mimeType = fileData.mimeType;
      }

      const res = await fetch('http://localhost:8080/api/generate-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        // data.jobId, data.assignmentId
        startJob(data.jobId);
        router.push(`/assignments/${data.assignmentId}`);
      } else {
        console.error("Failed to generate");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="Assignment" showBack onBack={() => router.push("/assignments")}>
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <h1 className="text-2xl font-bold">Create Assignment</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Set up a new assignment for your students
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-dark" : "bg-border"}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-dark" : "bg-border"}`} />
        </div>

        {step === 1 && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Assignment Details</h2>
              <p className="text-sm text-muted-foreground">Basic information about your assignment</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
                title="Upload lesson notes"
              />
              <Upload className={`h-10 w-10 mb-3 ${fileData ? 'text-primary' : 'text-muted-foreground'}`} />
              
              {fileData ? (
                <>
                  <p className="text-sm font-medium mb-1 text-primary">{fileData.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">Ready to be analyzed by AI</p>
                  <Button variant="secondary" size="sm" className="relative z-20" onClick={(e) => { e.preventDefault(); setFileData(null); }}>Remove File</Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">Choose a file or drag & drop it here</p>
                  <p className="text-xs text-muted-foreground mb-3">JPEG, PNG, upto 10MB</p>
                  <Button variant="outline" size="sm">Browse Files</Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center -mt-3">
              Upload images of your preferred document/image (optional)
            </p>

            <div>
              <label className="text-sm font-bold mb-2 block">Topic / Title</label>
              <Input placeholder="E.g., CBSE Grade 8 Science" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-card mb-4" />
              
              <label className="text-sm font-bold mb-2 block">Additional Instructions</label>
              <Input placeholder="E.g., Provide hints for each question" value={instructions} onChange={(e) => setInstructions(e.target.value)} className="bg-card" />
            </div>

            <div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-3">
                <label className="text-sm font-bold">Question Type</label>
                <span className="text-sm font-bold text-center">No. of Questions</span>
                <span className="text-sm font-bold text-center">Marks</span>
              </div>
              {questions.map((q) => (
                <div key={q.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={q.type}
                      onValueChange={(val) => updateRow(q.id, "type", val)}
                    >
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button onClick={() => removeRow(q.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateRow(q.id, "count", Math.max(1, q.count - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{q.count}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateRow(q.id, "count", q.count + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateRow(q.id, "marks", Math.max(1, q.marks - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{q.marks}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateRow(q.id, "marks", q.marks + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addQuestionRow} className="gap-1 text-primary mt-2">
                <Plus className="h-4 w-4" />
                Add Question Type
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Review & Confirm</h2>
              <p className="text-sm text-muted-foreground">Review your assignment details before creating</p>
            </div>
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="flex justify-between rounded-lg bg-accent p-3 text-sm">
                  <span>{q.type}</span>
                  <span className="text-muted-foreground">{q.count} questions × {q.marks} marks</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 text-sm font-bold">
              <span>Total</span>
              <span>
                {questions.reduce((s, q) => s + q.count, 0)} questions,{" "}
                {questions.reduce((s, q) => s + q.count * q.marks, 0)} marks
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => (step === 1 ? router.push("/assignments") : setStep(1))}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="dark"
            size="lg"
            onClick={() => {
              if (step === 1) {
                setStep(2);
              } else {
                submitAssignment();
              }
            }}
            className="gap-2"
          >
            {step === 1 ? "Next" : "Create Assignment"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
