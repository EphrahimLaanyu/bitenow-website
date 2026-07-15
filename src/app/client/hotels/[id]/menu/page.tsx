import { ClientHotelMenuPageClient } from "@/features/client/menu/client-hotel-menu-page-client";

type ClientHotelMenuPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientHotelMenuPage({ params }: ClientHotelMenuPageProps) {
  const { id } = await params;
  return <ClientHotelMenuPageClient hotelId={id} />;
}
