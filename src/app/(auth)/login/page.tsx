import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-[#1e3350] bg-[#0b1f3a]/90 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f97316]">
            Hotel OS
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-[#91a4bc]">
            Access ordering, payments, staff, and kitchen operations.
          </p>
        </div>

        <Suspense fallback={<p className="text-sm text-[#91a4bc]">Loading sign in...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
