import { requireRole } from "@/lib/auth-utils";

export default async function ClientPage() {
  const session = await requireRole("CLIENT");

  return (
    <div>
      <h1 className="text-2xl font-bold">Zdravo, {session.user.name}!</h1>
      <p className="text-muted-foreground mt-2">Današnji raspored dolazi uskoro.</p>
    </div>
  );
}
