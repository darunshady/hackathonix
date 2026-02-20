import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import db from "../db";
import { enqueue } from "../services/syncManager";
import useOnlineStatus from "../hooks/useOnlineStatus";
import InvoiceItemsCard from "../components/InvoiceItemsCard";
import InvoiceDetailsCard from "../components/InvoiceDetailsCard";
import TransactionTypeToggle from "../components/TransactionTypeToggle";
import BalancePreview from "../components/BalancePreview";

/**
 * Create Invoice — modern two-column layout.
 * Left: line items · Right: invoice details
 */
export default function CreateInvoice() {
  const navigate = useNavigate();
  const online = useOnlineStatus();

  // ── Transaction type ─────────────────────────────────
  const [invoiceType, setInvoiceType] = useState("selling");

  // ── Customer data ────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    db.customers.toArray().then(setCustomers);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const phone = selectedCustomer?.phone || "";

  // ── Running balance for selected customer ────────────
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    if (!customerId) {
      setCurrentBalance(0);
      return;
    }
    // Sum ledger entries: selling adds, buying subtracts
    db.ledger
      .where("customerId")
      .equals(customerId)
      .toArray()
      .then((entries) => {
        const bal = entries.reduce((sum, e) => {
          return e.type === "selling" ? sum + e.amount : sum - e.amount;
        }, 0);
        setCurrentBalance(bal);
      })
      .catch(() => setCurrentBalance(0));
  }, [customerId]);

  // ── Line items ───────────────────────────────────────
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [taxPercent, setTaxPercent] = useState(0);

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };
  const addItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.price), 0);
  const grandTotal = subtotal + (subtotal * Number(taxPercent)) / 100;

  // ── Details state ────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [paymentStatus, setPaymentStatus] = useState("credit");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Sync label
  const syncLabel = online ? "Online" : "Offline";

  // ── Voice input placeholder ──────────────────────────
  const handleVoiceInput = () => {
    alert("🎤 Voice input coming soon!\nThis will use AI to auto-fill invoice items from speech.");
  };

  // ── Submit helpers ───────────────────────────────────
  const saveInvoice = async (isDraft = false) => {
    if (!customerId) return alert("Please select a customer");
    if (items.some((i) => !i.name.trim())) return alert("All items need a name");

    const newInvoice = {
      id: crypto.randomUUID(),
      customerId,
      invoiceType,
      items: items.map((i) => ({
        name: i.name.trim(),
        qty: Number(i.qty),
        price: Number(i.price),
      })),
      total: grandTotal,
      taxPercent: Number(taxPercent),
      amountPaid: Number(amountPaid || 0),
      balanceDue: Math.max(0, grandTotal - Number(amountPaid || 0)),
      status: isDraft ? "draft" : paymentStatus === "paid" ? "paid" : "pending",
      notes: notes.trim(),
      synced: navigator.onLine ? 1 : 0,
      createdAt: invoiceDate
        ? new Date(invoiceDate).toISOString()
        : new Date().toISOString(),
    };

    await db.invoices.add(newInvoice);

    // ── Ledger entry ─────────────────────────────────
    if (!isDraft) {
      await db.ledger.add({
        customerId,
        invoiceId: newInvoice.id,
        type: invoiceType,
        amount: grandTotal,
        createdAt: newInvoice.createdAt,
      });
    }

    if (!navigator.onLine) {
      await enqueue("invoice", newInvoice.id, "create");
    } else {
      try {
        const { default: api } = await import("../services/api");
        await api.post("/invoices", {
          clientId: newInvoice.id,
          customerId: newInvoice.customerId,
          items: newInvoice.items,
          total: newInvoice.total,
          status: newInvoice.status,
        });
        await db.invoices.update(newInvoice.id, { synced: 1 });
      } catch {
        await enqueue("invoice", newInvoice.id, "create");
        await db.invoices.update(newInvoice.id, { synced: 0 });
      }
    }

    // WhatsApp send
    if (sendWhatsApp && !isDraft && phone) {
      const msg =
        invoiceType === "selling"
          ? `Hi ${selectedCustomer.name}, your invoice for ₹${grandTotal.toLocaleString("en-IN")} has been created. Thank you!`
          : `Hi ${selectedCustomer.name}, we have recorded a purchase of ₹${grandTotal.toLocaleString("en-IN")}. Thank you!`;
      window.open(`https://wa.me/91${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
    }

    navigate("/invoices");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create New Invoice</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fill in the details to generate a new invoice.</p>
      </div>

      {/* ── Transaction Type Toggle ─────────────── */}
      <TransactionTypeToggle value={invoiceType} onChange={setInvoiceType} />

      {/* ── Two-column grid ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Items (wider) */}
        <div className="lg:col-span-3">
          <InvoiceItemsCard
            items={items}
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            taxPercent={taxPercent}
            onTaxChange={setTaxPercent}
            subtotal={subtotal}
            grandTotal={grandTotal}
            onVoiceInput={handleVoiceInput}
          />
        </div>

        {/* Right — Details */}
        <div className="lg:col-span-2 space-y-5">
          <InvoiceDetailsCard
            customers={customers}
            customerId={customerId}
            onCustomerChange={setCustomerId}
            phone={phone}
            invoiceDate={invoiceDate}
            onDateChange={setInvoiceDate}
            paymentStatus={paymentStatus}
            onPaymentToggle={setPaymentStatus}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
            grandTotal={grandTotal}
            notes={notes}
            onNotesChange={setNotes}
            syncLabel={syncLabel}
            partyLabel={invoiceType === "selling" ? "Customer" : "Supplier"}
          />

          {/* Balance preview — only when a customer is selected */}
          {customerId && grandTotal > 0 && (
            <BalancePreview
              currentBalance={currentBalance}
              transactionAmt={grandTotal}
              invoiceType={invoiceType}
              partyName={selectedCustomer?.name}
            />
          )}
        </div>
      </div>

      {/* ── Bottom Actions ──────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* WhatsApp checkbox */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendWhatsApp}
            onChange={(e) => setSendWhatsApp(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#229799] focus:ring-[#229799]/40"
          />
          Send via WhatsApp when online
        </label>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveInvoice(true)}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium
                       hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => saveInvoice(false)}
            className="px-6 py-2.5 rounded-xl bg-[#229799] hover:bg-[#1b7f81] text-white text-sm font-medium
                       transition-colors shadow-sm"
          >
            Send Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
