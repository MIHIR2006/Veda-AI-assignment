"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Target,
  Zap,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  Wand2,
  FileText,
  BarChart3,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import vedaLogo from "@/public/assets/veda-logo.png";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F3F0] overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-3 md:top-4 z-50 px-[80px] w-full">
        <div className="flex h-16 items-center justify-between border border-border bg-white px-6 rounded-[24px] shadow-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={vedaLogo}
              alt="VedaAI"
              className="h-9 w-9"
            />
            <span
              className="text-xl font-[800] tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-bricolage)" }}
            >
              VedaAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#why-veda" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              Why VedaAI
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full px-5 h-10 text-sm font-bold text-foreground hover:bg-neutral-100"
              asChild
            >
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button
              variant="dark"
              className="rounded-full px-6 h-10 text-sm font-bold gap-2"
              asChild
            >
              <Link href="/auth/signup">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Try VedaAI
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/8 via-amber-500/5 to-transparent rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-foreground/80">AI-Powered Teaching Assistant</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-6xl lg:text-[76px] font-[800] tracking-tight text-foreground leading-[1.05] mb-6"
              style={{ fontFamily: "var(--font-bricolage)" }}
            >
              Create Smarter
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-500 to-primary animate-gradient bg-[length:200%_auto]">
                Assignments
              </span>{" "}
              with AI
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-muted-foreground/70 font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Generate question papers, grade responses, and manage your classroom
              all powered by artificial intelligence. Built for modern educators.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="dark"
                size="lg"
                className="rounded-full px-10 h-14 text-base font-bold gap-2.5 shadow-xl shadow-zinc-900/20"
                asChild
              >
                <Link href="/auth/signup">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Get Started Free
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-10 h-14 text-base font-bold gap-2 bg-white hover:bg-neutral-50 border-neutral-200"
                asChild
              >
                <Link href="/auth/login">
                  See How It Works
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 max-w-5xl mx-auto"
          >
            <div className="relative rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 md:p-12 shadow-2xl overflow-hidden">
              {/* Animated glow orbs */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: "1s" }} />

              {/* Floating Icons */}
              <div className="absolute top-8 right-8 animate-float opacity-20">
                <GraduationCap className="w-20 h-20 text-white" />
              </div>
              <div className="absolute bottom-8 left-1/4 animate-float opacity-15" style={{ animationDelay: "1s" }}>
                <BookOpen className="w-14 h-14 text-white" />
              </div>
              <div className="absolute top-1/3 right-1/4 animate-float opacity-10" style={{ animationDelay: "2s" }}>
                <Users className="w-16 h-16 text-white" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white/90">
                    AI-Powered Teaching
                  </span>
                </div>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-[800] tracking-tight text-white mb-4 leading-[1.1]"
                  style={{ fontFamily: "var(--font-bricolage)" }}
                >
                  Welcome to
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 animate-gradient bg-[length:200%_auto]">
                    VedaAI
                  </span>
                </h2>
                <p className="text-base text-white/60 font-medium max-w-lg mb-8">
                  Create intelligent assignments, generate question papers, and
                  provide AI-powered grading — your complete teaching toolkit.
                </p>

                {/* Mini Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Brain, label: "AI-Powered", desc: "Smart question generation" },
                    { icon: Target, label: "Accurate", desc: "Precise grading & feedback" },
                    { icon: Zap, label: "Fast", desc: "Generate papers in seconds" },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                    >
                      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <f.icon className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{f.label}</p>
                        <p className="text-xs text-white/50 font-medium">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By / Social Proof */}
      <section className="py-16 px-6 border-y border-neutral-200/60 bg-white/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-wider mb-8">Trusted by educators worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {["10,000+ Papers Generated", "500+ Schools", "50,000+ Students", "99% Accuracy"].map((stat) => (
              <div key={stat} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold text-foreground/70">{stat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground/80">Powerful Features</span>
            </div>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-[800] tracking-tight text-foreground mb-4"
              style={{ fontFamily: "var(--font-bricolage)" }}
            >
              Everything you need to
              <br />
              <span className="text-primary">teach smarter</span>
            </h2>
            <p className="text-lg text-muted-foreground/60 font-medium max-w-2xl mx-auto">
              From question generation to grading, VedaAI handles the heavy lifting so you can focus on what matters most.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Wand2,
                title: "AI Question Generation",
                desc: "Generate diverse question types — MCQ, short answer, long answer — from any topic or uploaded content in seconds.",
                color: "bg-primary/10 text-primary",
                gradient: "from-primary/5 to-transparent",
              },
              {
                icon: FileText,
                title: "Smart Question Papers",
                desc: "Create well-structured question papers with automatic difficulty balancing, marks distribution, and formatting.",
                color: "bg-amber-500/10 text-amber-600",
                gradient: "from-amber-500/5 to-transparent",
              },
              {
                icon: BarChart3,
                title: "AI-Powered Grading",
                desc: "Get instant, accurate grading with detailed feedback. Save hours of manual evaluation work.",
                color: "bg-emerald-500/10 text-emerald-600",
                gradient: "from-emerald-500/5 to-transparent",
              },
              {
                icon: ClipboardList,
                title: "Assignment Management",
                desc: "Create, distribute, and track assignments across your classes. Monitor progress in real-time.",
                color: "bg-blue-500/10 text-blue-600",
                gradient: "from-blue-500/5 to-transparent",
              },
              {
                icon: Users,
                title: "Group Collaboration",
                desc: "Organize students into groups, share assignments, and facilitate collaborative learning experiences.",
                color: "bg-violet-500/10 text-violet-600",
                gradient: "from-violet-500/5 to-transparent",
              },
              {
                icon: BookOpen,
                title: "Content Library",
                desc: "Build and manage your personal library of questions, papers, and teaching materials for easy reuse.",
                color: "bg-rose-500/10 text-rose-600",
                gradient: "from-rose-500/5 to-transparent",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[24px] border border-neutral-100 bg-white p-7 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                <div className="relative z-10">
                  <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3
                    className="text-lg font-[800] tracking-tight text-foreground mb-2"
                    style={{ fontFamily: "var(--font-bricolage)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/60 border-y border-neutral-200/60">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground/80">Simple Process</span>
            </div>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-[800] tracking-tight text-foreground mb-4"
              style={{ fontFamily: "var(--font-bricolage)" }}
            >
              How VedaAI works
            </h2>
            <p className="text-lg text-muted-foreground/60 font-medium max-w-2xl mx-auto">
              Three simple steps to transform your teaching workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Define Your Assignment",
                desc: "Enter the topic, select question types, set difficulty levels, and specify the number of questions you need.",
                icon: ClipboardList,
              },
              {
                step: "02",
                title: "AI Generates Content",
                desc: "Our AI engine creates high-quality, context-aware questions with answer keys and marking schemes instantly.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Review & Distribute",
                desc: "Review the generated content, make any adjustments, and distribute to your students with one click.",
                icon: CheckCircle2,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative text-center group"
              >
                <div className="relative inline-flex mb-6">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <item.icon className="h-9 w-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-lg">
                    {item.step}
                  </span>
                </div>
                <h3
                  className="text-xl font-[800] tracking-tight text-foreground mb-3"
                  style={{ fontFamily: "var(--font-bricolage)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground/60 font-medium leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why VedaAI */}
      <section id="why-veda" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground/80">Why Choose Us</span>
              </div>
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-[800] tracking-tight text-foreground mb-6 leading-[1.1]"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                Built for educators,
                <br />
                <span className="text-primary">by educators</span>
              </h2>
              <p className="text-lg text-muted-foreground/60 font-medium mb-8 leading-relaxed">
                VedaAI understands the challenges teachers face daily. We&apos;ve built every feature with real classroom needs in mind.
              </p>

              <div className="space-y-5">
                {[
                  { title: "Save 10+ Hours Weekly", desc: "Automate question paper creation and grading" },
                  { title: "Curriculum Aligned", desc: "Generate content that matches your syllabus" },
                  { title: "Secure & Private", desc: "Your data stays encrypted and protected" },
                  { title: "Real-Time Analytics", desc: "Track student performance and progress" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-[800] text-foreground tracking-tight" style={{ fontFamily: "var(--font-bricolage)" }}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground/60 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-[50px]" />

                <div className="relative z-10 space-y-4">
                  {/* Stats Display */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Papers Generated", value: "10K+", color: "text-primary" },
                      { label: "Time Saved", value: "500h+", color: "text-amber-400" },
                      { label: "Accuracy Rate", value: "99%", color: "text-emerald-400" },
                      { label: "Happy Teachers", value: "2K+", color: "text-violet-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                        <p className={`text-2xl font-[800] ${s.color} mb-1`} style={{ fontFamily: "var(--font-bricolage)" }}>
                          {s.value}
                        </p>
                        <p className="text-xs text-white/50 font-bold">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini Testimonial */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                    <p className="text-sm text-white/80 font-medium italic leading-relaxed mb-3">
                      &ldquo;VedaAI has completely transformed how I create assessments. What used to take me hours now takes minutes.&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-xs font-black text-amber-400">SK</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Sanjay Kumar</p>
                        <p className="text-[11px] text-white/40 font-medium">Science Teacher, DPS</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-[32px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-12 md:p-16 text-center shadow-2xl overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm font-semibold text-white/90">Start for free</span>
              </div>

              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-[800] tracking-tight text-white mb-4 leading-[1.1]"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                Ready to transform
                <br />
                your teaching?
              </h2>
              <p className="text-lg text-white/60 font-medium max-w-xl mx-auto mb-10">
                Join thousands of educators already using VedaAI to create better
                assessments in less time.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  className="bg-white hover:bg-neutral-100 text-zinc-900 rounded-full px-10 h-14 gap-2.5 shadow-lg font-bold text-base"
                  asChild
                >
                  <Link href="/auth/signup">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Get Started Free
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 text-white border-white/30 rounded-full px-10 h-14 gap-2 font-semibold text-base"
                  asChild
                >
                  <Link href="/auth/login">
                    Log In to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-[10px] pb-[10px] mt-20">
        <div className="border border-neutral-200/60 bg-white shadow-sm rounded-[24px] py-10 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image
                src={vedaLogo}
                alt="VedaAI"
                className="h-7 w-7"
              />
              <span
                className="text-lg font-[800] tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                VedaAI
              </span>
            </div>

            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-muted-foreground/60 hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-bold text-muted-foreground/60 hover:text-foreground transition-colors">
                How It Works
              </a>
              <Link href="/auth/login" className="text-sm font-bold text-muted-foreground/60 hover:text-foreground transition-colors">
                Log In
              </Link>
              <Link href="/auth/signup" className="text-sm font-bold text-muted-foreground/60 hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>

            <p className="text-xs font-bold text-muted-foreground/40">
              &copy; 2025 VedaAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
