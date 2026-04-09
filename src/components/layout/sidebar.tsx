"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const trainerLinks = [
  { href: "/trainer", label: "Klijenti", icon: "👥" },
];

const clientLinks = [
  { href: "/client", label: "Danas", icon: "📅" },
  { href: "/client/schedule", label: "Raspored", icon: "🗓️" },
  { href: "/client/workout", label: "Trening", icon: "🏋️" },
  { href: "/client/nutrition", label: "Ishrana", icon: "🍽️" },
  { href: "/client/log/weight", label: "Težina", icon: "⚖️" },
  { href: "/client/log/water", label: "Voda", icon: "💧" },
  { href: "/client/log/food", label: "Dnevnik", icon: "📝" },
  { href: "/client/log/supplements", label: "Suplementi", icon: "💊" },
  { href: "/client/log/body-comp", label: "Kompozicija", icon: "📊" },
  { href: "/client/lab-results", label: "Laboratorija", icon: "🔬" },
  { href: "/client/progress", label: "Napredak", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = session?.user?.role === "TRAINER" ? trainerLinks : clientLinks;

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-bold text-primary">
          FitTrack
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
