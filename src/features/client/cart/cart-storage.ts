"use client";

const CART_KEY = "bitenow_cart";

export type CartItem = {
  currency?: string;
  hotelId: string;
  imageUrl?: string;
  itemId: string;
  name: string;
  notes?: string;
  prepTimeMinutes?: number;
  price: string;
  quantity: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCartItems() {
  if (!isBrowser()) return [];

  try {
    const rawCart = window.localStorage.getItem(CART_KEY);
    if (!rawCart) return [];
    const parsed = JSON.parse(rawCart);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function getCartItemsForHotel(hotelId: string | null) {
  const items = getCartItems();
  if (!hotelId) return items;
  return items.filter((item) => item.hotelId === hotelId);
}

export function addCartItem(nextItem: CartItem) {
  const items = getCartItems();
  const existingIndex = items.findIndex(
    (item) =>
      item.hotelId === nextItem.hotelId &&
      item.itemId === nextItem.itemId &&
      (item.notes ?? "") === (nextItem.notes ?? "")
  );

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + nextItem.quantity
    };
  } else {
    items.push(nextItem);
  }

  saveCartItems(items);
  return items;
}

export function removeCartItem(index: number) {
  const items = getCartItems();
  if (index < 0 || index >= items.length) return items;

  items.splice(index, 1);
  saveCartItems(items);
  return items;
}

export function updateCartItemQuantity(index: number, quantity: number) {
  const items = getCartItems();
  const item = items[index];
  if (!item) return items;

  items[index] = {
    ...item,
    quantity: Math.max(1, quantity)
  };
  saveCartItems(items);
  return items;
}

export function updateCartItemNotes(index: number, notes: string) {
  const items = getCartItems();
  const item = items[index];
  if (!item) return items;

  items[index] = {
    ...item,
    notes: notes.trim() || undefined
  };
  saveCartItems(items);
  return items;
}

export function clearCart(hotelId?: string | null) {
  if (!hotelId) {
    saveCartItems([]);
    return [];
  }

  const items = getCartItems().filter((item) => item.hotelId !== hotelId);
  saveCartItems(items);
  return items;
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
}

function saveCartItems(items: CartItem[]) {
  if (!isBrowser()) return;

  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("bitenow_cart_updated"));
}
