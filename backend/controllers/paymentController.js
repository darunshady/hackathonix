const Payment = require("../models/Payment");

/**
 * @desc   Get all payments (optional ?customerId filter)
 * @route  GET /api/payments
 */
exports.getPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customerId) filter.customerId = req.query.customerId;

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error("getPayments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc   Create a new payment
 * @route  POST /api/payments
 */
exports.createPayment = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error("createPayment error:", error);
    res.status(400).json({ message: error.message });
  }
};
