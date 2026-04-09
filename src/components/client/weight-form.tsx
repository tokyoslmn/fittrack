"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WeightForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const weight = parseFloat(formData.get("weight") as string);
    const note = formData.get("note") as string;

    const res = await fetch("/api/client/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, note: note || undefined }),
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
        <Label htmlFor="weight">Težina (kg)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          placeholder="npr. 104.5"
          required
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Napomena (opciono)</Label>
        <Input id="note" name="note" placeholder="npr. Ujutru, pre jela" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
