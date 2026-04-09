"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        onClick={() => router.push("/client/log/water")}
      >
        + Voda
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => router.push("/client/log/food")}
      >
        + Obrok
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => router.push("/client/log/weight")}
      >
        + Težina
      </Button>
    </div>
  );
}
