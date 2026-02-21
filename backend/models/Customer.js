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
      index: true,
      // sparse: true allows multiple empty strings while enforcing
      // uniqueness for non-empty phone numbers via the pre-save hook below
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

// Enforce phone uniqueness for non-empty values (allows multiple empty strings)
customerSchema.pre("save", async function (next) {
  if (this.phone && this.phone.trim()) {
    const existing = await mongoose.model("Customer").findOne({
      phone: this.phone.trim(),
      _id: { $ne: this._id },
    });
    if (existing) {
      return next(new Error(`Phone number ${this.phone} already exists for customer "${existing.name}"`));
    }
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
