import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ErrorBoundary from "./ErrorBoundary";

/**
 * App shell — Navbar + page content area.
 * Uses a light neutral background for a modern SaaS dashboard look.
 * ErrorBoundary prevents white screens from uncaught render errors.
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
