const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  recalculateBalance,
} = require("../controllers/customerController");

router.get("/", getCustomers);
router.get("/:clientId", getCustomer);
router.post("/", createCustomer);
router.put("/:clientId", updateCustomer);
router.post("/:clientId/recalculate", recalculateBalance);

module.exports = router;
