import { ClientHotelDetailsPageClient } from "@/features/client/hotels/client-hotel-details-page-client";

type ClientHotelDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientHotelDetailsPage({ params }: ClientHotelDetailsPageProps) {
  const { id } = await params;
  return <ClientHotelDetailsPageClient hotelId={id} />;
}
