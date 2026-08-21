import { Button } from "@/components/ui/button";

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  illustration: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        {illustration}
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
        {secondaryLabel && onSecondary ? (
          <Button variant="outline" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
