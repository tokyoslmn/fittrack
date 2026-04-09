import { requireRole } from "@/lib/auth-utils";
import { getTrainerClients } from "@/lib/queries/trainer";
import { ClientCard } from "@/components/trainer/client-card";
import { AddClientForm } from "@/components/trainer/add-client-form";

export default async function TrainerPage() {
  const session = await requireRole("TRAINER");
  const clients = await getTrainerClients(session.user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moji klijenti</h1>
        <span className="text-sm text-muted-foreground">
          {clients.length} klijenata
        </span>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground">Nema dodanih klijenata.</p>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} {...client} />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted p-4">
        <h2 className="font-semibold mb-3">Dodaj klijenta</h2>
        <AddClientForm />
      </div>
    </div>
  );
}
