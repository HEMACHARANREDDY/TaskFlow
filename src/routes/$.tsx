import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LostIllustration } from "@/components/illustrations";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — TaskFlow" },
      { name: "description", content: "This TaskFlow page could not be found." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Page not found — TaskFlow" },
      { property: "og:description", content: "This TaskFlow page could not be found." },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 grid-bg-fade opacity-60" />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <div className="w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
          <LostIllustration />
        </div>
        <h1 className="mt-6 text-6xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">Looks like this page got lost.</p>
        <Button asChild className="mt-8">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
