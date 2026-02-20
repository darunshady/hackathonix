const express = require("express");
const router = express.Router();
const { syncAll } = require("../controllers/syncController");

router.post("/", syncAll);

module.exports = router;
