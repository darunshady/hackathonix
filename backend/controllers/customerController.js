const Customer = require("../models/Customer");
const LedgerEntry = require("../models/LedgerEntry");

/**
 * @desc   Get all customers, newest first
 * @route  GET /api/customers
 */
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error("getCustomers error:", error);
    res.status(500).json({ message: "Server error fetching customers" });
  }
};

/**
 * @desc   Get a single customer by clientId, including their balance
 * @route  GET /api/customers/:clientId
 */
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ clientId: req.params.clientId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("getCustomer error:", error);
    res.status(500).json({ message: "Server error fetching customer" });
  }
};

/**
 * @desc   Create a new customer (idempotent via clientId upsert)
 * @route  POST /api/customers
 */
exports.createCustomer = async (req, res) => {
  try {
    const { clientId, name, phone, address, balance, status } = req.body;

    if (!clientId || !name) {
      return res
        .status(400)
        .json({ message: "clientId and name are required" });
    }

    // Client always wins — upsert overwrites server data
    const customer = await Customer.findOneAndUpdate(
      { clientId },
      { clientId, name, phone, address, balance: balance || 0, status: status || "active" },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(customer);
  } catch (error) {
    console.error("createCustomer error:", error);
    res.status(500).json({ message: "Server error creating customer" });
  }
};

/**
 * @desc   Update an existing customer (client always wins)
 * @route  PUT /api/customers/:clientId
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, balance, status } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { clientId: req.params.clientId },
      { name, phone, address, balance, status },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("updateCustomer error:", error);
    res.status(500).json({ message: "Server error updating customer" });
  }
};

/**
 * @desc   Recalculate a customer's balance from ledger entries
 * @route  POST /api/customers/:clientId/recalculate
 */
exports.recalculateBalance = async (req, res) => {
  try {
    const { clientId } = req.params;
    const entries = await LedgerEntry.find({ customerId: clientId });

    let balance = 0;
    for (const entry of entries) {
      if (entry.type === "credit") balance += entry.amount;
      else if (entry.type === "debit") balance -= entry.amount;
    }

    const customer = await Customer.findOneAndUpdate(
      { clientId },
      { balance },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ customer, calculatedBalance: balance });
  } catch (error) {
    console.error("recalculateBalance error:", error);
    res.status(500).json({ message: "Server error recalculating balance" });
  }
};
