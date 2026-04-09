import { requireRole } from "@/lib/auth-utils";

export default async function TrainerPage() {
  const session = await requireRole("TRAINER");

  return (
    <div>
      <h1 className="text-2xl font-bold">Zdravo, {session.user.name}!</h1>
      <p className="text-muted-foreground mt-2">Lista klijenata dolazi uskoro.</p>
    </div>
  );
}
