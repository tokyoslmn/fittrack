import { requireAuth } from "@/lib/auth-utils";
import { FoodItemsTable } from "@/components/food/food-items-table";

export default async function NamirnicePage() {
  await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">🥘 Namirnice</h1>
      <p className="text-sm text-muted-foreground">
        Spisak namirnica sa makro vrednostima na 100g. Koristi se za kreiranje obroka.
      </p>
      <FoodItemsTable />
    </div>
  );
}
