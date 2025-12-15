import { NavItem } from "~/components/atoms";
import { Home, Edit3, CreditCard, RefreshCw, Gift, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  isActive?: boolean;
}

const navigationItems: NavigationItem[] = [
  { icon: Home, label: "Inicio", isActive: true },
  { icon: Edit3, label: "Categorías" },
  { icon: CreditCard, label: "Cuentas" },
  { icon: RefreshCw, label: "Transacciones" },
  { icon: Gift, label: "Lista de Deseos" },
  { icon: BarChart3, label: "Métricas" },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-secondary rounded-2xl flex flex-col">
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => (
            <NavItem
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={item.isActive}
              onClick={() => console.log(`Navigating to ${item.label}`)}
            />
          ))}
        </div>
      </nav>
      
      {/* User Account at bottom */}
      <div className="p-4 border-t border-gray-600">
        <NavItem
          icon={Settings}
          label="Mi cuenta"
          onClick={() => console.log("Opening user account")}
        />
      </div>
    </div>
  );
}