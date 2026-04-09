"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { name: "weight", label: "Težina (kg)", step: "0.1" },
  { name: "bodyFatPct", label: "Telesna mast (%)", step: "0.1" },
  { name: "fatMass", label: "Masna masa (kg)", step: "0.1" },
  { name: "muscleMass", label: "Mišićna masa (kg)", step: "0.1" },
  { name: "musclePct", label: "Mišićna masa (%)", step: "0.1" },
  { name: "skeletalMuscle", label: "Skeletna mišićna masa (kg)", step: "0.1" },
  { name: "bodyWater", label: "Voda u telu (%)", step: "0.1" },
  { name: "visceralFat", label: "Visceralna mast", step: "1" },
  { name: "bmr", label: "BMR (kcal)", step: "1" },
  { name: "bmi", label: "BMI", step: "0.1" },
  { name: "waistHip", label: "Struk/kuk odnos", step: "0.01" },
  { name: "heartRate", label: "Puls (bpm)", step: "1" },
] as const;

export function BodyCompForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, number | string | undefined> = {};

    for (const field of FIELDS) {
      const val = formData.get(field.name) as string;
      if (val) {
        data[field.name] = parseFloat(val);
      }
    }

    const note = formData.get("note") as string;
    if (note) data.note = note;

    const res = await fetch("/api/client/body-comp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              step={field.step}
              className="font-mono h-9"
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Napomena</Label>
        <Input id="note" name="note" placeholder="npr. Merenje kod nutricioniste" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
