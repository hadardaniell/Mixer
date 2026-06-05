import { storage, StorageKeys } from '@/shared/config/storage';

const MAX_ITEMS = 300;

type Listener = () => void;
const listeners = new Set<Listener>();

export interface ShoppingListItem {
  /** Stable id so re-adding the same ingredient merges instead of duplicating. */
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  recipeId?: string;
  recipeName?: string;
  checked: boolean;
  addedAt: number;
}

/** Input shape for {@link addToShoppingList} — id/checked/addedAt are derived. */
export interface ShoppingListInput {
  name: string;
  amount?: number;
  unit?: string;
  recipeId?: string;
  recipeName?: string;
}

function itemId(input: ShoppingListInput): string {
  return [input.recipeId ?? 'manual', input.name, input.unit ?? ''].join('::');
}

function load(): ShoppingListItem[] {
  const raw = storage.getString(StorageKeys.shoppingList);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ShoppingListItem =>
        !!e &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.name === 'string' &&
        typeof e.checked === 'boolean' &&
        typeof e.addedAt === 'number',
    );
  } catch {
    return [];
  }
}

function save(items: ShoppingListItem[]): void {
  storage.set(StorageKeys.shoppingList, JSON.stringify(items.slice(0, MAX_ITEMS)));
  for (const l of listeners) l();
}

/** Read the full list, newest-first. */
export function getShoppingList(): ShoppingListItem[] {
  return load();
}

/**
 * Add ingredients to the shopping list. Existing entries (same recipe + name +
 * unit) merge: numeric amounts are summed, and the item is moved to the top.
 * Returns the number of items added or updated.
 */
export function addToShoppingList(inputs: ShoppingListInput[]): number {
  if (inputs.length === 0) return 0;
  const now = Date.now();
  const byId = new Map(load().map((item) => [item.id, item]));

  for (const input of inputs) {
    const id = itemId(input);
    const existing = byId.get(id);
    if (existing) {
      const amount =
        existing.amount != null && input.amount != null
          ? existing.amount + input.amount
          : (input.amount ?? existing.amount);
      byId.set(id, { ...existing, amount, checked: false, addedAt: now });
    } else {
      byId.set(id, { ...input, id, checked: false, addedAt: now });
    }
  }

  const merged = Array.from(byId.values()).sort((a, b) => b.addedAt - a.addedAt);
  save(merged);
  return inputs.length;
}

export function toggleShoppingItem(id: string): void {
  save(load().map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
}

export function removeShoppingItem(id: string): void {
  save(load().filter((item) => item.id !== id));
}

export function clearShoppingList(): void {
  storage.delete(StorageKeys.shoppingList);
  for (const l of listeners) l();
}

export function subscribeShoppingList(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
