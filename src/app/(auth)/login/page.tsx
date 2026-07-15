import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, ConciergeBell, ShieldCheck, Sparkles, Utensils } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
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

      <section className="mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-7xl gap-10 px-5 pb-10 pt-4 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="animate-[fadeIn_0.55s_ease-out]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--muted-strong)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Premium hotel ordering platform
          </div>

          <h1 className="mt-7 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
            Run smoother service. Serve better moments.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            BiteNow gives hotels and restaurants a polished command center for menus, orders,
            tables, staff, and guest dining experiences.
          </p>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <LoginSignal icon={Utensils} label="Smart menus" />
            <LoginSignal icon={BellRing} label="Live orders" />
            <LoginSignal icon={ShieldCheck} label="Secure access" />
          </div>
        </div>

        <div className="relative animate-[fadeIn_0.65s_ease-out]">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-[var(--primary)]/10 blur-2xl" />
          <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="mb-8">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-orange-500/20">
                <ConciergeBell aria-hidden size={26} />
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Sign in to manage orders, payments, staff, kitchen flow, and hotel operations.
              </p>
            </div>

            <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading sign in...</p>}>
              <LoginForm />
            </Suspense>

            <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <Link
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                href="/client/hotels"
              >
                Continue to guest ordering
                <ArrowRight aria-hidden size={16} />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function LoginSignal({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <Icon aria-hidden size={22} className="text-[var(--primary)]" />
      <p className="mt-3 text-sm font-bold text-[var(--foreground)]">{label}</p>
    </div>
  );
}
