const mongoose = require("mongoose");

/**
 * Payment Schema — tracks individual payments received from customers.
 *
 * `clientId` is the offline-generated UUID from the frontend,
 * allowing deduplication during sync (same pattern as other models).
 */
const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: [true, "Customer reference is required"],
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },
    method: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer"],
      default: "Cash",
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    synced: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
