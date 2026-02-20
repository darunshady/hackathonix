const express = require("express");
const router = express.Router();
const {
  getInvoices,
  createInvoice,
} = require("../controllers/invoiceController");

router.get("/", getInvoices);
router.post("/", createInvoice);

module.exports = router;
