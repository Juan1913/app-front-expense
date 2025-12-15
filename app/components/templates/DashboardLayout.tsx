import { Sidebar } from "~/components/molecules";
import { Zap, Search } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-primary p-4">
      {/* Header - se extiende por toda la pantalla con esquinas redondeadas */}
      <header className="bg-secondary rounded-2xl p-4 mb-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-warning rounded flex items-center justify-center">
            <Zap className="text-white h-5 w-5" />
          </div>
          <span className="text-white font-bold text-xl">FINZ</span>
        </div>

        {/* Search and Profile */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar"
              className="bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gray-600 w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <span className="text-white">Juan Torres</span>
            <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </header>

      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content - área principal redondeada */}
        <div className="flex-1 bg-primary rounded-2xl  overflow-auto">
          <div className="text-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}