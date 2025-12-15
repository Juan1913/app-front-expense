import { cn } from "~/utils";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "text-white bg-gray-700"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}