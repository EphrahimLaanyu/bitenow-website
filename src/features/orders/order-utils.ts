import type { Order, OrderStatus, OrderType } from "@/lib/api/types";

export const orderStatuses: Array<{ label: string; value: OrderStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Placed", value: "placed" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "in_preparation" },
  { label: "Ready", value: "ready" },
  { label: "Served", value: "served" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }
];

export const activeKitchenStatuses: OrderStatus[] = [
  "placed",
  "accepted",
  "in_preparation",
  "ready"
];

export const orderTypes: Array<{ label: string; value: OrderType }> = [
  { label: "Dine In", value: "dine_in" },
  { label: "Takeaway", value: "takeaway" },
  { label: "Delivery", value: "delivery" }
];

const statusFlow: OrderStatus[] = [
  "draft",
  "placed",
  "accepted",
  "in_preparation",
  "ready",
  "served",
  "completed"
];

export function getNextOrderStatus(status: OrderStatus) {
  const index = statusFlow.indexOf(status);
  return index >= 0 ? statusFlow[index + 1] : undefined;
}

export function formatOrderStatus(status: OrderStatus | string) {
  if (status === "in_preparation") return "Preparing";
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatOrderType(type: OrderType | string | undefined) {
  if (!type) return "Not set";
  return type.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export function getStatusClassName(status: OrderStatus | undefined) {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-50 text-emerald-700";
  if (status === "ready") return "border-lime-500/30 bg-lime-50 text-lime-700";
  if (status === "in_preparation") return "border-orange-500/30 bg-orange-50 text-orange-700";
  if (status === "accepted") return "border-sky-500/30 bg-sky-50 text-sky-700";
  if (status === "placed") return "border-[var(--primary)]/20 bg-[var(--surface-2)] text-[var(--primary)]";
  if (status === "cancelled") return "border-red-500/30 bg-red-50 text-red-700";
  return "border-slate-500/20 bg-slate-50 text-slate-700";
}

export function formatMoney(value: string | number | undefined, currency = "KES") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function sortOrders(orders: Order[]) {
  return [...orders].sort((first, second) => {
    const firstDate = new Date(first.created_at).getTime();
    const secondDate = new Date(second.created_at).getTime();
    return secondDate - firstDate;
  });
}

export function generateOrderNumber() {
  return `ORD-${Date.now().toString().slice(-8)}`;
}
