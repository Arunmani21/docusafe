const multer = require("multer");
const ipfsService = require("../services/ipfsService");
const Document = require("../models/Document");

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const uploadDocument = async (req, res) => {
  try {
    console.log("📤 Upload request received");

    if (!req.file) {
      console.log("❌ No file found in req.file");
      return res
        .status(400)
        .json({ error: "No file uploaded. Please use field name: document" });
    }

    console.log("📁 File:", req.file.originalname, `(${req.file.size} bytes)`);
    console.log("⬆️  Adding to IPFS...");

    const ipfsResult = await ipfsService.addToIPFS(
      req.file.buffer,
      req.file.originalname
    );
    console.log("✅ IPFS Result:", ipfsResult);

    // Save to database
    console.log("💾 Saving to database...");
    Document.create(
      {
        name: req.file.originalname,
        description: req.body.description || "",
        cid: ipfsResult.cid,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: req.body.uploaded_by || "test-user",
      },
      (err, document) => {
        if (err) {
          console.error("❌ Database error:", err);
          return res
            .status(500)
            .json({ error: "Failed to save document: " + err.message });
        }

        console.log("✅ Document saved to database with ID:", document.id);

        // FIX: Use res.json() which maintains CORS headers
        res.json({
          success: true,
          message: "File uploaded successfully!",
          cid: ipfsResult.cid,
          document: document,
          ipfsUrl: `https://ipfs.io/ipfs/${ipfsResult.cid}`,
        });
      }
    );
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
};

// Get all documents
const getAllDocuments = (req, res) => {
  console.log("📋 GET /api/documents/ - Fetching all documents");

  Document.findAll((err, documents) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }

    console.log(`✅ Returning ${documents.length} documents`);
    
    // FIX: Explicitly set CORS headers for this response
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.json(documents);
  });
};

// Get document by CID
const getDocument = async (req, res) => {
  try {
    const { cid } = req.params;
    console.log("📄 Fetching document with CID:", cid);

    Document.findByCid(cid, async (err, document) => {
      if (err || !document) {
        console.log("❌ Document not found:", cid);
        return res.status(404).json({ error: "Document not found" });
      }

      console.log("✅ Found document:", document.name);

      const content = await ipfsService.getFromIPFS(cid);

      // FIX: Set CORS headers before other headers
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader("Content-Type", document.mime_type);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.name}"`
      );

      console.log("📤 Sending file content to client");
      res.send(content);
    });
  } catch (error) {
    console.error("❌ Retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve document" });
  }
};

module.exports = {
  uploadMiddleware: upload.single("document"),
  uploadDocument,
  getAllDocuments,
  getDocument,
};