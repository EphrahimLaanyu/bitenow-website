import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { ListParams, Notification, PaginatedResponse } from "@/lib/api/types";

export function listNotifications(params?: ListParams) {
  return apiRequest<PaginatedResponse<Notification>>(apiEndpoints.notifications, { params });
}
