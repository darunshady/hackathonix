/**
 * InvoiceItemsCard — Left card with line-item table, voice input,
 * optional tax %, subtotal & grand total.
 *
 * Props:
 *   items        — [{ name, qty, price }]
 *   onUpdateItem — (index, field, value) => void
 *   onAddItem    — () => void
 *   onRemoveItem — (index) => void
 *   taxPercent   — number
 *   onTaxChange  — (value) => void
 *   subtotal     — number
 *   grandTotal   — number
 *   onVoiceInput — () => void
 */

/* ── Tiny icons ────────────────────────────────────────── */
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export default function InvoiceItemsCard({
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  taxPercent,
  onTaxChange,
  subtotal,
  grandTotal,
  onVoiceInput,
  isListening = false,
  aiLoading = false,
  voiceLang = "ta-IN",
  onLangChange,
  onItemFocus,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Invoice Items</h2>

      {/* ── Table header ───────────────────────── */}
      <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-gray-400 uppercase tracking-wider px-1">
        <span className="col-span-5">Item Name</span>
        <span className="col-span-2 text-center">Qty</span>
        <span className="col-span-2 text-center">Unit Price</span>
        <span className="col-span-2 text-right">Total</span>
        <span className="col-span-1" />
      </div>

      {/* ── Rows ───────────────────────────────── */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const lineTotal = Number(item.qty) * Number(item.price);
          return (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 items-center"
            >
              {/* Name */}
              <input
                type="text"
                placeholder="Item name"
                value={item.name}
                onChange={(e) => onUpdateItem(idx, "name", e.target.value)}
                onFocus={() => onItemFocus?.(idx)}
                className="col-span-12 sm:col-span-5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799]
                           transition-shadow"
              />

              {/* Qty */}
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => onUpdateItem(idx, "qty", e.target.value)}
                className="col-span-4 sm:col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center
                           focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
              />

              {/* Price */}
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₹ 0"
                value={item.price}
                onChange={(e) => onUpdateItem(idx, "price", e.target.value)}
                className="col-span-4 sm:col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center
                           focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
              />

              {/* Line total */}
              <span className="col-span-3 sm:col-span-2 text-sm font-semibold text-gray-700 text-right">
                ₹{lineTotal.toLocaleString("en-IN")}
              </span>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemoveItem(idx)}
                disabled={items.length === 1}
                className="col-span-1 flex justify-center text-gray-400 hover:text-red-500 disabled:opacity-30
                           transition-colors"
                title="Remove item"
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Add Item + Voice ───────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1.5 bg-[#229799] hover:bg-[#1b7f81] text-white
                     text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusIcon />
          Add Line Item
        </button>

        <button
          type="button"
          onClick={onVoiceInput}
          disabled={aiLoading}
          title={isListening ? "Listening…" : aiLoading ? "AI processing…" : "Voice Input"}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            isListening
              ? "bg-red-100 text-red-500 animate-pulse"
              : aiLoading
              ? "bg-amber-100 text-amber-500 cursor-wait"
              : "bg-[#229799]/10 text-[#229799] hover:bg-[#229799]/20"
          }`}
        >
          {aiLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <MicIcon />
          )}
        </button>

        {/* Language toggle */}
        {onLangChange && (
          <button
            type="button"
            onClick={() => onLangChange(voiceLang === "ta-IN" ? "en-IN" : "ta-IN")}
            title={voiceLang === "ta-IN" ? "Switch to English" : "Switch to Tamil"}
            className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold
                       text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <span className="text-base leading-none">{voiceLang === "ta-IN" ? "த" : "A"}</span>
            <span>{voiceLang === "ta-IN" ? "Tamil" : "English"}</span>
          </button>
        )}
      </div>

      {/* ── Divider ────────────────────────────── */}
      <hr className="border-gray-100" />

      {/* ── Tax % input ────────────────────────── */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-500">Tax %</label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={taxPercent}
          onChange={(e) => onTaxChange(e.target.value)}
          className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-right
                     focus:outline-none focus:ring-2 focus:ring-[#229799]/30 focus:border-[#229799] transition-shadow"
        />
      </div>

      {/* ── Subtotal ───────────────────────────── */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Subtotal</span>
        <span className="font-medium text-gray-700">₹{subtotal.toLocaleString("en-IN")}</span>
      </div>

      {taxPercent > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Tax ({taxPercent}%)</span>
          <span className="font-medium text-gray-700">
            ₹{((subtotal * taxPercent) / 100).toLocaleString("en-IN")}
          </span>
        </div>
      )}

      {/* ── Grand Total ────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-lg font-bold text-gray-800">Grand Total</span>
        <span className="text-2xl font-bold text-[#229799]">
          ₹{grandTotal.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
