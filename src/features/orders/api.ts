import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  ListParams,
  Order,
  OrderItem,
  OrderItemPayload,
  OrderPayload,
  OrderStatusPayload,
  PaginatedResponse,
  UUID
} from "@/lib/api/types";

export function listOrders(params?: ListParams) {
  return apiRequest<PaginatedResponse<Order>>(apiEndpoints.orders, {
    hotelId: params?.hotel,
    params
  });
}

export function getOrder(id: UUID, hotelId?: UUID) {
  return apiRequest<Order>(`${apiEndpoints.orders}${id}/`, {
    hotelId
  });
}

export function createOrder(payload: OrderPayload) {
  return apiRequest<Order>(apiEndpoints.orders, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "POST"
  });
}

export function updateOrder(id: UUID, payload: Partial<OrderPayload>) {
  return apiRequest<Order>(`${apiEndpoints.orders}${id}/`, {
    body: JSON.stringify(payload),
    hotelId: payload.hotel,
    method: "PATCH"
  });
}

export function listOrderItems(params?: ListParams, hotelId?: UUID) {
  return apiRequest<PaginatedResponse<OrderItem>>(apiEndpoints.orderItems, {
    hotelId,
    params
  });
}

export function createOrderItem(payload: OrderItemPayload, hotelId?: UUID) {
  return apiRequest<OrderItem>(apiEndpoints.orderItems, {
    body: JSON.stringify(payload),
    hotelId,
    method: "POST"
  });
}

export function updateOrderItem(id: UUID, payload: Partial<OrderItemPayload>, hotelId?: UUID) {
  return apiRequest<OrderItem>(`${apiEndpoints.orderItems}${id}/`, {
    body: JSON.stringify(payload),
    hotelId,
    method: "PATCH"
  });
}

export function deleteOrderItem(id: UUID, hotelId?: UUID) {
  return apiRequest<void>(`${apiEndpoints.orderItems}${id}/`, {
    hotelId,
    method: "DELETE"
  });
}

export function updateOrderStatus(id: UUID, payload: OrderStatusPayload, hotelId?: UUID) {
  return apiRequest<Order>(`${apiEndpoints.orders}${id}/status/`, {
    body: JSON.stringify(payload),
    hotelId,
    method: "POST"
  });
}
