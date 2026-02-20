const express = require("express");
const router = express.Router();
const { processVoice } = require("../controllers/voiceController");

router.post("/", processVoice);

module.exports = router;
