const express = require("express");
const router = express.Router();
const { parseInvoiceSentence } = require("../controllers/aiController");

// POST /api/ai/parse — Parse natural language into structured invoice JSON
router.post("/parse", parseInvoiceSentence);

module.exports = router;
