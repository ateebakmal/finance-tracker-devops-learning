import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HomeIcon, ChartIcon, WalletIcon, UserIcon, PlusIcon } from "./icons";

// One tab. NavLink's render-prop gives us isActive so we can color the
// icon + label together: accent when active, faint when not.
function NavItem({ to, end, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex flex-col items-center gap-1 py-1 transition-colors"
    >
      {({ isActive }) => (
        <span
          className={cn(
            "flex flex-col items-center gap-1",
            isActive ? "text-accent" : "text-faint",
          )}
        >
          <Icon className="h-[23px] w-[23px]" />
          <span className="font-sans text-[10px] font-bold">{label}</span>
        </span>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="border-line bg-card fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t">
      <div className="grid grid-cols-5 items-center px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <NavItem to="/dashboard" end icon={HomeIcon} label="Home" />
        <NavItem to="/analytics" icon={ChartIcon} label="Analytics" />

        {/* Center: the one raised FAB. It pops above the bar via -translate-y. */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate("/add-transaction")}
            aria-label="Add transaction"
            className="bg-accent shadow-accent/40 grid h-[58px] w-[58px] -translate-y-6 place-items-center rounded-[20px] border-4 border-white text-white shadow-lg transition active:scale-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>

        <NavItem to="/transactions" icon={WalletIcon} label="Wallet" />
        <NavItem to="/profile" icon={UserIcon} label="Profile" />
      </div>
    </nav>
  );
}
