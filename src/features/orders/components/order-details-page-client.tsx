"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, History, Minus, Plus, ReceiptText, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { MenuItem, Order, OrderItem, OrderStatus, OrderType } from "@/lib/api/types";
import { listMenuItems } from "@/features/menu/api";
import {
  createOrderItem,
  deleteOrderItem,
  getOrder,
  listOrderItems,
  updateOrder,
  updateOrderItem,
  updateOrderStatus
} from "@/features/orders/api";
import {
  formatMoney,
  formatOrderStatus,
  formatOrderType,
  getNextOrderStatus,
  getStatusClassName,
  orderTypes
} from "@/features/orders/order-utils";

export function OrderDetailsPageClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemSaving, setItemSaving] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function loadOrder() {
    setError(null);
    setLoading(true);

    try {
      const loadedOrder = await getOrder(orderId, order?.hotel);
      setOrder(loadedOrder);
      setOrderItems(loadedOrder.items ?? []);
      await loadOrderItemContext(loadedOrder);
    } catch (orderError) {
      setError(getApiErrorMessage(orderError));
    } finally {
      setLoading(false);
    }
  }

  async function loadOrderItemContext(currentOrder: Order) {
    setItemError(null);

    try {
      const [menuResponse, itemResponse] = await Promise.all([
        listMenuItems({ hotel: currentOrder.hotel, page_size: 100 }),
        listOrderItems({ order: currentOrder.id, page_size: 100 }, currentOrder.hotel)
      ]);
      setMenuItems(menuResponse.results);
      setOrderItems(itemResponse.results);
    } catch (itemsError) {
      setMenuItems([]);
      setItemError(
        `${getApiErrorMessage(itemsError)}. The uploaded API spec does not document /api/v1/order-items/, so the backend may still need that route enabled.`
      );
    }
  }

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;

    setError(null);
    setSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const updated = await updateOrder(order.id, {
        customer_name: getOptionalString(formData.get("customer_name")),
        customer_phone: getOptionalString(formData.get("customer_phone")),
        hotel: order.hotel,
        notes: getOptionalString(formData.get("notes")),
        order_type: String(formData.get("order_type") || order.order_type || "dine_in") as OrderType,
        table: getNullableString(formData.get("table"))
      });
      setOrder(updated);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(status: OrderStatus) {
    if (!order) return;

    setError(null);
    setSaving(true);

    try {
      const updated = await updateOrderStatus(order.id, { status }, order.hotel);
      setOrder(updated);
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;

    setItemError(null);
    setItemSaving(true);

    const formData = new FormData(event.currentTarget);
    const menuItemId = String(formData.get("menu_item") ?? "");
    const menuItem = menuItems.find((item) => item.id === menuItemId);
    const quantity = getPositiveNumber(formData.get("quantity")) ?? 1;

    if (!menuItem) {
      setItemError("Choose a menu item before adding it to the order.");
      setItemSaving(false);
      return;
    }

    try {
      await createOrderItem(
        {
          menu_item: menuItem.id,
          notes: getOptionalString(formData.get("notes")),
          order: order.id,
          quantity,
          unit_price: menuItem.price
        },
        order.hotel
      );
      event.currentTarget.reset();
      await loadOrder();
    } catch (addError) {
      setItemError(getApiErrorMessage(addError));
    } finally {
      setItemSaving(false);
    }
  }

  async function handleQuantityChange(item: OrderItem, delta: number) {
    if (!order) return;
    const nextQuantity = Math.max(1, (item.quantity ?? 0) + delta);

    setItemError(null);
    setBusyItemId(item.id);

    try {
      await updateOrderItem(
        item.id,
        {
          menu_item: item.menu_item,
          order: order.id,
          quantity: nextQuantity,
          unit_price: item.unit_price
        },
        order.hotel
      );
      await loadOrder();
    } catch (quantityError) {
      setItemError(getApiErrorMessage(quantityError));
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemoveItem(item: OrderItem) {
    if (!order) return;
    const confirmed = window.confirm("Remove this item from the order?");
    if (!confirmed) return;

    setItemError(null);
    setBusyItemId(item.id);

    try {
      await deleteOrderItem(item.id, order.hotel);
      await loadOrder();
    } catch (removeError) {
      setItemError(getApiErrorMessage(removeError));
    } finally {
      setBusyItemId(null);
    }
  }

  const status = order?.status ?? "draft";
  const nextStatus = getNextOrderStatus(status);

  return (
    <div className="space-y-6">
      <div>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]" href="/orders">
          <ArrowLeft aria-hidden size={16} />
          Back to orders
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge>Order details</Badge>
            <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
              {order?.order_number ?? "Loading order"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={loading} onClick={loadOrder} type="button" variant="secondary">
              <RefreshCw aria-hidden size={18} />
              Refresh
            </Button>
            <Button disabled={saving || !nextStatus || !order} onClick={() => nextStatus && handleStatus(nextStatus)} type="button">
              {nextStatus ? `Mark ${formatOrderStatus(nextStatus)}` : "Completed"}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading && !order ? (
        <div className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" />
      ) : order ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Status</p>
              <Badge className={`mt-2 ${getStatusClassName(status)}`}>{formatOrderStatus(status)}</Badge>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Type</p>
              <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{formatOrderType(order.order_type)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Total</p>
              <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{formatMoney(order.total_amount)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Items</p>
              <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{orderItems.length}</p>
            </Card>
          </div>

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList aria-hidden className="text-[var(--accent)]" size={20} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Update order</h2>
            </div>
            <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleUpdate}>
              <Select defaultValue={order.order_type ?? "dine_in"} disabled={saving} label="Order type" name="order_type">
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <Input defaultValue={order.table ?? ""} disabled={saving} label="Table ID" name="table" placeholder="Table UUID or blank" />
              <Input defaultValue={order.customer_name ?? ""} disabled={saving} label="Customer name" name="customer_name" />
              <Input defaultValue={order.customer_phone ?? ""} disabled={saving} label="Customer phone" name="customer_phone" />
              <div className="lg:col-span-2">
                <Textarea defaultValue={order.notes ?? ""} disabled={saving} label="Notes" name="notes" />
              </div>
              <Button disabled={saving} type="submit">
                Save changes
              </Button>
            </form>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText aria-hidden className="text-[var(--accent)]" size={20} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Items and totals</h2>
            </div>

            {itemError ? (
              <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {itemError}
              </div>
            ) : null}

            <form className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_0.5fr_1fr_auto]" onSubmit={handleAddItem}>
              <Select disabled={itemSaving || menuItems.length === 0} label="Menu item" name="menu_item" required>
                <option value="">Select item</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {formatMoney(item.price)}
                  </option>
                ))}
              </Select>
              <Input defaultValue={1} disabled={itemSaving} label="Qty" min={1} name="quantity" type="number" />
              <Input disabled={itemSaving} label="Notes" name="notes" placeholder="No onions, extra sauce..." />
              <Button className="self-end" disabled={itemSaving || menuItems.length === 0} type="submit">
                <Plus aria-hidden size={16} />
                Add item
              </Button>
            </form>

            {orderItems.length ? (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <OrderItemRow
                    busy={busyItemId === item.id}
                    item={item}
                    key={item.id}
                    menuItem={menuItems.find((menuItem) => menuItem.id === item.menu_item)}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No items have been added to this order yet.
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <History aria-hidden className="text-[var(--accent)]" size={20} />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Status history</h2>
            </div>
            {order.status_history?.length ? (
              <div className="space-y-3">
                {order.status_history.map((entry) => (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" key={entry.id}>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {formatOrderStatus(entry.from_status)} to {formatOrderStatus(entry.to_status)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">No status history returned yet.</p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function OrderItemRow({
  busy,
  item,
  menuItem,
  onQuantityChange,
  onRemove
}: {
  busy: boolean;
  item: OrderItem;
  menuItem?: MenuItem;
  onQuantityChange: (item: OrderItem, delta: number) => void;
  onRemove: (item: OrderItem) => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{menuItem?.name ?? item.menu_item}</p>
        {item.notes ? <p className="mt-1 text-xs text-[var(--muted)]">{item.notes}</p> : null}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Price</p>
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatMoney(item.unit_price)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Total</p>
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatMoney(item.line_total)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={busy || (item.quantity ?? 1) <= 1} onClick={() => onQuantityChange(item, -1)} type="button" variant="secondary">
          <Minus aria-hidden size={16} />
        </Button>
        <span className="min-w-10 text-center text-sm font-bold text-[var(--foreground)]">{item.quantity ?? 0}</span>
        <Button disabled={busy} onClick={() => onQuantityChange(item, 1)} type="button" variant="secondary">
          <Plus aria-hidden size={16} />
        </Button>
        <Button disabled={busy} onClick={() => onRemove(item)} type="button" variant="ghost">
          <Trash2 aria-hidden size={16} />
          Remove
        </Button>
      </div>
    </div>
  );
}

function getOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || undefined;
}

function getNullableString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || null;
}

function getPositiveNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
