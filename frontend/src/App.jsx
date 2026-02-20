import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CreateInvoice from "./pages/CreateInvoice";
import InvoicePage from "./pages/InvoicePage";
import { startAutoSync } from "./services/syncManager";

/**
 * Root application component.
 * Sets up routing and kicks off the automatic sync listener.
 */
export default function App() {
  // Start auto-sync on mount — listens for online/offline events
  useEffect(() => {
    startAutoSync((result) => {
      if (result.ok) {
        console.log("[App] Auto-sync complete:", result.synced);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoices" element={<InvoicePage />} />
          <Route path="/invoices/new" element={<CreateInvoice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
