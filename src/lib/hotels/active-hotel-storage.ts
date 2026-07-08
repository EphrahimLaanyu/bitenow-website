"use client";

const ACTIVE_HOTEL_KEY = "hotel_active_hotel_id";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveActiveHotelId(hotelId: string) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACTIVE_HOTEL_KEY, hotelId);
}

export function getActiveHotelId() {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(ACTIVE_HOTEL_KEY);
}

export function clearActiveHotelId() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ACTIVE_HOTEL_KEY);
}
