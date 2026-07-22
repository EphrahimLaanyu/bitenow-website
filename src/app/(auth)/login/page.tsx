import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, ConciergeBell, ShieldCheck, Utensils } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      {/* LEFT SIDE - BRANDING & INFO (Hidden on mobile to focus on auth) */}
      <section className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
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
      <section className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <Link className="mb-10 flex items-center gap-2.5 lg:hidden" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Utensils aria-hidden size={18} />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">BiteNow</span>
          </Link>

          {/* Form Header */}
          <div className="mb-8">
            <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <ConciergeBell aria-hidden size={24} />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage orders, payments, staff, kitchen flow, and hotel operations.
            </p>
          </div>

          {/* Login Form */}
          <Suspense fallback={<p className="text-sm text-slate-500">Loading sign in...</p>}>
            <LoginForm />
          </Suspense>

          {/* Secondary Action */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
            <Link
              className="group flex items-center justify-between text-sm font-semibold text-slate-700"
              href="/client/hotels"
            >
              Continue to guest ordering
              <ArrowRight aria-hidden size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700" />
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