import { ClientNotificationDetailsPageClient } from "@/features/client/notifications/client-notification-details-page-client";

type ClientNotificationDetailsPageProps = {
  params: Promise<{
    notificationId: string;
  }>;
};

export default async function ClientNotificationDetailsPage({
  params
}: ClientNotificationDetailsPageProps) {
  const { notificationId } = await params;
  return <ClientNotificationDetailsPageClient notificationId={notificationId} />;
}
