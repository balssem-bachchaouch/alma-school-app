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

export default function SideNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav
      className="hidden md:flex flex-col w-60 min-h-screen flex-shrink-0"
      style={{
        background: "#ffffff",
        borderRight: "1px solid rgba(139,92,246,0.15)",
        boxShadow: "2px 0 20px rgba(124,58,237,0.1)",
      }}
    >
      <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            📚
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight" style={{ color: "#3b0764" }}>ALMA</p>
            <p className="text-xs" style={{ color: "#8b5cf6" }}>Mon École</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 py-4 flex-1">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
              style={
                active
                  ? { background: "rgba(124,58,237,0.1)", color: "#7c3aed" }
                  : { color: "#6b7280" }
              }
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="font-semibold text-sm">{label}</span>
              {active && (
                <div
                  className="ml-auto w-1.5 h-5 rounded-full"
                  style={{ background: "linear-gradient(180deg, #7c3aed, #ec4899)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
