const express = require("express");
const router = express.Router();
const { sendWhatsApp } = require("../controllers/whatsappController");

router.post("/", sendWhatsApp);

module.exports = router;
