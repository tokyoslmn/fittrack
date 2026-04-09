"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MealLogForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/client/meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealName: formData.get("mealName"),
        description: formData.get("description"),
        time: formData.get("time") || undefined,
        onPlan: formData.get("onPlan") === "on",
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="mealName">Obrok</Label>
        <Input id="mealName" name="mealName" placeholder="npr. Ručak" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Šta si jeo/la</Label>
        <Input
          id="description"
          name="description"
          placeholder="npr. 250g piletina + krompir + salata"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="time">Vreme (opciono)</Label>
        <Input id="time" name="time" type="time" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="onPlan" defaultChecked className="accent-primary" />
        Po planu
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
