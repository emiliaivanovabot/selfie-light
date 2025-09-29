"use client";

import { useState } from "react";
import Image from "next/image";
import PaymentModal from "../components/PaymentModal";

interface ProcessingResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export default function Home() {
  const [selectedSelfieFile, setSelectedSelfieFile] = useState<File | null>(null);
  const [uploadedSelfieUrl, setUploadedSelfieUrl] = useState<string | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);




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


  const handleTransformClick = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = async (email: string) => {
    if (!uploadedSelfieUrl) return;

    console.log('[DEBUG] Payment initiated by user:', { email, imageUrl: uploadedSelfieUrl, timestamp: new Date().toISOString() });

    // Speichere email und imageUrl im localStorage für die Success-Seite
    localStorage.setItem('paymentEmail', email);
    localStorage.setItem('paymentImageUrl', uploadedSelfieUrl);

    setIsProcessing(true);
    setError(null);

    try {
      // N8N Webhook call will go here
      const webhookResponse = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          imageUrl: uploadedSelfieUrl,
          action: "check_payment_and_process",
          successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/success?email=${encodeURIComponent(email)}&image=${encodeURIComponent(uploadedSelfieUrl)}`
        }),
      });

      const webhookData = await webhookResponse.json();

      if (!webhookResponse.ok) {
        throw new Error(webhookData.error || "Payment processing failed");
      }

      // If payment is required, redirect to Stripe
      if (webhookData.requiresPayment && webhookData.paymentUrl) {
        window.location.href = webhookData.paymentUrl;
        return;
      }

    } catch (err) {
      console.error("Payment processing error:", err);
      setError(err instanceof Error ? err.message : "Payment processing failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Selfie Verwandlung
          </h1>
          <p className="text-gray-500 text-sm">
            Erstelle magische Momente zusammen
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
                  <p className="text-gray-600">Hochladen...</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-600 mb-1">Wähle dein Selfie</p>
                  <p className="text-gray-400 text-sm">JPG, PNG bis zu 10MB</p>
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
              Anderes Bild wählen
            </button>
          </div>
        )}

        {/* Process Section */}
        {uploadedSelfieUrl && (
          <div className="text-center mb-8">
            <button
              onClick={handleTransformClick}
              disabled={isProcessing}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 min-w-[200px]"
            >
              {isProcessing ? "Magie wird erstellt..." : "✨ Verwandeln"}
            </button>
            {isProcessing && (
              <p className="text-gray-500 text-sm mt-3">Das dauert 15-20 Sekunden</p>
            )}
          </div>
        )}

        {/* Results Section */}
        {processedResult && processedResult.images && processedResult.images.length > 0 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Magical Transformations ✨</h2>

            {/* 4 Images Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
              {processedResult.images.map((image, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <Image
                    src={image.url}
                    alt={`Transformed selfie ${index + 1}`}
                    width={image.width || 320}
                    height={image.height || 400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Download All Button */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  processedResult.images.forEach((image, index) => {
                    const link = document.createElement('a');
                    link.href = image.url;
                    link.download = `magical-selfie-${index + 1}.jpg`;
                    link.click();
                  });
                }}
                className="block w-full max-w-md mx-auto bg-black text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                💾 Download All Images
              </button>
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

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPayment={handlePayment}
          uploadedImageUrl={uploadedSelfieUrl || ""}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
