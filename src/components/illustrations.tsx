import { cn } from "@/lib/utils";
import heroWorkspace from "@/assets/hero-workspace.jpg";
import emptyTasks from "@/assets/empty-tasks.jpg";
import analyticsVisual from "@/assets/analytics-visual.jpg";
import authVisual from "@/assets/auth-visual.jpg";
import searchingVisual from "@/assets/searching-visual.jpg";
import celebrateVisual from "@/assets/celebrate-visual.jpg";
import lostVisual from "@/assets/lost-visual.jpg";
import organizeVisual from "@/assets/organize-visual.jpg";

type Props = { className?: string | undefined; priority?: boolean };

function Art({ src, alt, className, priority }: Props & { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={1024}
      height={768}
      {...(priority ? {} : { loading: "lazy" as const })}
      className={cn("h-full w-full rounded-2xl bg-white object-contain select-none", className)}
      draggable={false}
    />
  );
}

/** Workspace hero artwork. */
export function DeskIllustration({ className, priority }: Props) {
  return (
    <Art
      src={heroWorkspace}
      alt="Sketch of a desk workspace with laptop and task notes"
      className={className}
      priority={priority ?? true}
    />
  );
}

/** Empty task list artwork. */
export function PlanningIllustration({ className, priority }: Props) {
  return (
    <Art
      src={emptyTasks}
      alt="Sketch of an empty checklist clipboard"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** Analytics artwork. */
export function ChartIllustration({ className, priority }: Props) {
  return (
    <Art
      src={analyticsVisual}
      alt="Sketch of hand-drawn bar, line and pie charts"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** Search / no-results artwork. */
export function SearchingIllustration({ className, priority }: Props) {
  return (
    <Art
      src={searchingVisual}
      alt="Sketch of a magnifying glass over a search field"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** Celebration artwork for all-clear states. */
export function CelebrateIllustration({ className, priority }: Props) {
  return (
    <Art
      src={celebrateVisual}
      alt="Sketch of a trophy with a checkmark and confetti"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** 404 artwork. */
export function LostIllustration({ className, priority }: Props) {
  return (
    <Art
      src={lostVisual}
      alt="Sketch of a signpost with a question mark"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** Auth screen artwork. */
export function AuthIllustration({ className, priority }: Props) {
  return (
    <Art
      src={authVisual}
      alt="Sketch of a shield beside a login card"
      className={className}
      priority={priority ?? false}
    />
  );
}

/** Task organization artwork. */
export function OrganizeIllustration({ className, priority }: Props) {
  return (
    <Art
      src={organizeVisual}
      alt="Sketch of stacked task cards with priority tags and a calendar"
      className={className}
      priority={priority ?? false}
    />
  );
}
