import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, ConciergeBell, ShieldCheck, Utensils } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="auth-page grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT SIDE - BRANDING & INFO (Hidden on mobile to focus on auth) */}
      <section className="auth-brand-panel hidden flex-col justify-between p-12 lg:flex">
        {/* Logo */}
        <Link className="flex w-fit items-center gap-2.5 transition-opacity hover:opacity-90" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white shadow-sm border border-slate-700">
            <Utensils aria-hidden size={18} />
          </span>
          <span className="text-xl font-bold tracking-tight">BiteNow</span>
        </Link>

        {/* Marketing Copy */}
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Premium hotel ordering platform
          </p>
          <h1 className="mt-5 text-5xl font-extrabold tracking-tight lg:text-6xl">
            Run service beautifully.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            BiteNow gives hotels and restaurants a polished command center for menus, orders, tables, staff, and guest dining experiences.
          </p>

          {/* Feature Signals */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            <LoginSignal icon={Utensils} label="Smart menus" />
            <LoginSignal icon={BellRing} label="Live orders" />
            <LoginSignal icon={ShieldCheck} label="Secure access" />
          </div>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} BiteNow. All rights reserved.
        </p>
      </section>

      {/* RIGHT SIDE - AUTHENTICATION */}
      <section className="auth-panel flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <Link className="mb-10 flex items-center gap-2.5 lg:hidden" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Utensils aria-hidden size={18} />
            </span>
            <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">BiteNow</span>
          </Link>

          {/* Form Header */}
          <div className="mb-8">
            <span className="auth-icon mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border">
              <ConciergeBell aria-hidden size={24} />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Welcome back
            </h2>
            <p className="auth-muted mt-2 text-sm">
              Sign in to manage orders, payments, staff, kitchen flow, and hotel operations.
            </p>
          </div>

          {/* Login Form */}
          <Suspense fallback={<p className="auth-muted text-sm">Loading sign in...</p>}>
            <LoginForm />
          </Suspense>

          {/* Secondary Action */}
          <div className="auth-secondary-action mt-8 rounded-xl border p-4 transition-colors">
            <Link
              className="group flex items-center justify-between text-sm font-semibold"
              href="/client/hotels"
            >
              Continue to guest ordering
              <ArrowRight aria-hidden size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function LoginSignal({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 transition-colors hover:bg-slate-800/50">
      <Icon aria-hidden size={20} className="text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-200">{label}</p>
    </div>
  );
}
