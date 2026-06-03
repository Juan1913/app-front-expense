import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Sidebar, OnboardingModal, shouldShowOnboarding, TrmChip } from "~/components/molecules";
import {
  Zap, Search, LogOut, Home, Edit3, CreditCard, RefreshCw, Gift,
  BarChart3, MessageCircle, Target, Trash2, Settings, Users, CornerDownLeft,
  FlaskConical, Sparkles, Coins, Menu, X, FileText, Repeat, DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "~/store/authStore";

const SIDEBAR_STATE_KEY = "finz-sidebar-collapsed";

interface SearchEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
  adminOnly?: boolean;
}

const SEARCH_ENTRIES: SearchEntry[] = [
  { label: "Inicio",          href: "/",             icon: Home,          keywords: ["dashboard", "home"] },
  { label: "Categorías",      href: "/categorias",   icon: Edit3,         keywords: ["categorias", "categories"] },
  { label: "Cuentas",         href: "/cuentas",      icon: CreditCard,    keywords: ["accounts", "tarjetas"] },
  { label: "Presupuestos",    href: "/presupuestos", icon: Target,        keywords: ["budgets"] },
  { label: "Transacciones",   href: "/transacciones", icon: RefreshCw,    keywords: ["transactions", "movimientos", "gastos", "ingresos"] },
  { label: "Lista de Deseos", href: "/deseos",       icon: Gift,          keywords: ["wishlist", "deseos"] },
  { label: "Métricas",        href: "/metricas",     icon: BarChart3,     keywords: ["metrics", "reportes", "estadisticas"] },
  { label: "Análisis",        href: "/analisis",     icon: FlaskConical,  keywords: ["derivadas", "regresion", "runway", "elasticidad", "analysis", "matematicas"] },
  { label: "Simulador",       href: "/simulador",    icon: Sparkles,      keywords: ["simulator", "que pasa si", "what if", "escenarios", "proyeccion"] },
  { label: "Deudas",          href: "/deudas",       icon: Coins,         keywords: ["debts", "snowball", "avalanche", "credito", "prestamo", "tarjeta", "interes"] },
  { label: "Gastos fijos",    href: "/fijos",        icon: Repeat,        keywords: ["recurrentes", "arriendo", "gym", "seguridad social", "suscripciones", "subscriptions", "fixed"] },
  { label: "Dólar (TRM)",     href: "/dolar",        icon: DollarSign,    keywords: ["trm", "dolar", "usd", "tasa de cambio", "exchange rate"] },
  { label: "FinBot IA",       href: "/chat",         icon: MessageCircle, keywords: ["chat", "ia", "ai", "finbot"] },
  { label: "Documentos",      href: "/documentos",   icon: FileText,      keywords: ["documents", "pdf", "extracto", "archivos", "rag"] },
  { label: "Papelera",        href: "/papelera",     icon: Trash2,        keywords: ["trash", "basura"] },
  { label: "Mi cuenta",       href: "/cuenta",       icon: Settings,      keywords: ["profile", "perfil", "ajustes"] },
  { label: "Usuarios",        href: "/admin/users",  icon: Users,         keywords: ["admin", "users"], adminOnly: true },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, clearSession, isAuthenticated } = useAuthStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === "ADMIN";

  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (token && shouldShowOnboarding()) {
      const t = setTimeout(() => setOnboardingOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [token]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const pageMatches = useMemo(() => {
    const q = normalize(searchQuery.trim());
    if (!q) return [] as SearchEntry[];
    return SEARCH_ENTRIES.filter((e) => {
      if (e.adminOnly && !isAdmin) return false;
      if (normalize(e.label).includes(q)) return true;
      return e.keywords?.some((k) => normalize(k).includes(q)) ?? false;
    }).slice(0, 6);
  }, [searchQuery, isAdmin]);

  const hasQuery = searchQuery.trim().length > 0;
  const totalOptions = pageMatches.length + (hasQuery ? 1 : 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    function onDocClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function goToTransactionSearch(q: string) {
    navigate(`/transacciones?q=${encodeURIComponent(q)}`);
  }

  function selectOption(index: number) {
    if (index < pageMatches.length) {
      navigate(pageMatches[index].href);
    } else if (hasQuery) {
      goToTransactionSearch(searchQuery.trim());
    }
    setSearchOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setSearchOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!searchOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setSearchOpen(true);
    }
    if (totalOptions === 0) {
      if (e.key === "Enter" && hasQuery) {
        e.preventDefault();
        goToTransactionSearch(searchQuery.trim());
        setSearchOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % totalOptions);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + totalOptions) % totalOptions);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectOption(activeIndex);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (saved === "false") setSidebarCollapsed(false);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      } catch {}
      return next;
    });
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [token, navigate]);

  if (!token) return null;

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-primary p-2 sm:p-4 md:flex md:flex-col">
      <header className="bg-secondary rounded-2xl px-3 sm:px-4 py-3 sm:py-4 mb-3 sm:mb-4 h-14 sm:h-16 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            className="md:hidden -ml-1 p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/60 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="w-8 h-8 bg-warning rounded flex items-center justify-center flex-shrink-0">
            <Zap className="text-white h-5 w-5" />
          </div>
          <span className="text-white font-bold text-xl">FINZ</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Buscar"
            className="md:hidden p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/60 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          <div ref={searchRef} className="relative hidden md:block">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar páginas o transacciones…"
              className="bg-gray-700 text-white px-4 py-2 pl-10 pr-14 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 w-72"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-black/30 px-1.5 py-0.5 rounded border border-white/[0.06] font-mono">
              ⌘K
            </span>

            {searchOpen && (pageMatches.length > 0 || hasQuery) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1f] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-30">
                {pageMatches.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                      Páginas
                    </div>
                    {pageMatches.map((m, i) => {
                      const Icon = m.icon;
                      const active = i === activeIndex;
                      return (
                        <button
                          key={m.href}
                          type="button"
                          onMouseEnter={() => setActiveIndex(i)}
                          onMouseDown={(e) => { e.preventDefault(); selectOption(i); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                            active ? "bg-cyan-500/15 text-cyan-200" : "text-gray-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon className="h-4 w-4 text-gray-400" />
                          <span className="flex-1">{m.label}</span>
                          {active && <CornerDownLeft className="h-3.5 w-3.5 text-gray-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {hasQuery && (
                  <div className={`${pageMatches.length > 0 ? "border-t border-white/[0.06]" : ""} py-1`}>
                    <div className="px-3 pt-2 pb-1 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                      Transacciones
                    </div>
                    {(() => {
                      const idx = pageMatches.length;
                      const active = idx === activeIndex;
                      return (
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={(e) => { e.preventDefault(); selectOption(idx); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                            active ? "bg-cyan-500/15 text-cyan-200" : "text-gray-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span className="flex-1 truncate">
                            Buscar “<span className="text-white font-medium">{searchQuery.trim()}</span>” en transacciones
                          </span>
                          {active && <CornerDownLeft className="h-3.5 w-3.5 text-gray-500" />}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <TrmChip />

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-white hidden sm:inline">{user?.username ?? "Usuario"}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user?.username?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileSearchOpen && (
        <div className="md:hidden bg-secondary rounded-2xl p-3 mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar páginas o transacciones…"
              className="bg-gray-700 text-white w-full px-4 py-2 pl-10 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <button
            onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
            aria-label="Cerrar búsqueda"
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {mobileSearchOpen && (pageMatches.length > 0 || hasQuery) && (
        <div className="md:hidden bg-[#1a1a1f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden mb-3">
          {pageMatches.length > 0 && (
            <div className="py-1">
              <div className="px-3 pt-2 pb-1 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                Páginas
              </div>
              {pageMatches.map((m, i) => {
                const Icon = m.icon;
                const active = i === activeIndex;
                return (
                  <button
                    key={m.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => { selectOption(i); setMobileSearchOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                      active ? "bg-cyan-500/15 text-cyan-200" : "text-gray-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="flex-1">{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {hasQuery && (
            <div className={`${pageMatches.length > 0 ? "border-t border-white/[0.06]" : ""} py-1`}>
              <div className="px-3 pt-2 pb-1 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                Transacciones
              </div>
              <button
                type="button"
                onClick={() => { selectOption(pageMatches.length); setMobileSearchOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-200 hover:bg-white/[0.04] transition-colors"
              >
                <Search className="h-4 w-4 text-gray-400" />
                <span className="flex-1 truncate">
                  Buscar “<span className="text-white font-medium">{searchQuery.trim()}</span>” en transacciones
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex md:flex-1 md:min-h-0 md:gap-4">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex-1 min-w-0 bg-primary md:rounded-2xl md:overflow-y-auto">
          <div className="p-3 sm:p-5 text-white">{children}</div>
        </div>
      </div>

      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}
