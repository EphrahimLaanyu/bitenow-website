import { ClientLayout } from "@/components/layout/client-layout";

export default function PublicClientLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}
