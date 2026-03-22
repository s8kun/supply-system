import { LucideIcon, SearchX } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <Icon className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
