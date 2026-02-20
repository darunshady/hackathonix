const Customer = require("../models/Customer");

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
 * @desc   Create a new customer (idempotent via clientId upsert)
 * @route  POST /api/customers
 */
exports.createCustomer = async (req, res) => {
  try {
    const { clientId, name, phone, address } = req.body;

    if (!clientId || !name) {
      return res
        .status(400)
        .json({ message: "clientId and name are required" });
    }

    // Upsert: if clientId already exists update it, otherwise insert.
    // This makes sync idempotent — resending the same record is safe.
    const customer = await Customer.findOneAndUpdate(
      { clientId },
      { clientId, name, phone, address },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(customer);
  } catch (error) {
    console.error("createCustomer error:", error);
    res.status(500).json({ message: "Server error creating customer" });
  }
};
