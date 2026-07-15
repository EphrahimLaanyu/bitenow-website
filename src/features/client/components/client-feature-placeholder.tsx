import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ClientFeaturePlaceholderProps = {
  description: string;
  title: string;
};

export function ClientFeaturePlaceholder({ description, title }: ClientFeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <Badge>Client foundation</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>

      <Card>
        <p className="text-sm leading-6 text-[var(--muted)]">
          This client route is separated from the staff dashboard layout and uses the same shared API
          client, auth provider, token refresh logic, TypeScript types, error handling, and active
          hotel storage.
        </p>
      </Card>
    </div>
  );
}
