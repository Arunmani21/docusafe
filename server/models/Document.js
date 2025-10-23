const db = require("../config/database");

class Document {
  // Create a new document record
  static create(documentData, callback) {
    const { name, description, cid, file_size, mime_type, uploaded_by } =
      documentData;
    const sql = `INSERT INTO documents (name, description, cid, file_size, mime_type, uploaded_by) 
                     VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(
      sql,
      [name, description, cid, file_size, mime_type, uploaded_by],
      function (err) {
        if (err) {
          callback(err);
        } else {
          // Return the created document with its ID
          const createdDocument = {
            id: this.lastID,
            ...documentData,
          };
          callback(null, createdDocument);
        }
      }
    );
  }

  // Find all documents
  static findAll(callback) {
    const sql = `SELECT * FROM documents ORDER BY upload_date DESC`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        callback(err);
      } else {
        callback(null, rows);
      }
    });
  }

  // Find a document by CID
  static findByCid(cid, callback) {
    const sql = `SELECT * FROM documents WHERE cid = ?`;
    db.get(sql, [cid], (err, row) => {
      if (err) {
        callback(err);
      } else {
        callback(null, row);
      }
    });
  }

  // Delete a document by CID
  static deleteByCid(cid, callback) {
    const sql = `DELETE FROM documents WHERE cid = ?`;
    db.run(sql, [cid], function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { deleted: this.changes });
      }
    });
  }
}

module.exports = Document;
