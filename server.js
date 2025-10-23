const express = require("express");
const cors = require("cors");
const documentRoutes = require("./routes/documents");
const app = express();
const PORT = 3000;

// CORS middleware - Add this before other middleware
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/documents", documentRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Backend working!" });
});

// Error handling middleware - Must be last
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test the server at http://localhost:${PORT}/`);
  console.log(`Documents API at http://localhost:${PORT}/api/documents/`);
});
