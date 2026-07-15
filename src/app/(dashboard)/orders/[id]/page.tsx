import { OrderDetailsPageClient } from "@/features/orders/components/order-details-page-client";

type OrderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  return <OrderDetailsPageClient orderId={id} />;
}
