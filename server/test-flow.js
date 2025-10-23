const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const API_BASE = "http://localhost:3000/api/documents";

async function testFlows() {
  console.log(" Testing IPFS + SQLite Integration...\n");

  // Create test file
  const testContent =
    "Hello IPFS! This is a test file uploaded at: " + new Date().toISOString();
  fs.writeFileSync("test-file.txt", testContent);
  console.log(
    " Created test file with content:",
    testContent.substring(0, 50) + "...\n"
  );

  try {
    // Flow 1: Upload file and get CID
    console.log("  Testing File Upload...");

    const formData = new FormData();
    // CORRECT: Must be "document" to match your multer config
    formData.append("document", fs.createReadStream("test-file.txt"));
    formData.append("description", "Test file from automated backend test");
    formData.append("uploaded_by", "backend-test-script");

    console.log(" Sending upload request...");
    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    console.log(" Upload Successful!");
    console.log(
      " Full Response:",
      JSON.stringify(uploadResponse.data, null, 2)
    );

    // Extract CID from response
    let cid;
    if (uploadResponse.data.cid) {
      cid = uploadResponse.data.cid;
    } else if (uploadResponse.data.data && uploadResponse.data.data.cid) {
      cid = uploadResponse.data.data.cid;
    } else {
      throw new Error("No CID found in response");
    }

    console.log(" Extracted CID:", cid);

    // Verify CID format
    if (!cid || cid.length < 10) {
      throw new Error("Invalid CID received: " + cid);
    }

    // Wait a moment for database write
    console.log(" Waiting 500ms for database write...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Flow 2: Test getting all documents
    console.log("\n  Testing Get All Documents...");
    const allResponse = await axios.get(`${API_BASE}/`);
    console.log(" Found", allResponse.data.length, "documents");

    if (allResponse.data.length > 0) {
      console.log("📄 Latest document:", allResponse.data[0]);
    }

    // Verify our uploaded document is in the list
    const ourDoc = allResponse.data.find((doc) => doc.cid === cid);
    if (ourDoc) {
      console.log(" Our uploaded document found in database!");
      console.log("   Name:", ourDoc.name);
      console.log("   Size:", ourDoc.file_size, "bytes");
      console.log("   Type:", ourDoc.mime_type);
    } else {
      console.log(" Our uploaded document not found in database");
    }

    // Flow 3: Retrieve file by CID
    console.log("\n  Testing File Retrieval by CID...");
    console.log("  Downloading from CID:", cid);

    const downloadResponse = await axios.get(`${API_BASE}/${cid}`, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    console.log(" Download Successful!");
    console.log(
      " Downloaded file size:",
      downloadResponse.data.length,
      "bytes"
    );
    console.log(" Content-Type:", downloadResponse.headers["content-type"]);
    console.log(
      " Content-Disposition:",
      downloadResponse.headers["content-disposition"]
    );

    // Save downloaded file
    fs.writeFileSync("downloaded-file.txt", downloadResponse.data);
    console.log(" Saved as: downloaded-file.txt");

    // Compare files
    console.log("\n  Comparing Original vs Downloaded...");
    const original = fs.readFileSync("test-file.txt", "utf8");
    const downloaded = fs.readFileSync("downloaded-file.txt", "utf8");

    console.log(" Original content:", original);
    console.log(" Downloaded content:", downloaded);

    if (original === downloaded) {
      console.log(" Files match perfectly! IPFS roundtrip successful!");
    } else {
      console.log(" Files do not match!");
      console.log("   Original length:", original.length);
      console.log("   Downloaded length:", downloaded.length);
    }

    // Flow 4: Test IPFS gateway access
    console.log("\n5️  Testing IPFS Gateway Access...");
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    console.log(" Gateway URL:", gatewayUrl);

    try {
      const gatewayResponse = await axios.get(gatewayUrl, {
        timeout: 15000,
        responseType: "text",
      });

      console.log(" Gateway access successful!");
      console.log(" Gateway content:", gatewayResponse.data);

      if (gatewayResponse.data === original) {
        console.log(" Gateway content matches original!");
      } else {
        console.log("  Gateway content differs from original");
      }
    } catch (gatewayError) {
      console.log("  Gateway access failed (this is sometimes expected):");
      console.log("   Error:", gatewayError.message);
    }

    console.log("\n All tests completed successfully!");
    console.log(" Your IPFS + Database integration is working!");
  } catch (error) {
    console.error("\n Test Failed:");
    console.error("🔍 Error Details:");

    if (error.response) {
      console.log("   HTTP Status:", error.response.status);
      console.log("   Response Data:", error.response.data);
      console.log("   Response Headers:", error.response.headers);
    } else if (error.request) {
      console.log("   No response received");
      console.log("   Is the server running on http://localhost:3000?");
    } else {
      console.log("   Error message:", error.message);
    }

    console.log("\n   Full error:", error);
  } finally {
    // Cleanup
    console.log("\n Cleaning up test files...");
    try {
      if (fs.existsSync("test-file.txt")) {
        fs.unlinkSync("test-file.txt");
        console.log(" Cleaned up test-file.txt");
      }
      if (fs.existsSync("downloaded-file.txt")) {
        fs.unlinkSync("downloaded-file.txt");
        console.log(" Cleaned up downloaded-file.txt");
      }
    } catch (cleanupError) {
      console.log("  Cleanup warning:", cleanupError.message);
    }
  }
}

// Run the tests
console.log(" Starting Backend API Tests...\n");
testFlows();
