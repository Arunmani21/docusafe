const axios = require("axios");
const FormData = require("form-data");

// Your Pinata credentials
const PINATA_API_KEY = "d97e52d42da74d3c7745";
const PINATA_SECRET_API_KEY =
  "bff44fd08f4dd7e78ea48e2e0813ca7ff0deed99a92c0d0c9a88f00d1c709c7c";

class IPFSService {
  async addToIPFS(buffer, filename) {
    try {
      console.log("Uploading file to Pinata IPFS...", filename);

      // Create form data
      const formData = new FormData();
      formData.append("file", buffer, { filename: filename });

      // Pinata metadata (optional)
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedBy: "DocuSafe App",
          timestamp: Date.now().toString(),
        },
      });
      formData.append("pinataMetadata", metadata);

      // Pinata options (optional)
      const pinataOptions = JSON.stringify({
        cidVersion: 0,
        wrapWithDirectory: false,
      });
      formData.append("pinataOptions", pinataOptions);

      // Upload to Pinata
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );

      const result = response.data;
      console.log("File uploaded to Pinata successfully!");
      console.log("IPFS Hash (CID):", result.IpfsHash);
      console.log("Pin Size:", result.PinSize);

      return {
        cid: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
      };
    } catch (error) {
      console.error(
        "Pinata upload failed:",
        error.response?.data || error.message
      );
      throw new Error(
        `Pinata upload failed: ${
          error.response?.data?.error?.details || error.message
        }`
      );
    }
  }

  async getFromIPFS(cid) {
    try {
      console.log("Fetching content from IPFS for CID:", cid);

      // You can use any public IPFS gateway
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}`,
      ];

      // Try each gateway until one works
      for (const gatewayUrl of gateways) {
        try {
          const response = await axios.get(gatewayUrl, {
            responseType: "arraybuffer",
            timeout: 10000,
          });

          console.log("Content fetched successfully from:", gatewayUrl);
          console.log("Content size:", response.data.length);

          return Buffer.from(response.data, "binary");
        } catch (gatewayError) {
          console.log(`Gateway ${gatewayUrl} failed, trying next...`);
          continue;
        }
      }

      throw new Error("All IPFS gateways failed");
    } catch (error) {
      console.error("IPFS retrieval failed:", error.message);
      throw new Error(`IPFS retrieval failed: ${error.message}`);
    }
  }

  // Optional: Check if a file is pinned on Pinata
  async checkPinStatus(cid) {
    try {
      const response = await axios.get(
        `https://api.pinata.cloud/data/pinList?hashContains=${cid}`,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error checking pin status:", error);
      return null;
    }
  }

  // Optional: Unpin from Pinata (when deleting documents)
  async unpinFromIPFS(cid) {
    try {
      const response = await axios.delete(
        `https://api.pinata.cloud/pinning/unpin/${cid}`,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );

      console.log("Unpinned from Pinata:", cid);
      return response.data;
    } catch (error) {
      console.error("Error unpinning from Pinata:", error);
      throw new Error(
        `Unpin failed: ${error.response?.data?.error?.details || error.message}`
      );
    }
  }
}

module.exports = new IPFSService();
