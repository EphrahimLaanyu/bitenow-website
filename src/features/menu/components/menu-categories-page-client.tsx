"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Layers3, Pencil, Plus, RefreshCw, Trash2, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import type { Hotel, MenuCategory, MenuItem } from "@/lib/api/types";
import { listHotels } from "@/features/hotels/api";
import {
  createMenuItem,
  createMenuCategory,
  deleteMenuItem,
  deleteMenuCategory,
  listMenuItems,
  listMenuCategories,
  updateMenuItem,
  updateMenuCategory
} from "@/features/menu/api";

const presets = ["Breakfast", "Lunch", "Dinner", "Drinks", "Desserts"];

export function MenuCategoriesPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const hotelsResponse = await listHotels({ page_size: 100 });
      const hotelResults = hotelsResponse.results;
      const activeHotelId = chooseActiveHotelId(hotelResults, selectedHotelId || getActiveHotelId());

      setHotels(hotelResults);
      setSelectedHotelId(activeHotelId);

      if (!activeHotelId) {
        setCategories([]);
        setItems([]);
        return;
      }

      saveActiveHotelId(activeHotelId);

      const [categoriesResponse, itemsResponse] = await Promise.all([
        listMenuCategories({
          hotel: activeHotelId,
          page_size: 100
        }),
        listMenuItems({
          hotel: activeHotelId,
          page_size: 100
        })
      ]);

      setCategories(sortCategories(categoriesResponse.results));
      setItems(sortItems(itemsResponse.results));
    } catch (menuError) {
      setError(getApiErrorMessage(menuError));
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    setError(null);
    setLoading(true);

    try {
      const [categoriesResponse, itemsResponse] = await Promise.all([
        listMenuCategories({
          hotel: hotelId,
          page_size: 100
        }),
        listMenuItems({
          hotel: hotelId,
          page_size: 100
        })
      ]);
      setCategories(sortCategories(categoriesResponse.results));
      setItems(sortItems(itemsResponse.results));
    } catch (menuError) {
      setError(getApiErrorMessage(menuError));
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const hotelById = useMemo(
    () => new Map(hotels.map((hotel) => [hotel.id, hotel])),
    [hotels]
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaving(true);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder = Number(formData.get("sort_order") ?? 0);

    try {
      await createMenuCategory({
        hotel: String(formData.get("hotel") || selectedHotelId),
        is_active: formData.get("is_active") === "on",
        name,
        slug: String(formData.get("slug") || slugify(name)),
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0
      });
      form.reset();
      await loadCategories();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function handlePreset(name: string) {
    const activeHotelId = selectedHotelId || hotels[0]?.id;
    if (!activeHotelId) return;

    setError(null);
    setSaving(true);

    try {
      await createMenuCategory({
        hotel: activeHotelId,
        is_active: true,
        name,
        slug: slugify(name),
        sort_order: presets.indexOf(name) + 1
      });
      await loadCategories();
    } catch (presetError) {
      setError(getApiErrorMessage(presetError));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, category: MenuCategory) {
    event.preventDefault();
    setError(null);
    setBusyId(category.id);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder = Number(formData.get("sort_order") ?? 0);

    try {
      const updated = await updateMenuCategory(category.id, {
        hotel: String(formData.get("hotel") ?? category.hotel),
        is_active: formData.get("is_active") === "on",
        name,
        slug: String(formData.get("slug") || slugify(name)),
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0
      });
      setCategories((current) => sortCategories(current.map((item) => (item.id === category.id ? updated : item))));
      setEditingId(null);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(category: MenuCategory) {
    const confirmed = window.confirm(`Delete ${category.name}?`);
    if (!confirmed) return;

    setError(null);
    setBusyId(category.id);

    try {
      await deleteMenuCategory(category.id, category.hotel);
      setCategories((current) => current.filter((item) => item.id !== category.id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaving(true);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const activeHotelId = String(formData.get("hotel") || selectedHotelId);

    try {
      await createMenuItem({
        category: getNullableString(formData, "category"),
        description: getOptionalString(formData, "description"),
        hotel: activeHotelId,
        image_url: getOptionalString(formData, "image_url"),
        is_available: formData.get("is_available") === "on",
        name,
        prep_time_minutes: getOptionalNumber(formData, "prep_time_minutes"),
        price: getOptionalString(formData, "price"),
        sku: String(formData.get("sku") || slugify(name)).trim(),
        slug: String(formData.get("slug") || slugify(name)).trim()
      });
      form.reset();
      await loadCategories();
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateItem(event: FormEvent<HTMLFormElement>, item: MenuItem) {
    event.preventDefault();
    setError(null);
    setBusyId(item.id);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    try {
      const updated = await updateMenuItem(item.id, {
        category: getNullableString(formData, "category"),
        description: getOptionalString(formData, "description"),
        hotel: String(formData.get("hotel") || item.hotel),
        image_url: getOptionalString(formData, "image_url"),
        is_available: formData.get("is_available") === "on",
        name,
        prep_time_minutes: getOptionalNumber(formData, "prep_time_minutes"),
        price: getOptionalString(formData, "price"),
        sku: String(formData.get("sku") || item.sku || slugify(name)).trim(),
        slug: String(formData.get("slug") || item.slug || slugify(name)).trim()
      });
      setItems((current) => sortItems(current.map((currentItem) => (currentItem.id === item.id ? updated : currentItem))));
      setEditingItemId(null);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    const confirmed = window.confirm(`Delete ${item.name}?`);
    if (!confirmed) return;

    setError(null);
    setBusyId(item.id);

    try {
      await deleteMenuItem(item.id, item.hotel);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge>Menu categories</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Categories</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Create the groups that menu items will live under: breakfast, lunch, dinner, drinks,
            desserts, and any custom hotel sections.
          </p>
        </div>
        <Button disabled={loading} onClick={loadCategories} type="button" variant="secondary">
          <RefreshCw aria-hidden size={18} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <Card>
        <div className="mb-5 max-w-xl">
          <Select
            disabled={loading || hotels.length === 0}
            label="Active hotel context"
            name="active_hotel"
            onChange={(event) => handleHotelChange(event.target.value)}
            value={selectedHotelId}
          >
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <Plus aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create category</h2>
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_0.6fr_0.7fr_auto]" onSubmit={handleCreate}>
          <Select
            defaultValue={selectedHotelId}
            disabled={saving || hotels.length === 0}
            label="Hotel"
            name="hotel"
            required
          >
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
          <Input disabled={saving} label="Name" name="name" placeholder="Breakfast" required />
          <Input disabled={saving} label="Slug" name="slug" placeholder="breakfast" />
          <Input defaultValue="0" disabled={saving} label="Sort" min={0} name="sort_order" type="number" />
          <div className="self-end">
            <Checkbox defaultChecked disabled={saving} label="Active" name="is_active" />
          </div>
          <Button className="self-end" disabled={saving || hotels.length === 0} type="submit">
            Add
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              disabled={saving || !selectedHotelId}
              key={preset}
              onClick={() => handlePreset(preset)}
              type="button"
              variant="secondary"
            >
              {preset}
            </Button>
          ))}
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers3 aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Category list</h2>
          <Badge>{categories.length}</Badge>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" key={index} />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid gap-3">
            {categories.map((category) =>
              editingId === category.id ? (
                <CategoryEditRow
                  busy={busyId === category.id}
                  category={category}
                  hotels={hotels}
                  key={category.id}
                  onCancel={() => setEditingId(null)}
                  onSubmit={handleUpdate}
                />
              ) : (
                <CategoryDisplayRow
                  busy={busyId === category.id}
                  category={category}
                  hotel={hotelById.get(category.hotel)}
                  key={category.id}
                  onDelete={handleDelete}
                  onEdit={() => setEditingId(category.id)}
                />
              )
            )}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">No menu categories were returned by the API.</p>
          </Card>
        )}
      </section>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Utensils aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create menu item</h2>
        </div>

        <form className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr]" onSubmit={handleCreateItem}>
          <Select
            defaultValue={selectedHotelId}
            disabled={saving || hotels.length === 0}
            label="Hotel"
            name="hotel"
            required
          >
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
          <Select disabled={saving} label="Category" name="category">
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Input disabled={saving} label="Name" name="name" placeholder="Chicken sandwich" required />
          <Input disabled={saving} label="Price" min="0" name="price" placeholder="450.00" step="0.01" type="number" />
          <Input disabled={saving} label="Prep time" min="0" name="prep_time_minutes" placeholder="15" type="number" />
          <Input disabled={saving} label="SKU" name="sku" placeholder="chicken-sandwich" />
          <Input disabled={saving} label="Slug" name="slug" placeholder="chicken-sandwich" />
          <Input className="xl:col-span-2" disabled={saving} label="Image URL" name="image_url" placeholder="https://..." type="url" />
          <Input className="xl:col-span-4" disabled={saving} label="Description" name="description" placeholder="Short item description" />
          <div className="self-end">
            <Checkbox defaultChecked disabled={saving} label="Available" name="is_available" />
          </div>
          <Button className="self-end" disabled={saving || !selectedHotelId} type="submit">
            Add item
          </Button>
        </form>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Utensils aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Restaurant catalogue</h2>
          <Badge>{items.length}</Badge>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-72 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" key={index} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) =>
              editingItemId === item.id ? (
                <MenuItemEditCard
                  busy={busyId === item.id}
                  categories={categories}
                  hotels={hotels}
                  item={item}
                  key={item.id}
                  onCancel={() => setEditingItemId(null)}
                  onSubmit={handleUpdateItem}
                />
              ) : (
                <MenuItemCard
                  busy={busyId === item.id}
                  category={item.category ? categoryById.get(item.category) : undefined}
                  item={item}
                  key={item.id}
                  onDelete={handleDeleteItem}
                  onEdit={() => setEditingItemId(item.id)}
                />
              )
            )}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">No menu items were returned by the API.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function CategoryDisplayRow({
  busy,
  category,
  hotel,
  onDelete,
  onEdit
}: {
  busy: boolean;
  category: MenuCategory;
  hotel?: Hotel;
  onDelete: (category: MenuCategory) => void;
  onEdit: () => void;
}) {
  return (
    <Card className="grid gap-4 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] lg:items-center">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Category</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{category.name}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Hotel</p>
        <p className="mt-2 truncate text-sm text-[var(--foreground)]">{hotel?.name ?? category.hotel}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Slug</p>
        <p className="mt-2 truncate text-sm text-[var(--foreground)]">{category.slug}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge>{category.is_active === false ? "Inactive" : "Active"}</Badge>
        <span className="text-sm text-[var(--muted)]">Sort {category.sort_order ?? 0}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={onEdit} type="button" variant="secondary">
          <Pencil aria-hidden size={18} />
          Edit
        </Button>
        <Button disabled={busy} onClick={() => onDelete(category)} type="button" variant="ghost">
          <Trash2 aria-hidden size={18} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function CategoryEditRow({
  busy,
  category,
  hotels,
  onCancel,
  onSubmit
}: {
  busy: boolean;
  category: MenuCategory;
  hotels: Hotel[];
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, category: MenuCategory) => void;
}) {
  return (
    <Card>
      <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_0.6fr_0.7fr_auto]" onSubmit={(event) => onSubmit(event, category)}>
        <Select defaultValue={category.hotel} disabled={busy} label="Hotel" name="hotel" required>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
        <Input defaultValue={category.name} disabled={busy} label="Name" name="name" required />
        <Input defaultValue={category.slug} disabled={busy} label="Slug" name="slug" required />
        <Input defaultValue={category.sort_order ?? 0} disabled={busy} label="Sort" min={0} name="sort_order" type="number" />
        <div className="self-end">
          <Checkbox defaultChecked={category.is_active !== false} disabled={busy} label="Active" name="is_active" />
        </div>
        <div className="flex gap-2 self-end">
          <Button disabled={busy} type="submit">
            Save
          </Button>
          <Button disabled={busy} onClick={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MenuItemCard({
  busy,
  category,
  item,
  onDelete,
  onEdit
}: {
  busy: boolean;
  category?: MenuCategory;
  item: MenuItem;
  onDelete: (item: MenuItem) => void;
  onEdit: () => void;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {category?.name ?? "Uncategorised"}
          </p>
          <h3 className="mt-2 truncate text-xl font-bold text-[var(--foreground)]">{item.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{item.sku}</p>
        </div>
        <Badge className={item.is_available === false ? "border-[var(--border)] bg-[var(--surface-3)] text-[var(--muted)]" : undefined}>
          {item.is_available === false ? "Unavailable" : "Available"}
        </Badge>
      </div>

      {item.image_url ? (
        <div
          aria-label={item.name}
          className="h-36 rounded-md border border-[var(--border)] bg-[var(--surface)] bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${item.image_url}")` }}
        />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
          <ImageIcon aria-hidden size={28} />
        </div>
      )}

      <p className="min-h-10 text-sm text-[var(--muted)]">{item.description || "No description set."}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <ItemMetric label="Price" value={item.price ? formatMoney(item.price) : "Not set"} />
        <ItemMetric label="Prep" value={`${item.prep_time_minutes ?? 0} min`} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <Button disabled={busy} onClick={onEdit} type="button" variant="secondary">
          <Pencil aria-hidden size={18} />
          Edit
        </Button>
        <Button disabled={busy} onClick={() => onDelete(item)} type="button" variant="ghost">
          <Trash2 aria-hidden size={18} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function MenuItemEditCard({
  busy,
  categories,
  hotels,
  item,
  onCancel,
  onSubmit
}: {
  busy: boolean;
  categories: MenuCategory[];
  hotels: Hotel[];
  item: MenuItem;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: MenuItem) => void;
}) {
  return (
    <Card className="md:col-span-2 xl:col-span-3">
      <form className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr]" onSubmit={(event) => onSubmit(event, item)}>
        <Select defaultValue={item.hotel} disabled={busy} label="Hotel" name="hotel" required>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
        <Select defaultValue={item.category ?? ""} disabled={busy} label="Category" name="category">
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input defaultValue={item.name} disabled={busy} label="Name" name="name" required />
        <Input defaultValue={item.price ?? ""} disabled={busy} label="Price" min="0" name="price" step="0.01" type="number" />
        <Input defaultValue={item.prep_time_minutes ?? 0} disabled={busy} label="Prep time" min="0" name="prep_time_minutes" type="number" />
        <Input defaultValue={item.sku ?? ""} disabled={busy} label="SKU" name="sku" required />
        <Input defaultValue={item.slug} disabled={busy} label="Slug" name="slug" required />
        <Input className="xl:col-span-2" defaultValue={item.image_url ?? ""} disabled={busy} label="Image URL" name="image_url" type="url" />
        <Input className="xl:col-span-4" defaultValue={item.description ?? ""} disabled={busy} label="Description" name="description" />
        <div className="self-end">
          <Checkbox defaultChecked={item.is_available !== false} disabled={busy} label="Available" name="is_available" />
        </div>
        <div className="flex gap-2 self-end">
          <Button disabled={busy} type="submit">
            Save
          </Button>
          <Button disabled={busy} onClick={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ItemMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 truncate font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function getNullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function formatMoney(value: string) {
  return Number(value).toLocaleString("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sortItems(menuItems: MenuItem[]) {
  return [...menuItems].sort((first, second) => first.name.localeCompare(second.name));
}

function chooseActiveHotelId(hotels: Hotel[], preferredHotelId: string | null) {
  if (preferredHotelId && hotels.some((hotel) => hotel.id === preferredHotelId)) {
    return preferredHotelId;
  }

  return hotels.find((hotel) => hotel.is_active)?.id ?? hotels[0]?.id ?? "";
}

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort((first, second) => {
    const firstOrder = first.sort_order ?? 0;
    const secondOrder = second.sort_order ?? 0;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return first.name.localeCompare(second.name);
  });
}
