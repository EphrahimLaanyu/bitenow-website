import { ClientOrderDetailsPageClient } from "@/features/client/orders/client-order-details-page-client";

type ClientOrderDetailsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function ClientOrderDetailsPage({ params }: ClientOrderDetailsPageProps) {
  const { orderId } = await params;
  return <ClientOrderDetailsPageClient orderId={orderId} />;
}
