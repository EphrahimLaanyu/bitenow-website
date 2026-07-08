import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { ListParams, Order, PaginatedResponse } from "@/lib/api/types";

export function listOrders(params?: ListParams) {
  return apiRequest<PaginatedResponse<Order>>(apiEndpoints.orders, { params });
}
