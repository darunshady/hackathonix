const express = require("express");
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  markWhatsappSent,
} = require("../controllers/invoiceController");

router.get("/", getInvoices);
router.post("/", createInvoice);
router.put("/:clientId", updateInvoice);
router.put("/:clientId/whatsapp-sent", markWhatsappSent);

module.exports = router;
