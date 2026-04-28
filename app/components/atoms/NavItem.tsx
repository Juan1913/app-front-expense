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
        collapsed ? "justify-center w-9 h-9 mx-auto" : "gap-2.5 px-3 py-2 text-sm",
        isActive
          ? "text-white bg-gray-700"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      )}
    >
      <Icon className={cn("flex-shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]")} />
      {!collapsed && <span className="truncate">{label}</span>}

      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg border border-white/[0.06] z-50">
          {label}
        </span>
      )}
    </div>
  );
}
