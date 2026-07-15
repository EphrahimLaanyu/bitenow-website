"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, ImageIcon, Search, ShoppingCart, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, MenuCategory, MenuItem } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { addCartItem } from "@/features/client/cart/cart-storage";
import { getHotel } from "@/features/hotels/api";
import { listMenuCategories, listMenuItems } from "@/features/menu/api";

export function ClientHotelMenuPageClient({ hotelId }: { hotelId: string }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMenu() {
    setError(null);
    setLoading(true);

    try {
      if (!getAccessToken()) {
        throw new Error(
          "The backend currently requires sign-in before it returns menus. Please sign in to browse this hotel menu until public menu endpoints are enabled."
        );
      }

      saveActiveHotelId(hotelId);
      const [hotelResponse, categoriesResponse, itemsResponse] = await Promise.all([
        getHotel(hotelId),
        listMenuCategories({ hotel: hotelId, page_size: 100 }),
        listMenuItems({ hotel: hotelId, page_size: 100 })
      ]);

      setHotel(hotelResponse);
      setCategories(sortCategories(categoriesResponse.results.filter((category) => category.is_active !== false)));
      setItems(sortItems(itemsResponse.results));
    } catch (menuError) {
      setError(getApiErrorMessage(menuError));
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = submittedSearch.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory = activeCategoryId === "all" || item.category === activeCategoryId;
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description, item.sku]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryId, items, submittedSearch]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  function handleAddToCart(item: MenuItem) {
    addCartItem({
      currency: hotel?.currency,
      hotelId,
      imageUrl: item.image_url,
      itemId: item.id,
      name: item.name,
      prepTimeMinutes: item.prep_time_minutes,
      price: item.price,
      quantity: 1
    });
    setAddedItemId(item.id);
    window.setTimeout(() => setAddedItemId(null), 1500);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-100">{error}</p>
        {error.includes("requires sign-in") ? (
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
            href={`/login?next=${encodeURIComponent(`/client/hotels/${hotelId}/menu`)}`}
          >
            Sign in to browse menu
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]" href={`/client/hotels/${hotelId}`}>
        <ArrowLeft aria-hidden size={16} />
        Back to hotel
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Badge>Hotel menu</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            {hotel?.name ? `${hotel.name} Menu` : "Menu"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Browse available meals by category, price, preparation time, and availability.
          </p>
        </div>

        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <Input
            label="Search menu"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Burger, fries, drinks..."
            value={search}
          />
          <Button className="self-end" type="submit" variant="secondary">
            <Search aria-hidden size={18} />
            Search
          </Button>
        </form>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryTab
          active={activeCategoryId === "all"}
          count={items.length}
          label="All"
          onClick={() => setActiveCategoryId("all")}
        />
        {categories.map((category) => (
          <CategoryTab
            active={activeCategoryId === category.id}
            count={items.filter((item) => item.category === category.id).length}
            key={category.id}
            label={category.name}
            onClick={() => setActiveCategoryId(category.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Utensils aria-hidden className="text-[var(--accent)]" size={20} />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Menu items</h2>
        <Badge>{filteredItems.length}</Badge>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <MenuItemCard
              added={addedItemId === item.id}
              category={item.category ? categoryById.get(item.category) : undefined}
              currency={hotel?.currency}
              item={item}
              key={item.id}
              onAdd={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">No menu items matched this filter.</p>
        </Card>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  count,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
        active
          ? "border-[var(--accent)]/50 bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-2)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={active ? "text-[var(--accent-foreground)]/70" : "text-[var(--muted)]"}>{count}</span>
    </button>
  );
}

function MenuItemCard({
  added,
  category,
  currency,
  item,
  onAdd
}: {
  added: boolean;
  category?: MenuCategory;
  currency?: string;
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      {item.image_url ? (
        <div
          aria-label={item.name}
          className="h-44 bg-[var(--surface-2)] bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${item.image_url}")` }}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[var(--surface-2)] text-[var(--muted)]">
          <ImageIcon aria-hidden size={36} />
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[var(--foreground)]">{item.name}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {category?.name ?? "Uncategorized"}
            </p>
          </div>
          <Badge className={item.is_available === false ? "border-red-500/30 bg-red-500/10 text-red-100" : undefined}>
            {item.is_available === false ? "Unavailable" : "Available"}
          </Badge>
        </div>

        <p className="line-clamp-3 min-h-16 text-sm leading-6 text-[var(--muted)]">
          {item.description || "No description listed yet."}
        </p>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-[var(--foreground)]">{formatMoney(item.price, currency)}</p>
          <p className="inline-flex items-center gap-1 text-sm text-[var(--muted)]">
            <Clock aria-hidden size={16} />
            {item.prep_time_minutes ?? 0} min
          </p>
        </div>

        <Button
          className="w-full"
          disabled={item.is_available === false}
          onClick={() => onAdd(item)}
          type="button"
          variant={added ? "secondary" : "primary"}
        >
          {added ? <Check aria-hidden size={17} /> : <ShoppingCart aria-hidden size={17} />}
          {added ? "Added" : "Add item"}
        </Button>
      </div>
    </Card>
  );
}

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort((first, second) => {
    const firstOrder = first.sort_order ?? 0;
    const secondOrder = second.sort_order ?? 0;
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return first.name.localeCompare(second.name);
  });
}

function sortItems(items: MenuItem[]) {
  return [...items].sort((first, second) => first.name.localeCompare(second.name));
}

function formatMoney(value: string | number | undefined, currency = "KES") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}
