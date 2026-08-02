"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, ShoppingBag, GraduationCap } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devoirs", icon: BookOpen, label: "Devoirs" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/cartable", icon: ShoppingBag, label: "Cartable" },
  { href: "/cours", icon: GraduationCap, label: "Cours" },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#ffffff",
        borderTop: "1px solid rgba(124,58,237,0.2)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all"
            >
              <div
                className="p-2 rounded-2xl transition-all"
                style={active ? { background: "#ede9fe" } : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#7c3aed" : "#9ca3af" }}
                />
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: active ? "#7c3aed" : "#9ca3af" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
