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
      className="fixed z-50 md:hidden"
      style={{
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: 420,
      }}
    >
      <div
        className="flex items-center justify-around px-3 py-2.5 rounded-[28px]"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow:
            "0 8px 32px rgba(124,58,237,0.2), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.9)",
        }}
      >
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          const badge = href === "/taches" && tachesEnRetard > 0 ? tachesEnRetard : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <div
                className="relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))",
                      }
                    : {}
                }
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "#7c3aed" : "#9ca3af" }}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ background: "#dc2626", fontSize: 9 }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className="rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: active
                    ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                    : "transparent",
                  transition: "background 0.2s",
                }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
