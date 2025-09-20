"use client";

import { useState } from "react";
import Image from "next/image";

interface ProcessingResult {
  image: {
    url: string;
    width: number;
    height: number;
  };
}

export default function Home() {
  const [selectedSelfieFile, setSelectedSelfieFile] = useState<File | null>(null);
  const [uploadedSelfieUrl, setUploadedSelfieUrl] = useState<string | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);

  // Fixed reference image
  const FIXED_REFERENCE_IMAGE = "/reference-woman.jpg";
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelfieSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedSelfieFile(file);
      setError(null);
      setProcessedResult(null);

      // Auto-upload immediately
      await handleSelfieUpload(file);
    }
  };


  const handleSelfieUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedSelfieFile;
    if (!file) return;

    setIsUploadingSelfie(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedSelfieUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingSelfie(false);
    }
  };


  const handleProcess = async () => {
    if (!uploadedSelfieUrl) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selfieUrl: uploadedSelfieUrl,
          referenceUrl: FIXED_REFERENCE_IMAGE,
          prompt: "Using two reference photos (person A, person B), create a selfie style image where both are smiling and standing close together. Lighting: soft golden hour sunlight, warm tones. Background: beach at sunset with gentle waves. Both are looking at the camera. Maintain facial features, skin tone, hairstyle from the reference photos. High detail, photorealistic, slight depth of field, vertical format (9:16).",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      setProcessedResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Selfie Transform
          </h1>
          <p className="text-gray-500 text-sm">
            Create magical moments together
          </p>
        </div>

        {/* Upload Section */}
        {!uploadedSelfieUrl ? (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleSelfieSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              {isUploadingSelfie ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-600 mb-1">Choose your selfie</p>
                  <p className="text-gray-400 text-sm">JPG, PNG up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div className="text-center mb-8">
            <div className="inline-block rounded-xl overflow-hidden shadow-lg mb-4">
              <Image
                src={uploadedSelfieUrl}
                alt="Your selfie"
                width={280}
                height={280}
                className="object-cover"
              />
            </div>
            <button
              onClick={() => {
                setUploadedSelfieUrl(null);
                setSelectedSelfieFile(null);
                setProcessedResult(null);
              }}
              className="text-gray-500 text-sm hover:text-gray-700 underline"
            >
              Choose different image
            </button>
          </div>
        )}

        {/* Process Section */}
        {uploadedSelfieUrl && (
          <div className="text-center mb-8">
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px]"
            >
              {isProcessing ? "Creating magic..." : "✨ Transform"}
            </button>
            {isProcessing && (
              <p className="text-gray-500 text-sm mt-3">This takes 15-20 seconds</p>
            )}
          </div>
        )}

        {/* Results Section */}
        {processedResult && (
          <div className="text-center">
            <div className="inline-block rounded-xl overflow-hidden shadow-xl mb-6">
              <Image
                src={processedResult.images[0].url}
                alt="Transformed selfie"
                width={processedResult.images[0].width || 320}
                height={processedResult.images[0].height || 400}
                className="max-w-full h-auto"
              />
            </div>
            <div className="space-y-3">
              <a
                href={processedResult.images[0].url}
                download="magical-selfie.jpg"
                className="block bg-black text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                💾 Save Image
              </a>
              <button
                onClick={() => {
                  setProcessedResult(null);
                  setUploadedSelfieUrl(null);
                  setSelectedSelfieFile(null);
                }}
                className="block w-full text-gray-500 text-sm hover:text-gray-700 underline"
              >
                Create another
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
