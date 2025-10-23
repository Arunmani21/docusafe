"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { DocumentList, type Document } from "@/components/document-list";
import { listDocuments } from "@/lib/api";
import { toast } from "sonner";

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      console.log("Fetching documents...");
      const response = await listDocuments();
      setDocuments(response.data);
      console.log(`Loaded ${response.data.length} documents`);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error(
        "Failed to load documents. Check if backend is running on http://localhost:3000"
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSuccess = async () => {
    console.log("Upload successful! Waiting 500ms before refreshing...");
    toast.success("File uploaded successfully!");

    // Wait for database write to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    await fetchDocuments();
  };

  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    toast.info("CID copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-docusafe-blue-50 dark:bg-docusafe-blue-900 text-docusafe-blue-900 dark:text-docusafe-blue-50">
      <header className="bg-docusafe-700 dark:bg-docusafe-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DocuSafe</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a
                  href="#"
                  className="hover:text-docusafe-blue-200 dark:hover:text-docusafe-purple-200"
                >
                  Upload
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-docusafe-blue-200 dark:hover:text-docusafe-purple-200"
                >
                  Documents
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 mt-8 space-y-8">
        <Card className="bg-white dark:bg-docusafe-blue-800 shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-docusafe-blue-700 dark:text-docusafe-purple-300 text-3xl font-bold">
              Welcome to DocuSafe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-docusafe-blue-800 dark:text-docusafe-blue-200">
              Your secure and decentralized document management system powered
              by IPFS. Upload, store, and share your files with confidence.
            </p>
          </CardContent>
        </Card>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        <DocumentList
          documents={documents}
          onCopyCid={handleCopyCid}
          loading={loadingDocuments}
        />
      </main>
    </div>
  );
}
