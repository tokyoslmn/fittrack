"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FoodItemDialog } from "./food-item-dialog";

interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  defaultGrams: number;
  defaultPieces: number | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  measuredRaw: boolean;
}

export function FoodItemsTable() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchItems = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/food-items${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems("");
  }, [fetchItems]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(value), 300);
  }

  function openCreate() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: FoodItem) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeleteError(null);
    const res = await fetch(`/api/food-items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || "Greška pri brisanju");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Group items by category
  const grouped = items.reduce<Record<string, FoodItem[]>>((acc, item) => {
    const cat = item.category || "Bez kategorije";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    a === "Bez kategorije" ? 1 : b === "Bez kategorije" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Pretraži namirnice..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        <Button onClick={openCreate} size="sm">
          + Nova namirnica
        </Button>
      </div>

      {deleteError && (
        <p className="text-sm text-destructive">{deleteError}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Učitavanje...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema rezultata.</p>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((cat) => (
            <div key={cat}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {cat}
              </h3>
              <div className="space-y-1">
                {grouped[cat].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openEdit(item)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                      <Badge variant={item.measuredRaw ? "secondary" : "outline"}>
                        {item.measuredRaw ? "sirovo" : "obrađeno"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {item.defaultGrams}g
                        {item.defaultPieces != null && ` / ${item.defaultPieces} kom`}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        P{item.protein} U{item.carbs} M{item.fat} | {item.calories}kcal
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-sm px-1"
                        title="Obriši"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FoodItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSaved={() => fetchItems(search)}
      />
    </div>
  );
}
