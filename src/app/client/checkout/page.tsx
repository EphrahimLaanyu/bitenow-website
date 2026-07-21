import { Suspense } from "react";
import { ClientCheckoutPageClient } from "@/features/client/checkout/client-checkout-page-client";

export default function ClientCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading checkout...</div>}>
      <ClientCheckoutPageClient />
    </Suspense>
  );
}
