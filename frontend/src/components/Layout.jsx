import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

/**
 * App shell — Navbar + page content area.
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
