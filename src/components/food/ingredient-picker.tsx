"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  defaultGrams: number;
  measuredRaw: boolean;
}

export interface IngredientItem {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface IngredientPickerProps {
  items: IngredientItem[];
  onChange: (items: IngredientItem[]) => void;
}

function calcMacros(food: FoodItem, quantity: number) {
  const factor = quantity / 100;
  return {
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    calories: Math.round(food.calories * factor),
  };
}

export function IngredientPicker({ items, onChange }: IngredientPickerProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFood = useCallback(async (q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/food-items?${params}`);
    if (res.ok) setFoodItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => fetchFood(search), 200);
      return () => clearTimeout(timer);
    }
  }, [search, searchOpen, fetchFood]);

  function addIngredient(food: FoodItem) {
    const macros = calcMacros(food, food.defaultGrams);
    onChange([
      ...items,
      {
        foodItemId: food.id,
        foodItemName: food.name,
        quantity: food.defaultGrams,
        ...macros,
      },
    ]);
    setSearchOpen(false);
    setSearch("");
  }

  function updateQuantity(index: number, quantity: number) {
    // Re-scale macros proportionally from current values
    const item = items[index];
    const oldQty = item.quantity || 1;
    const factor = quantity / oldQty;
    onChange(
      items.map((it, i) =>
        i === index
          ? {
              ...it,
              quantity,
              protein: Math.round(it.protein * factor * 10) / 10,
              carbs: Math.round(it.carbs * factor * 10) / 10,
              fat: Math.round(it.fat * factor * 10) / 10,
              calories: Math.round(it.calories * factor),
            }
          : it
      )
    );
  }

  function removeIngredient(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const totals = items.reduce(
    (acc, it) => ({
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
      calories: acc.calories + it.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="flex-1 truncate text-foreground">{item.foodItemName}</span>
          <Input
            type="number"
            value={item.quantity || ""}
            onChange={(e) => updateQuantity(i, parseFloat(e.target.value) || 0)}
            className="w-16 h-7 font-mono text-xs"
          />
          <span className="text-muted-foreground w-4">g</span>
          <span className="font-mono text-muted-foreground w-24 text-right">
            P:{item.protein} C:{item.carbs} F:{item.fat}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => removeIngredient(i)}
          >
            ✕
          </Button>
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex gap-2 text-xs font-mono pt-1 border-t border-border">
          <span className="text-secondary">P:{Math.round(totals.protein)}g</span>
          <span className="text-warning">C:{Math.round(totals.carbs)}g</span>
          <span className="text-success">F:{Math.round(totals.fat)}g</span>
          <span className="text-muted-foreground">{totals.calories}kcal</span>
        </div>
      )}

      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger
          className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          + Namirnica
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <Input
            placeholder="Pretrazi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {loading ? (
              <div className="text-xs text-muted-foreground p-2">Ucitavanje...</div>
            ) : foodItems.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">Nema rezultata</div>
            ) : (
              foodItems.map((food) => (
                <button
                  key={food.id}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors"
                  onClick={() => addIngredient(food)}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-muted-foreground font-mono">
                    {food.defaultGrams}g — P:{food.protein} C:{food.carbs} F:{food.fat}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
