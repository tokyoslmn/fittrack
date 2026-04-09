"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaterTrackerProps {
  totalMl: number;
  targetMl: number;
}

export function WaterTracker({ totalMl, targetMl }: WaterTrackerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  async function addWater(amountMl: number) {
    setLoading(true);
    await fetch("/api/client/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    setLoading(false);
    setCustomAmount("");
    router.refresh();
  }

  const percentage = Math.min((totalMl / targetMl) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold text-success">
          {(totalMl / 1000).toFixed(1)}L
        </div>
        <div className="text-sm text-muted-foreground">
          od {(targetMl / 1000).toFixed(1)}L cilja
        </div>
        <div className="mt-3 h-3 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={() => addWater(250)}
          disabled={loading}
        >
          +250 mL
        </Button>
        <Button
          variant="outline"
          onClick={() => addWater(500)}
          disabled={loading}
        >
          +500 mL
        </Button>
        <Button
          variant="outline"
          onClick={() => addWater(1000)}
          disabled={loading}
        >
          +1L
        </Button>
      </div>

      {/* Custom amount */}
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="mL"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="font-mono"
        />
        <Button
          onClick={() => {
            const val = parseInt(customAmount, 10);
            if (val > 0) addWater(val);
          }}
          disabled={loading || !customAmount}
        >
          Dodaj
        </Button>
      </div>
    </div>
  );
}
