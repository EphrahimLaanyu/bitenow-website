import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, ConciergeBell, ShieldCheck, Utensils } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="bg-[#101f3f] px-5 py-5 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
            <Utensils aria-hidden size={18} />
          </span>
          <div>
            <p className="brand-logo text-2xl text-white">Bite<span className="text-[var(--accent)]">Now</span></p>
            <p className="text-xs font-semibold text-[#c8d2e4]">Order fast. Eat now.</p>
          </div>
        </Link>
        <Link className="text-sm font-bold text-white hover:text-[var(--accent)]" href="/client/hotels">
          Guest ordering
        </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 px-5 pb-10 pt-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="animate-[fadeIn_0.55s_ease-out] rounded-[2rem] bg-[#101f3f] p-8 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--accent)]">
            Premium hotel ordering platform
          </p>

          <h1 className="font-display mt-7 max-w-3xl text-5xl font-black leading-[1.02] md:text-7xl">
            Run service beautifully. <span className="text-[var(--accent)]">Serve now.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c8d2e4]">
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
          <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="mb-8">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg shadow-orange-500/20">
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
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:text-[var(--accent-hover)]"
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
