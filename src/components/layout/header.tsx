"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="md:hidden text-lg font-bold text-primary">FitTrack</div>
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm text-muted-foreground">
          {session?.user?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Odjavi se
        </Button>
      </div>
    </header>
  );
}
