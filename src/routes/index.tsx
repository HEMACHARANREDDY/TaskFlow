import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import {
  ChartIllustration,
  DeskIllustration,
  OrganizeIllustration,
} from "@/components/illustrations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskFlow — Turn your tasks into progress" },
      {
        name: "description",
        content:
          "TaskFlow is a calm task management workspace with real analytics: plan work, track progress and understand your productivity.",
      },
      { property: "og:title", content: "TaskFlow — Turn your tasks into progress" },
      {
        property: "og:description",
        content:
          "Plan your work, stay focused and understand your productivity with a workspace designed for clarity.",
      },
    ],
  }),
  component: Landing,
});

const STRIP = [
  "Smart task management",
  "Simple analytics",
  "Built for focus",
  "Designed for teams",
];

const BLOCKS = [
  {
    n: "01",
    title: "Organize",
    body: "Create and manage tasks effortlessly with priorities, due dates and search that actually finds things.",
    art: OrganizeIllustration,
  },
  {
    n: "02",
    title: "Execute",
    body: "Track progress from Todo to In Progress to Done, with overdue detection that keeps you honest.",
    art: DeskIllustration,
  },
  {
    n: "03",
    title: "Understand",
    body: "Turn your work into meaningful insights — completion rate, weekly output and priority balance.",
    art: ChartIllustration,
  },
];

const STATS = [
  { value: 4, suffix: "x", label: "Faster weekly planning" },
  { value: 98, suffix: "%", label: "Tasks tracked to done" },
  { value: 30, suffix: "d", label: "Completion trend window" },
  { value: 0, suffix: "", label: "Fake data points", zero: true },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || to === 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

function Landing() {
  const { resolved, toggle } = useTheme();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const artRotate = useTransform(scrollYProgress, [0, 1], [0, -2]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <Logo />
          <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">
              Product
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#analytics" className="hover:text-foreground">
              Analytics
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            <a href="#about" className="hover:text-foreground">
              About
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section
        id="product"
        ref={heroRef}
        className="relative overflow-hidden border-b border-border"
      >
        <div className="absolute inset-0 veil" />
        <div className="absolute inset-0 grid-bg-fade opacity-40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <motion.div
            style={{ y: copyY }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="eyebrow inline-flex rounded-full border border-border bg-card/70 px-3 py-1 text-muted-foreground backdrop-blur">
              Plan · Track · Accomplish
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl">
              Turn your tasks into <span className="text-gradient">progress</span>.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Plan your work, stay focused, and understand your productivity with a task management
              workspace designed for clarity.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">Explore Dashboard</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            style={{ y: artY, rotate: artRotate }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bento-card p-2"
          >
            <div className="float-slow">
              <DeskIllustration className="aspect-[4/3] rounded-xl" priority />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border">
        <div className="marquee-track py-5">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
              {STRIP.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-6 whitespace-nowrap px-6 text-sm text-muted-foreground"
                >
                  {s}
                  <span className="h-1 w-1 rounded-full bg-primary/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-background px-6 py-10"
            >
              <p className="text-4xl font-semibold tracking-tight">
                {s.zero ? "0" : <Counter to={s.value} suffix={s.suffix} />}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <p className="eyebrow text-muted-foreground">Features</p>
        <h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
          A workspace that respects your attention.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-6">
          {BLOCKS.map((b, i) => (
            <motion.article
              key={b.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className={`group bento-card flex flex-col justify-between p-6 ${i === 0 ? "md:col-span-3" : i === 1 ? "md:col-span-3" : "md:col-span-6 md:flex-row md:items-center md:gap-10"}`}
            >
              <div className={i === 2 ? "md:flex-1" : ""}>
                <p className="text-sm text-muted-foreground">{b.n} —</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">{b.body}</p>
              </div>
              <div
                className={`mt-6 h-56 overflow-hidden rounded-xl bg-surface ${i === 2 ? "md:mt-0 md:h-56 md:w-1/2" : ""}`}
              >
                <b.art className="h-full transition-transform duration-500 group-hover:scale-[1.04]" />
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="analytics" className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-muted-foreground">Analytics</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your productivity, visualized.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Status distribution, weekly output, priority balance and a 30-day completion trend —
              all calculated from your real tasks, never from placeholder data.
            </p>
          </div>
          <div className="bento-card p-2">
            <ChartIllustration className="aspect-[4/3] rounded-xl" />
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-border bg-background py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <p className="eyebrow text-muted-foreground">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to know about TaskFlow and how it works.
            </p>
          </div>

          <div className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-base font-semibold">
                  What makes TaskFlow different from other task managers?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  TaskFlow combines clean, distraction-free task management with native productivity
                  analytics. Rather than just listing tasks, TaskFlow measures your real weekly
                  output, completion velocity, and priority balance without requiring complex manual
                  setup.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-base font-semibold">
                  Can I sign in using Google OAuth?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Yes, TaskFlow offers seamless single sign-on with Google Identity Services (GIS)
                  as well as traditional email and password authentication with encrypted password
                  security.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-base font-semibold">
                  How are task analytics and completion rates calculated?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  All analytics are generated from your active task records. The completion rate
                  reflects your ratio of completed tasks to total tasks, and the weekly velocity
                  tracks completed work over a rolling 7-day and 30-day window.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-base font-semibold">
                  Does TaskFlow support dark and light mode?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  Yes, TaskFlow comes with custom-tailored dark and light themes with smooth
                  transitions, accessible contrast ratios, and instant theme toggling across every
                  page.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <footer id="about" className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              TaskFlow is a focused task management and analytics workspace built for people who
              want fewer, better tools.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/auth">Start for free</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} TaskFlow</p>
      </footer>
    </div>
  );
}
