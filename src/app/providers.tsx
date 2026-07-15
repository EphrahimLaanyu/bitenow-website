"use client";

import { AuthProvider } from "@/lib/auth/auth-context";

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
