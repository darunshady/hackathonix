const mongoose = require("mongoose");

/**
 * Invoice Item sub-schema — embedded inside each invoice.
 */
const invoiceItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Invoice Schema
 * `clientId` is the offline-generated UUID from the frontend,
 * so duplicate syncs can be detected via upsert.
 */
const invoiceSchema = new mongoose.Schema(
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
    },
    invoiceType: {
      type: String,
      enum: ["selling", "buying"],
      default: "selling",
    },
    items: {
      type: [invoiceItemSchema],
      validate: [(v) => v.length > 0, "At least one item is required"],
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "partial", "draft", "overdue"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    synced: {
      type: Boolean,
      default: true,
    },
    whatsappSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
