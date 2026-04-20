import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "~/components/molecules";
import { Zap, Search, LogOut } from "lucide-react";
import { useAuthStore } from "~/store/authStore";

const SIDEBAR_STATE_KEY = "finz-sidebar-collapsed";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { token, user, clearSession, isAuthenticated } = useAuthStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Load saved sidebar state on mount (defaults to collapsed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (saved === "false") setSidebarCollapsed(false);
  }, []);

  // Persist state
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
    <div className="min-h-screen bg-primary p-4">
      <header className="bg-secondary rounded-2xl p-4 mb-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-warning rounded flex items-center justify-center">
            <Zap className="text-white h-5 w-5" />
          </div>
          <span className="text-white font-bold text-xl">FINZ</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Buscar"
              className="bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gray-600 w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white hidden sm:inline">{user?.username ?? "Usuario"}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase() ?? "U"}
                </span>
              )}
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

      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <div className="flex-1 min-w-0 bg-primary rounded-2xl overflow-auto">
          <div className="p-5 text-white">{children}</div>
        </div>
      </div>
    </div>
  );
}
