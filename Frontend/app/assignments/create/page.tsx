"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { Upload, Plus, Minus, X, ArrowLeft, ArrowRight, CalendarIcon } from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const questionSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  count: z.number().min(1, "At least 1 question"),
  marks: z.number().min(1, "Marks must be >= 1"),
});

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  instructions: z.string().optional(),
  dueDate: z.string().min(1, "Due Date is required"),
  questions: z.array(questionSchema).min(1, "At least one question type is required"),
});

type FormValues = z.infer<typeof formSchema>;

const questionTypes = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Fill in the Blanks",
  "True/False",
];

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = PopoverPrimitive.Content;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { startJob } = useAssignmentStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileData, setFileData] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    setToday(currentDate);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      instructions: "",
      dueDate: "",
      questions: [
        { id: "1", type: "Multiple Choice Questions", count: 4, marks: 1 },
        { id: "2", type: "Short Questions", count: 3, marks: 2 },
        { id: "3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
      ],
    },
  });

  const { register, watch, setValue, trigger, formState: { errors } } = form;
  const questions = watch("questions");

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setValue("dueDate", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true });
    setCalendarOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({
          name: selected.name,
          base64: reader.result as string,
          mimeType: selected.type,
        });
      };
      reader.readAsDataURL(selected);
    }
  };

  const addQuestionRow = () => {
    setValue("questions", [
      ...questions,
      { id: Date.now().toString(), type: questionTypes[0], count: 1, marks: 1 },
    ]);
  };

  const removeRow = (id: string) => {
    setValue("questions", questions.filter((q) => q.id !== id));
  };

  const updateRow = (id: string, field: keyof z.infer<typeof questionSchema>, value: number | string) => {
    setValue("questions", questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const submitAssignment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        topic: watch("topic") || "General Science",
        marks: questions.reduce((s, q) => s + q.count * q.marks, 0),
        difficulty: "Medium",
        questionTypes: questions.map((q) => q.type),
        instructions: watch("instructions"),
        dueDate: watch("dueDate"),
      };

      if (fileData) {
        payload.imageBase64 = fileData.base64;
        payload.mimeType = fileData.mimeType;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/generate-paper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        startJob(data.jobId);
        router.push(`/assignments/${data.assignmentId}`);
      } else {
        toast.error("Failed to generate assignment");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server is waking up, please try again");
      setIsSubmitting(false);
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
          <p className="text-sm text-muted-foreground">Set up a new assignment for your students</p>
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

            {/* File Upload */}
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                title="Upload lesson notes (PDF or Image)"
              />
              <Upload className={`h-10 w-10 mb-3 ${fileData ? "text-primary" : "text-muted-foreground"}`} />
              {fileData ? (
                <>
                  <p className="text-sm font-medium mb-1 text-primary">{fileData.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">Ready to be analyzed by AI</p>
                  <Button variant="secondary" size="sm" className="relative z-20" onClick={(e) => { e.preventDefault(); setFileData(null); }}>
                    Remove File
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">Choose a file or drag & drop it here</p>
                  <p className="text-xs text-muted-foreground mb-3">JPEG, PNG, PDF up to 10MB</p>
                  <Button type="button" variant="outline" size="sm">Browse Files</Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center -mt-3">
              Upload images or PDF of your preferred document (optional)
            </p>

            <div>
              {/* Topic */}
              <label className="text-sm font-bold mb-2 block">
                Topic / Title <span className="text-destructive">*</span>
              </label>
              <Input placeholder="E.g., CBSE Grade 8 Science" {...register("topic")} className="bg-card mb-1" />
              {errors.topic && <p className="text-red-500 text-xs mb-3">{errors.topic.message}</p>}

              <label className="text-sm font-bold mb-2 mt-4 block">
                Due Date <span className="text-destructive">*</span>
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-card",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[1.5rem] shadow-[0_14px_45px_rgba(15,23,42,0.15)] border border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => (today ? date < today : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && <p className="text-red-500 text-xs mt-1 mb-3">{errors.dueDate.message}</p>}

              {/* Instructions */}
              <label className="text-sm font-bold mb-2 mt-4 block">Additional Instructions</label>
              <Input placeholder="E.g., Provide hints for each question , Time Allowed 1 hour" {...register("instructions")} className="bg-card mb-1" />
              {errors.instructions && <p className="text-red-500 text-xs mb-3">{errors.instructions.message}</p>}
            </div>

            {/* Questions Table */}
            <div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-3">
                <label className="text-sm font-bold">Question Type</label>
                <span className="text-sm font-bold text-center">No. of Questions</span>
                <span className="text-sm font-bold text-center">Marks</span>
              </div>
              {questions.map((q) => (
                <div key={q.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Select value={q.type} onValueChange={(val) => updateRow(q.id, "type", val)}>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => removeRow(q.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateRow(q.id, "count", Math.max(1, q.count - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{q.count}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateRow(q.id, "count", q.count + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateRow(q.id, "marks", Math.max(1, q.marks - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{q.marks}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateRow(q.id, "marks", q.marks + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-end gap-1 mt-4 text-sm font-semibold text-muted-foreground pr-2">
                <p>Total Questions : <span className="text-foreground">{questions.reduce((sum, q) => sum + q.count, 0)}</span></p>
                <p>Total Marks : <span className="text-foreground">{questions.reduce((sum, q) => sum + (q.count * q.marks), 0)}</span></p>
              </div>

              <Button type="button" variant="ghost" size="sm" onClick={addQuestionRow} className="gap-1 text-primary mt-2">
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

            <div className="rounded-lg bg-accent p-4 mb-4">
              <h3 className="font-bold text-lg">{watch("topic")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Due: {isMounted && selectedDate ? format(selectedDate, "PPP") : "—"}
              </p>
            </div>

            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="flex justify-between rounded-lg bg-background border border-border p-3 text-sm">
                  <span className="font-medium">{q.type}</span>
                  <span className="text-muted-foreground">{q.count} questions × {q.marks} marks</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 text-sm font-bold border-t border-border mt-4">
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
            type="button"
            variant="outline"
            size="lg"
            onClick={() => (step === 1 ? router.push("/assignments") : setStep(1))}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="dark"
            size="lg"
            disabled={isSubmitting && step === 2}
            onClick={async () => {
              if (step === 1) {
                const isValid = await trigger(["topic", "dueDate", "questions"]);
                if (isValid) setStep(2);
              } else {
                submitAssignment();
              }
            }}
            className="gap-2"
          >
            {step === 1 ? "Next" : isSubmitting ? "Creating..." : "Create Assignment"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            {isSubmitting && step === 2 && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
