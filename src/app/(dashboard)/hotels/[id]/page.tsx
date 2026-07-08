import { HotelDetailsPageClient } from "@/features/hotels/components/hotel-details-page-client";

type HotelDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HotelDetailsPage({ params }: HotelDetailsPageProps) {
  const { id } = await params;
  return <HotelDetailsPageClient hotelId={id} />;
}
