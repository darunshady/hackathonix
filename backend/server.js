require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// ── Route imports ─────────────────────────────────────────────
const customerRoutes = require("./routes/customerRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const syncRoutes = require("./routes/syncRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ── Initialise Express ────────────────────────────────────────
const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(cors()); // allow all origins (tighten in production)
app.use(express.json({ limit: "5mb" })); // parse JSON bodies

// ── API Routes ────────────────────────────────────────────────
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/voice-process", voiceRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/send-whatsapp", whatsappRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 NanoBiz API running on http://0.0.0.0:${PORT}`);
  });
});
