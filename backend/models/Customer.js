const mongoose = require("mongoose");

/**
 * Customer Schema
 * Represents a micro-entrepreneur's client.
 * `clientId` is the offline-generated UUID from the frontend,
 * allowing deduplication during sync.
 */
const customerSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

module.exports = mongoose.model("Customer", customerSchema);
