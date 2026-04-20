import { cn } from "~/utils";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, isActive, collapsed = false, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg cursor-pointer transition-all duration-200 group relative",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-4 py-3",
        isActive
          ? "text-white bg-gray-700"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}

      {/* Tooltip on hover when collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg border border-white/[0.06] z-50">
          {label}
        </span>
      )}
    </div>
  );
}
