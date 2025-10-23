"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileText } from "lucide-react";
import { listDocuments, downloadFile } from "@/lib/api";
import { toast } from "sonner";

interface Document {
  id: number;
  name: string;
  description: string;
  cid: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  uploaded_by: string;
}

interface DocumentListProps {
  refresh: boolean;
}

export function DocumentList({ refresh }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await listDocuments();
      console.log("📄 Documents from backend:", response.data); // Debug log
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refresh]);

  const handleDownload = async (document: Document) => {
    try {
      const response = await downloadFile(document.cid);

      // Create blob and download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", document.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${document.name}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleCopyCID = (cid: string) => {
    navigator.clipboard.writeText(cid);
    toast.success("CID copied to clipboard!");
  };

  // Format file size properly
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date properly
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-gray-700 dark:text-gray-200">
          Your Documents
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {documents.length} document(s) stored on IPFS
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {doc.name}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>
                        <strong>CID:</strong> {doc.cid}
                      </p>
                      <p>
                        <strong>Size:</strong> {formatFileSize(doc.file_size)}
                      </p>
                      <p>
                        <strong>Uploaded:</strong> {formatDate(doc.upload_date)}
                      </p>
                      {doc.description && (
                        <p>
                          <strong>Description:</strong> {doc.description}
                        </p>
                      )}
                      {doc.uploaded_by && (
                        <p>
                          <strong>By:</strong> {doc.uploaded_by}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCID(doc.cid)}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy CID
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
