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
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };
  const addItem = () => {
    const newItems = [...items, { name: "", qty: 1, price: 0 }];
    setItems(newItems);
    setActiveItemIndex(newItems.length - 1);
  };
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

  const handlePaymentToggle = (status) => {
    setPaymentStatus(status);
    if (status === "paid") setAmountPaid(""); // clear so paidAmt = grandTotal
  };
  const [notes, setNotes] = useState("");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Sync label
  const syncLabel = online ? "Online" : "Offline";

  // ── Voice / AI state ─────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiToast, setAiToast] = useState("");
  const [voiceLang, setVoiceLang] = useState("ta-IN"); // "ta-IN" | "en-IN"

  const showToast = (msg, duration = 4000) => {
    setAiToast(msg);
    setTimeout(() => setAiToast(""), duration);
  };

  const processAIResult = async (transcript) => {
    showToast(`🎤 "${transcript}" — parsing with AI…`, 8000);
    setAiLoading(true);

    try {
      const { parseWithAI } = await import("../services/aiService");
      const result = await parseWithAI(transcript);
      const txType = (result.transaction_type || "").toLowerCase();

      // ── Transaction type: user controls this manually, AI does NOT change it ─

      // ── Auto-fill party ────────────────────────────────────────────────────
      if (result.party_name) {
        const norm = (s) =>
          (s || "")
            .toLowerCase()
            .replace(/(sir|anna|amma|madam|bhai|boss|akka|mr|mrs|bro)/g, "")
            .replace(/\s+/g, " ")
            .trim();
        const query = norm(result.party_name);

        // Try fresh DB read; fall back to already-loaded state array
        let list = customers;
        try {
          list = await db.customers.toArray();
        } catch (dbErr) {
          console.warn("DB read failed, using cached list:", dbErr);
        }

        const match = list.find((c) => {
          const name = norm(c.name);
          return name === query || name.includes(query) || query.includes(name);
        });

        if (match) {
          setCustomerId(String(match.id));
        } else {
          showToast(`🔍 "${result.party_name}" not in contacts — select manually`, 5000);
        }
      }

      // ── Auto-fill the active item row (not always index 0) ───────────────────
      if (txType !== "payment") {
        setItems((prev) => {
          const updated = [...prev];
          const idx = Math.min(activeItemIndex, updated.length - 1);
          updated[idx] = {
            name: result.item_name || "",
            qty: result.quantity || 1,
            price: result.amount || 0,
          };
          return updated;
        });
      }

      // ── Payment detected: redirect to payments page ───────────────────────────
      if (txType === "payment") {
        showToast("💰 Payment detected — redirecting to Payments page…");
        setTimeout(() => navigate("/payments"), 1500);
        return;
      }

      showToast("✅ AI filled the form! Review and save.");
    } catch (err) {
      console.error("AI parse failed:", err?.message || err);
      showToast(`⚠️ Error: ${err?.message || "AI could not understand"}. Please edit manually.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // Offline guard
    if (!navigator.onLine) {
      return showToast("⚠️ AI requires an internet connection.");
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return showToast("⚠️ Speech recognition not supported in this browser.");
    }

    // If already listening, ignore
    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = true;       // keep listening until stopped
    recognition.interimResults = true;   // show partial text while speaking
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let silenceTimer = null;

    const stopAndProcess = () => {
      clearTimeout(silenceTimer);
      recognition.stop();
    };

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscript = "";
      showToast(
        voiceLang === "ta-IN"
          ? "🎤 கேட்கிறேன்… பேசுங்கள் (10 விநாடி)"
          : "🎤 Listening… speak now (10 seconds)",
        10000
      );
      // Hard stop after 10 seconds
      silenceTimer = setTimeout(stopAndProcess, 10000);
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += chunk + " ";
        } else {
          interim = chunk;
        }
      }
      // Reset silence timer — gives 3s after last word
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(stopAndProcess, 3000);

      // Show live preview
      const preview = (finalTranscript + interim).trim();
      if (preview) setAiToast(`🎤 "${preview}"`);
    };

    recognition.onerror = (e) => {
      clearTimeout(silenceTimer);
      setIsListening(false);
      if (e.error === "no-speech") return showToast("🎤 No speech detected. Try again.");
      if (e.error === "aborted") return;
      showToast("⚠️ Mic error: " + e.error);
    };

    recognition.onend = () => {
      clearTimeout(silenceTimer);
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text) {
        processAIResult(text);
      } else {
        showToast("🎤 No speech detected. Try again.");
      }
    };

    recognition.start();
  };

  // ── Submit helpers ───────────────────────────────────
  const saveInvoice = async (isDraft = false) => {
    if (!customerId) return alert("Please select a customer");
    if (items.some((i) => !i.name.trim())) return alert("All items need a name");
    if (items.some((i) => Number(i.qty) <= 0)) return alert("All items must have quantity greater than 0");
    if (items.some((i) => Number(i.price) <= 0)) return alert("All items must have a price greater than 0");
    if (grandTotal <= 0) return alert("Invoice total must be greater than 0");

    // When status is "paid", the amount-paid field is hidden — treat the full
    // total as paid so balanceDue is correctly 0.
    const paidAmt =
      paymentStatus === "paid"
        ? grandTotal
        : Math.min(Number(amountPaid || 0), grandTotal);

    // Derive status: partial when some (but not all) has been paid
    const invoiceStatus = isDraft
      ? "draft"
      : paidAmt >= grandTotal
      ? "paid"
      : paidAmt > 0
      ? "partial"
      : "pending";

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
      amountPaid: paidAmt,
      balanceDue: Math.max(0, grandTotal - paidAmt),
      status: invoiceStatus,
      notes: notes.trim(),
      synced: navigator.onLine ? 1 : 0,
      createdAt: invoiceDate
        ? new Date(invoiceDate).toISOString()
        : new Date().toISOString(),
    };

    await db.invoices.add(newInvoice);

    // ── Ledger entry (skip for drafts — finalized on publish) ────
    if (!isDraft) {
      await db.ledger.add({
        clientId: `ledger-${newInvoice.id}`,
        customerId,
        invoiceId: newInvoice.id,
        type: invoiceType,
        amount: newInvoice.balanceDue,
        source: "invoice",
        synced: 0,
        createdAt: newInvoice.createdAt,
      });
    }

    // ── Always update cached customer balance ───────────
    {
      const cust = await db.customers.get(customerId);
      if (cust) {
        if (invoiceType === "selling") {
          const newOwed = (cust.amountOwed || 0) + newInvoice.balanceDue;
          await db.customers.update(customerId, {
            amountOwed: newOwed,
            hasPendingInvoice: true,
            lastInvoiceDate: newInvoice.createdAt.slice(0, 10),
            synced: 0,
          });
        } else {
          const newDebt = (cust.sellerDebt || 0) + newInvoice.balanceDue;
          await db.customers.update(customerId, {
            sellerDebt: newDebt,
            hasPendingInvoice: true,
            lastInvoiceDate: newInvoice.createdAt.slice(0, 10),
            synced: 0,
          });
        }
      }
    }

    if (!navigator.onLine) {
      await enqueue("invoice", newInvoice.id, "create");
    } else {
      try {
        const { default: api } = await import("../services/api");
        await api.post("/invoices", {
          clientId: newInvoice.id,
          customerId: newInvoice.customerId,
          invoiceType: newInvoice.invoiceType,
          items: newInvoice.items,
          total: newInvoice.total,
          taxPercent: newInvoice.taxPercent,
          amountPaid: newInvoice.amountPaid,
          balanceDue: newInvoice.balanceDue,
          status: newInvoice.status,
          notes: newInvoice.notes,
        });
        await db.invoices.update(newInvoice.id, { synced: 1 });
      } catch {
        await enqueue("invoice", newInvoice.id, "create");
        await db.invoices.update(newInvoice.id, { synced: 0 });
      }
    }

    // WhatsApp send — only if synced (online at creation)
    if (sendWhatsApp && !isDraft && phone) {
      if (!navigator.onLine) {
        // Queued: will auto-send after next sync
        await db.invoices.update(newInvoice.id, { whatsappPending: true });
      } else {
        const custName = selectedCustomer?.name ?? "Customer";
        const msg =
          invoiceType === "selling"
            ? `Hi ${custName}, your invoice for ₹${grandTotal.toLocaleString("en-IN")} has been created. Thank you!`
            : `Hi ${custName}, we have recorded a purchase of ₹${grandTotal.toLocaleString("en-IN")}. Thank you!`;
        try {
          window.open(`https://wa.me/91${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
          await db.invoices.update(newInvoice.id, { whatsappSent: true });
        } catch (e) {
          console.error("[CreateInvoice] WhatsApp open failed:", e);
          await db.invoices.update(newInvoice.id, { whatsappPending: true });
        }
      }
    }

    navigate("/invoices");
  };

  return (
    <div className="flex flex-col gap-4 pb-4 lg:h-[calc(100vh-5.5rem)]">
      {/* ── Header ──────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Create New Invoice</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fill in the details to generate a new invoice.</p>
      </div>

      {/* ── Transaction Type Toggle ─────────────── */}
      <TransactionTypeToggle value={invoiceType} onChange={setInvoiceType} />

      {/* ── Two-column grid (scrollable on desktop) ─────────── */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto">
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
            isListening={isListening}
            aiLoading={aiLoading}
            voiceLang={voiceLang}
            onLangChange={setVoiceLang}
            onItemFocus={setActiveItemIndex}
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
            onPaymentToggle={handlePaymentToggle}
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
      </div>{/* end scrollable area */}

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

      {/* ── AI Toast Notification ───────────────── */}
      {aiToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg max-w-md text-center animate-fade-in">
          {aiToast}
        </div>
      )}
    </div>
  );
}
