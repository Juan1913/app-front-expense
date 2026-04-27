import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavItem } from "~/components/atoms";
import {
  Home, Edit3, CreditCard, RefreshCw, Gift, BarChart3, Settings, MessageCircle, Users,
  Target, Trash2, ChevronLeft, ChevronRight, ChevronDown, FlaskConical, Sparkles, Coins, X, Zap, FileText,
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
  { icon: FlaskConical,  label: "Análisis",         href: "/analisis" },
  { icon: Sparkles,      label: "Simulador",        href: "/simulador" },
  { icon: Coins,         label: "Deudas",           href: "/deudas" },
  { icon: MessageCircle, label: "FinBot IA",        href: "/chat" },
  { icon: FileText,      label: "Documentos",       href: "/documentos" },
  { icon: Trash2,        label: "Papelera",         href: "/papelera" },
];

const adminItems: NavigationItem[] = [
  { icon: Users, label: "Usuarios", href: "/admin/users" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [isHovered, setIsHovered] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const effectiveCollapsed = collapsed && !isHovered;

  // Detección de overflow vertical en el nav del sidebar (escritorio)
  const navRef = useRef<HTMLElement | null>(null);
  const [scrollState, setScrollState] = useState({ overflow: false, atBottom: false });

  function recomputeScroll() {
    const el = navRef.current;
    if (!el) return;
    const overflow = el.scrollHeight > el.clientHeight + 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setScrollState((prev) =>
      prev.overflow === overflow && prev.atBottom === atBottom ? prev : { overflow, atBottom }
    );
  }

  useLayoutEffect(() => {
    recomputeScroll();
  }, [effectiveCollapsed, isAdmin]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recomputeScroll);
    ro.observe(el);
    window.addEventListener("resize", recomputeScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recomputeScroll);
    };
  }, []);

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

  // Bloquea el scroll del body mientras el drawer móvil está abierto
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  function handleMobileNavigate(href: string) {
    navigate(href);
    onMobileClose?.();
  }

  return (
    <>
      {/* ── Sidebar escritorio (md+) ── */}
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={`hidden md:flex bg-secondary rounded-2xl flex-col flex-shrink-0 min-h-0 relative transition-[width] duration-300 ease-in-out ${
          effectiveCollapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <nav
          ref={navRef}
          onScroll={recomputeScroll}
          className={`flex-1 min-h-0 overflow-y-auto no-scrollbar relative ${effectiveCollapsed ? "px-2 py-3" : "p-3"}`}
        >
          <div className="space-y-1">
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
            <div className="mt-4">
              {!effectiveCollapsed && (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mb-1.5">
                  Administración
                </p>
              )}
              {effectiveCollapsed && <div className="h-px bg-white/[0.06] mx-2 my-2" />}
              <div className="space-y-1">
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

          {/* Indicador de "hay más abajo" — sticky en el fondo del nav */}
          {scrollState.overflow && !scrollState.atBottom && (
            <div
              className={`sticky bottom-0 flex justify-center pointer-events-none bg-gradient-to-t from-secondary via-secondary/95 to-transparent pt-6 pb-1 ${
                effectiveCollapsed ? "-mx-2 -mb-3" : "-mx-3 -mb-3"
              }`}
            >
              <button
                type="button"
                onClick={() => navRef.current?.scrollBy({ top: 120, behavior: "smooth" })}
                aria-label="Ver más opciones"
                className="pointer-events-auto flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 ring-1 ring-cyan-500/40 text-cyan-300 animate-bounce hover:bg-cyan-500/30 transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </nav>

        {/* Footer: Mi cuenta + toggle */}
        <div className={`border-t border-white/[0.06] ${effectiveCollapsed ? "px-2 py-2" : "p-3"} space-y-1 flex-shrink-0`}>
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

      {/* ── Drawer móvil (oculto en md+) ── */}
      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? "" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          onClick={onMobileClose}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-[280px] max-w-[85%] bg-secondary flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-warning rounded flex items-center justify-center">
                <Zap className="text-white h-5 w-5" />
              </div>
              <span className="text-white font-bold text-lg">FINZ</span>
            </div>
            <button
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1.5">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={location.pathname === item.href}
                  onClick={() => handleMobileNavigate(item.href)}
                />
              ))}
            </div>

            {isAdmin && (
              <div className="mt-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest px-3 mb-2">
                  Administración
                </p>
                <div className="space-y-1.5">
                  {adminItems.map((item) => (
                    <NavItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      isActive={location.pathname.startsWith(item.href)}
                      onClick={() => handleMobileNavigate(item.href)}
                    />
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="border-t border-white/[0.06] p-4">
            <NavItem
              icon={Settings}
              label="Mi cuenta"
              onClick={() => handleMobileNavigate("/cuenta")}
            />
          </div>
        </div>
      </div>
    </>
  );
}
