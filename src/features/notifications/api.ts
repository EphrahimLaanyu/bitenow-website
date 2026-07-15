import { ApiError, apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { ListParams, Notification, PaginatedResponse, UUID } from "@/lib/api/types";

export function listNotifications(params?: ListParams) {
  return apiRequest<PaginatedResponse<Notification>>(apiEndpoints.notifications, {
    hotelId: params?.hotel,
    params
  });
}

export function getNotification(id: UUID, hotelId?: UUID) {
  return apiRequest<Notification>(`${apiEndpoints.notifications}${id}/`, {
    hotelId
  });
}

export async function markNotificationRead(id: UUID, hotelId?: UUID) {
  try {
    return await apiRequest<Notification>(`${apiEndpoints.notifications}${id}/read/`, {
      body: JSON.stringify({}),
      hotelId,
      method: "PATCH"
    });
  } catch (error) {
    if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
      throw error;
    }
  }

  return apiRequest<Notification>(`${apiEndpoints.notifications}${id}/`, {
    body: JSON.stringify({ is_read: true }),
    hotelId,
    method: "PATCH"
  });
}
