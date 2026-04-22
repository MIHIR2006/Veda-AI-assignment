"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GraduationCap, ArrowRight, Key, Loader2 } from "lucide-react";

export default function JoinTestPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setIsLoading(true);
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const res = await fetch(`${apiUrl}/api/assignments/join/${joinCode.toUpperCase()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to join test");
        if (data.submissionId) {
          router.push(`/submissions/${data.submissionId}`);
        }
        setIsLoading(false);
        return;
      }
      
      toast.success("Successfully found test!");
      router.push(`/test/${data._id}`);
    } catch (error) {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-20 animate-fade-in">
        <div className="rounded-[32px] border border-neutral-100 bg-card p-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-[800] tracking-tight mb-2 text-foreground" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Join a Test
            </h1>
            <p className="text-muted-foreground font-medium mb-8">
              Enter the 6-character code provided by your teacher to begin the test.
            </p>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <Input
                  type="text"
                  placeholder="Enter join code (e.g., A1B2C3)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="pl-12 h-14 text-center text-lg font-bold tracking-widest uppercase bg-neutral-50/50 border-neutral-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
                  maxLength={6}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                variant="dark"
                className="w-full h-14 text-lg font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading || joinCode.length < 6}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue to Test
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
