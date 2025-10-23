import axios from "axios"

const API_BASE_URL = "http://localhost:3000/api/documents"

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
})

// Add debugging interceptors
api.interceptors.request.use((config) => {
  console.log('🔵 Making API request to:', config.url);
  console.log('🔵 Full URL:', `${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API response received');
    return response;
  },
  (error) => {
    console.error('❌ API error:', error);
    
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network error - Possible causes:');
      console.error('   1. Backend server not running on port 3000');
      console.error('   2. CORS configuration issue');
      console.error('   3. Port conflict');
      console.error('   → Check: http://localhost:3000/');
    }
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export const uploadFile = async (file: File, onUploadProgress?: (progressEvent: any) => void) => {
  const formData = new FormData()
  formData.append("document", file)
  formData.append("description", "Uploaded from frontend")

  try {
    console.log('📤 Uploading file:', file.name);
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
      timeout: 60000,
    });
    console.log('✅ Upload successful');
    return response;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

export const listDocuments = async () => {
  try {
    console.log('📋 Fetching documents list...');
    const response = await api.get("/");
    console.log('✅ Documents fetched:', response.data.length, 'documents');
    return response;
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    throw error;
  }
}

export const downloadFile = async (cid: string) => {
  try {
    console.log('⬇️  Downloading file with CID:', cid);
    const response = await api.get(`/${cid}`, {
      responseType: "blob",
    });
    console.log('✅ Download successful');
    return response;
  } catch (error) {
    console.error('❌ Download failed:', error);
    throw error;
  }
}