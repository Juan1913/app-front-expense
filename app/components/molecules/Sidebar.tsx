import { useRef, useState } from "react";
import { NavItem } from "~/components/atoms";
import {
  Home, Edit3, CreditCard, RefreshCw, Gift, BarChart3, Settings, MessageCircle, Users,
  Target, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "~/store/authStore";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navigationItems: NavigationItem[] = [
  { icon: Home,          label: "Inicio",           href: "/" },
  { icon: Edit3,         label: "Categorías",       href: "/categorias" },
  { icon: CreditCard,    label: "Cuentas",          href: "/cuentas" },
  { icon: Target,        label: "Presupuestos",     href: "/presupuestos" },
  { icon: RefreshCw,     label: "Transacciones",    href: "/transacciones" },
  { icon: Gift,          label: "Lista de Deseos",  href: "/deseos" },
  { icon: BarChart3,     label: "Métricas",         href: "/metricas" },
  { icon: MessageCircle, label: "FinBot IA",        href: "/chat" },
  { icon: Trash2,        label: "Papelera",         href: "/papelera" },
];

const adminItems: NavigationItem[] = [
  { icon: Users, label: "Usuarios", href: "/admin/users" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [isHovered, setIsHovered] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const effectiveCollapsed = collapsed && !isHovered;

  function handleEnter() {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (collapsed) setIsHovered(true);
  }
  function handleLeave() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setIsHovered(false), 120);
  }

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`bg-secondary rounded-2xl flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out ${
        effectiveCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <nav className={`flex-1 ${effectiveCollapsed ? "px-2 py-4" : "p-4"}`}>
        <div className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              collapsed={effectiveCollapsed}
              isActive={location.pathname === item.href}
              onClick={() => navigate(item.href)}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6">
            {!effectiveCollapsed && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mb-2">
                Administración
              </p>
            )}
            {effectiveCollapsed && <div className="h-px bg-white/[0.06] mx-2 my-3" />}
            <div className="space-y-1.5">
              {adminItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={effectiveCollapsed}
                  isActive={location.pathname.startsWith(item.href)}
                  onClick={() => navigate(item.href)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer: Mi cuenta + toggle */}
      <div className={`border-t border-white/[0.06] ${effectiveCollapsed ? "px-2 py-3" : "p-4"} space-y-1.5`}>
        <NavItem
          icon={Settings}
          label="Mi cuenta"
          collapsed={effectiveCollapsed}
          onClick={() => navigate("/cuenta")}
        />

        <div className={effectiveCollapsed ? "flex justify-center" : "flex justify-end"}>
          <button
            onClick={onToggle}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="h-5 w-5" />
              : <ChevronLeft className="h-5 w-5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
