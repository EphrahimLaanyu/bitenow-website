import Link from "next/link";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    number?: string;
    order?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { number, order } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 aria-hidden size={40} />
        </span>
        <Badge className="mt-6">Order placed</Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Your order is with the kitchen.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
          {number ? `Order ${number} has been submitted successfully.` : "Your order has been submitted successfully."}
        </p>

        {order ? (
          <p className="mt-4 break-all rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--muted)]">
            Order ID: {order}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 text-sm font-bold text-[var(--primary-foreground)] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
            href="/client/orders"
          >
            <ClipboardList aria-hidden size={18} />
            View orders
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:bg-[var(--surface-2)]"
            href="/client/hotels"
          >
            Browse hotels
          </Link>
        </div>
      </Card>
    </div>
  );
}
