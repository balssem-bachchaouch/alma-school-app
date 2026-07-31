"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, ShoppingBag } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devoirs", icon: BookOpen, label: "Devoirs" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/cartable", icon: ShoppingBag, label: "Cartable" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#120535",
        borderTop: "1px solid rgba(139,92,246,0.3)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all"
              style={{ opacity: active ? 1 : 0.45 }}
            >
              <div
                className="p-2 rounded-2xl transition-all"
                style={active ? { background: "rgba(139,92,246,0.2)" } : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#a78bfa" : "#6b7280" }}
                />
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: active ? "#a78bfa" : "#6b7280" }}
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
