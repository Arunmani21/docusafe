const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Ensure the database directory exists
const databaseDir = path.join(__dirname, "..", "database");
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
  console.log("✅ Created database directory:", databaseDir);
}

// Database file path
const dbPath = path.join(databaseDir, "documents.db");
console.log("📁 Database path:", dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
    initializeDatabase();
  }
});

// Initialize the database with tables
function initializeDatabase() {
  db.run(
    `
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            cid VARCHAR(100) UNIQUE NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(100),
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            uploaded_by VARCHAR(100)
        )
    `,
    (err) => {
      if (err) {
        console.error("❌ Error creating table:", err);
      } else {
        console.log("✅ Documents table is ready.");
      }
    }
  );
}

module.exports = db;
