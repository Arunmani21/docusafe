"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";
import { toast } from "sonner";

type FileStatus = "pending" | "uploading" | "success" | "error";

interface FileWithProgress extends File {
  progress: number;
  status: FileStatus;
}

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) =>
        Object.assign(file, {
          progress: 0,
          status: "pending" as FileStatus,
        })
      ),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024,
  });

  const handleRemoveFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "uploading" } : f
          )
        );

        await uploadFile(file, (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setFiles((prev) =>
              prev.map((f) => (f.name === file.name ? { ...f, progress } : f))
            );
          }
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "success", progress: 100 }
              : f
          )
        );

        toast.success(`File "${file.name}" uploaded successfully!`);
      } catch (error: any) {
        console.error("Error uploading file:", file.name, error);

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "error" } : f
          )
        );

        toast.error(
          `Failed to upload "${file.name}": ${
            error.response?.data?.error || error.message
          }`
        );
      }
    }

    setUploading(false);
    onUploadSuccess();

    setTimeout(() => {
      setFiles([]);
    }, 2000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-gray-700 dark:text-gray-200 text-2xl font-bold">
          Upload Documents
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Drag and drop your files here or click to select them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400" />
          {isDragActive ? (
            <p className="mt-2 text-blue-600 dark:text-blue-300">
              Drop the files here ...
            </p>
          ) : (
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Selected Files:
            </h3>
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-800 dark:text-gray-100">
                    {file.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === "uploading" && (
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={file.progress}
                        className="w-24 h-2 bg-gray-200 dark:bg-gray-600"
                      />
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {file.progress}%
                      </span>
                    </div>
                  )}
                  {file.status === "success" && (
                    <span className="text-green-500 text-sm">✅ Uploaded</span>
                  )}
                  {file.status === "error" && (
                    <span className="text-red-500 text-sm">❌ Error</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(file.name)}
                    disabled={file.status === "uploading"}
                  >
                    <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </span>
              ) : (
                "Upload All"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
