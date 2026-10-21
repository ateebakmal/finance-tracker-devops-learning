import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";

// The persistent frame: a centered mobile-width column. Pages render in the
// Outlet and swap on navigation; the nav below stays mounted.
export default function AppLayout() {
  return (
    <div className="bg-bg mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex-1 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
