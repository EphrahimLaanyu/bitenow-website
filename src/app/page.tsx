import { ClientHomePageClient } from "@/features/client/home/client-home-page-client";
import { ClientLayout } from "@/components/layout/client-layout";

export default function HomePage() {
  return (
    <ClientLayout>
      <ClientHomePageClient />
    </ClientLayout>
  );
}