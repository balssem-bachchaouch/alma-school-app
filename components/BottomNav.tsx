"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Calendar, GraduationCap, ListTodo } from "lucide-react";
import { useEffect, useState } from "react";

const tabs = [
  { href: "/", icon: Home, label: "Accueil" },
  { href: "/devoirs", icon: BookOpen, label: "Devoirs" },
  { href: "/planning", icon: Calendar, label: "Planning" },
  { href: "/taches", icon: ListTodo, label: "Tâches" },
  { href: "/cours", icon: GraduationCap, label: "Cours" },
];

function useTachesEnRetard() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/taches")
      .then(r => r.ok ? r.json() : [])
      .then((data: { statut: string; dueDate?: string }[]) => {
        setCount(data.filter(t => t.statut !== "Terminé" && t.dueDate && t.dueDate < today).length);
      })
      .catch(() => {});
  }, []);
  return count;
}

export default function BottomNav() {
  const pathname = usePathname();
  const tachesEnRetard = useTachesEnRetard();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#ffffff",
        borderTop: "1px solid rgba(124,58,237,0.2)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const badge = href === "/taches" && tachesEnRetard > 0 ? tachesEnRetard : 0;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all"
            >
              <div className="relative p-2 rounded-2xl transition-all" style={active ? { background: "#ede9fe" } : undefined}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} style={{ color: active ? "#7c3aed" : "#9ca3af" }} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ background: "#dc2626", fontSize: 9 }}>
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold" style={{ color: active ? "#7c3aed" : "#9ca3af" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
