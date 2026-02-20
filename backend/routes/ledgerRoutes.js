const express = require("express");
const router = express.Router();
const {
  getLedgerEntries,
  createLedgerEntry,
  getCustomerBalance,
} = require("../controllers/ledgerController");

router.get("/", getLedgerEntries);
router.post("/", createLedgerEntry);
router.get("/balance/:customerId", getCustomerBalance);

module.exports = router;
