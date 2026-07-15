import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
};

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <Badge>Foundation ready</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>

      <Card>
        <p className="text-sm text-[var(--muted)]">
          This feature folder and route are wired. The full workflow will be built in a later step.
        </p>
      </Card>
    </div>
  );
}
