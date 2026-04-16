"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles, ArrowRight, CheckCircle2, Wand2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import vedaLogo from "@/public/assets/veda-logo.png";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    schoolName: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Login failed after registration');
        setIsLoading(false);
      } else {
        router.push("/home");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Something went wrong');
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = (provider: string) => {
    signIn(provider, { callbackUrl: "/home" });
  };

  const benefits = [
    { icon: Wand2, text: "AI-Powered Generation", desc: "Generate papers in seconds" },
    { icon: CheckCircle2, text: "Smart Content", desc: "Context-aware questions" },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F3F0]">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src={vedaLogo} alt="VedaAI" className="h-12 w-12" />
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-[28px] font-[800] tracking-tight text-foreground/90 mb-1" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Create your account
            </h1>
            <p className="text-sm font-semibold text-muted-foreground/70">
              Start generating AI powered question papers
            </p>
          </div>

          <div className="rounded-[24px] border border-neutral-100 bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-[800] tracking-tight mb-1.5 block text-foreground/80">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    type="text" 
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-card font-semibold h-10 rounded-lg border-neutral-200 pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-[800] tracking-tight mb-1.5 block text-foreground/80">School Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    type="text" 
                    placeholder="Delhi Public School"
                    value={formData.schoolName}
                    onChange={(e) => handleChange("schoolName", e.target.value)}
                    className="bg-card font-semibold h-10 rounded-lg border-neutral-200 pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-[800] tracking-tight mb-1.5 block text-foreground/80">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    type="email" 
                    placeholder="name@school.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-card font-semibold h-10 rounded-lg border-neutral-200 pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-[800] tracking-tight mb-1.5 block text-foreground/80">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Create password (8+ chars)"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="bg-card font-semibold h-10 rounded-lg border-neutral-200 pl-10 pr-10 text-sm"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 py-1">
                <input type="checkbox" className="rounded border-neutral-300 w-3.5 h-3.5 mt-0.5 accent-primary" required />
                <span className="text-xs font-bold text-muted-foreground/70">
                  I agree to the{" "}
                  <button type="button" className="text-primary hover:underline">Terms</button>
                  {" "}and{" "}
                  <button type="button" className="text-primary hover:underline">Privacy</button>
                </span>
              </div>

              <Button type="submit" variant="dark" className="w-full h-10 text-sm font-bold rounded-lg" disabled={isLoading}>
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-3 text-muted-foreground/50 font-bold">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-9 rounded-lg font-semibold text-xs" onClick={() => handleOAuthSignUp("google")}>
                <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-9 rounded-lg font-semibold text-xs" onClick={() => handleOAuthSignUp("github")}>
                <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </div>

          <p className="text-center mt-4 text-sm font-semibold text-muted-foreground/70">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual/Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-zinc-900 via-zinc-800 to-zinc-900">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-8">
              <Image src={vedaLogo} alt="VedaAI" className="h-20 w-20" />
            </div>
            <h2 className="text-4xl font-[800] text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-bricolage)' }}>
              Join VedaAI Today
            </h2>
            <p className="text-white/60 text-lg font-medium mb-12">
              Transform your teaching with AI powered question paper generation
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className={`h-12 w-12 rounded-xl ${index === 0 ? 'bg-primary/20' : 'bg-emerald-500/20'} flex items-center justify-center`}>
                    <benefit.icon className={`h-6 w-6 ${index === 0 ? 'text-primary' : 'text-emerald-500'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold">{benefit.text}</p>
                    <p className="text-white/60 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-neutral-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-zinc-700">{i}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/70 text-sm font-medium">
                Join <span className="text-white font-bold">500+</span> educators
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}