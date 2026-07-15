import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  LayoutDashboard,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const signals = [
  { icon: Search, label: "Find hotels", value: "Fast discovery" },
  { icon: Utensils, label: "Browse menus", value: "Live catalogues" },
  { icon: ShoppingBag, label: "Order meals", value: "Easy checkout" }
];

export default function HomePage() {
  return (
    <main className="app-shell overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20">
            <Sparkles aria-hidden size={22} />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-tight">BiteNow</p>
            <p className="text-xs font-semibold text-[var(--muted)]">Hotel dining, simplified</p>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-7xl gap-10 px-5 pb-10 pt-6 md:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div className="animate-[fadeIn_0.55s_ease-out]">
          <Badge>Premium guest ordering</Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
            Hotel food ordering that feels effortless.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            BiteNow helps guests find the right hotel, explore polished menus, and place orders
            with confidence while staff manage operations from a secure console.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-bold text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
              href="/client/hotels"
            >
              Browse hotels
              <ArrowRight aria-hidden size={18} />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--foreground)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]"
              href="/dashboard"
            >
              <LayoutDashboard aria-hidden size={18} />
              Staff dashboard
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {signals.map((signal) => (
              <HomeSignal key={signal.label} {...signal} />
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden p-0">
          <div className="border-b border-[var(--border)] bg-[var(--surface-3)] px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--muted)]">Guest experience</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">The Grand Meridian</h2>
              </div>
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-extrabold text-[var(--accent-foreground)]">
                Open
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex min-h-56 items-center justify-center p-8 text-center">
                <div>
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20">
                    <Building2 aria-hidden size={34} />
                  </span>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-tight">Dinner is ready when you are.</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
                    Search hotels by name, location, or code, then continue into the menu built for
                    that hotel.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewCard icon={Clock3} label="Average prep" value="18 min" />
              <PreviewCard icon={ShieldCheck} label="Secure ordering" value="Protected" />
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

function HomeSignal({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <Icon aria-hidden className="text-[var(--primary)]" size={20} />
      <p className="mt-3 text-sm font-extrabold text-[var(--foreground)]">{label}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{value}</p>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <Icon aria-hidden className="text-[var(--accent)]" size={20} />
      <p className="mt-3 text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
