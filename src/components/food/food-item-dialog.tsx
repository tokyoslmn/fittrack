"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Meso",
  "Jaja i mlečni",
  "Ugljeni hidrati",
  "Masti i ulja",
  "Orašasti plodovi",
  "Voće",
  "Povrće",
  "Suplementi",
];

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

interface FoodItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoodItem | null;
  onSaved: () => void;
}

export function FoodItemDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: FoodItemDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [defaultGrams, setDefaultGrams] = useState("100");
  const [defaultPieces, setDefaultPieces] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [calories, setCalories] = useState("");
  const [measuredRaw, setMeasuredRaw] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setCategory(item.category ?? "");
        setDefaultGrams(String(item.defaultGrams));
        setDefaultPieces(item.defaultPieces != null ? String(item.defaultPieces) : "");
        setProtein(String(item.protein));
        setCarbs(String(item.carbs));
        setFat(String(item.fat));
        setCalories(String(item.calories));
        setMeasuredRaw(item.measuredRaw);
      } else {
        setName("");
        setCategory("");
        setDefaultGrams("100");
        setDefaultPieces("");
        setProtein("");
        setCarbs("");
        setFat("");
        setCalories("");
        setMeasuredRaw(true);
      }
      setError("");
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name,
      category: category || null,
      defaultGrams: parseFloat(defaultGrams) || 100,
      defaultPieces: defaultPieces ? parseFloat(defaultPieces) : null,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      calories: parseFloat(calories) || 0,
      measuredRaw,
    };

    try {
      const url = item ? `/api/food-items/${item.id}` : "/api/food-items";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška pri čuvanju");
        return;
      }

      onSaved();
      onOpenChange(false);
    } catch {
      setError("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Izmeni namirnicu" : "Nova namirnica"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fi-name">Naziv</Label>
            <Input
              id="fi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kategorija</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Izaberi kategoriju" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fi-grams">Podrazumevano (g)</Label>
              <Input
                id="fi-grams"
                type="number"
                step="any"
                min="0"
                value={defaultGrams}
                onChange={(e) => setDefaultGrams(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fi-pieces">Komada</Label>
              <Input
                id="fi-pieces"
                type="number"
                step="any"
                min="0"
                value={defaultPieces}
                onChange={(e) => setDefaultPieces(e.target.value)}
                placeholder="opciono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fi-protein">Proteini (g/100g)</Label>
              <Input
                id="fi-protein"
                type="number"
                step="any"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fi-carbs">Ugljeni h. (g/100g)</Label>
              <Input
                id="fi-carbs"
                type="number"
                step="any"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fi-fat">Masti (g/100g)</Label>
              <Input
                id="fi-fat"
                type="number"
                step="any"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fi-kcal">Kalorije (kcal/100g)</Label>
              <Input
                id="fi-kcal"
                type="number"
                step="any"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={measuredRaw}
              onChange={(e) => setMeasuredRaw(e.target.checked)}
              className="rounded border-input"
            />
            Mereno sirovo (pre obrade)
          </label>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Čuvanje..." : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
