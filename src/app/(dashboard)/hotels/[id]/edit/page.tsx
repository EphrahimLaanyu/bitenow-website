import { HotelEditPageClient } from "@/features/hotels/components/hotel-edit-page-client";

type EditHotelPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditHotelPage({ params }: EditHotelPageProps) {
  const { id } = await params;
  return <HotelEditPageClient hotelId={id} />;
}
