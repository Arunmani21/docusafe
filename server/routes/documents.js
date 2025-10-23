const express = require("express");
const router = express.Router();
const {
  uploadMiddleware,
  uploadDocument,
  getAllDocuments,
  getDocument,
} = require("../controllers/documentController");

// Upload route - use the middleware correctly
router.post("/upload", uploadMiddleware, uploadDocument);

// Get all documents
router.get("/", getAllDocuments);

// Get specific document by CID
router.get("/:cid", getDocument);

module.exports = router;
