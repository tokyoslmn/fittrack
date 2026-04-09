"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const clientTabs = [
  { href: "/client", label: "Danas", icon: "📅" },
  { href: "/client/workout", label: "Trening", icon: "🏋️" },
  { href: "/client/nutrition", label: "Ishrana", icon: "🍽️" },
  { href: "/client/log/weight", label: "Težina", icon: "⚖️" },
  { href: "/client/progress", label: "Više", icon: "•••" },
];

const trainerTabs = [
  { href: "/trainer", label: "Klijenti", icon: "👥" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tabs = session?.user?.role === "TRAINER" ? trainerTabs : clientTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-background">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
            pathname === tab.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
