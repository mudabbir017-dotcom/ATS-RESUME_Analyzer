const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  analyze,
  getHistory,
  getOne,
  getPdf,
} = require("../controllers/analysisController");

const router = express.Router();

router.use(protect); // every route below requires a valid JWT

router.post("/analyze", upload.single("resume"), analyze);
router.get("/history", getHistory);
router.get("/:id/pdf", getPdf);
router.get("/:id", getOne);

module.exports = router;
