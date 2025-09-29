"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get('email');
  const imageUrl = searchParams.get('image');

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // USE REF INSTEAD OF STATE - verhindert Re-Renders
  const hasStartedRef = useRef(false);

  const FIXED_REFERENCE_IMAGE = "/reference-woman.jpg";
  const TOTAL_IMAGES = 4;

  useEffect(() => {
    // Verhindere mehrfache Ausführung mit REF
    if (hasStartedRef.current) return;

    if (!email || !imageUrl) {
      setError("Missing required information");
      setIsGenerating(false);
      return;
    }

    // Check if session_id exists in URL params (coming from Stripe success)
    const sessionId = searchParams.get('session_id');

    // If no session_id and no localStorage data, redirect to home
    const storedEmail = localStorage.getItem('paymentEmail');
    const storedImage = localStorage.getItem('paymentImageUrl');

    if (!sessionId && !storedEmail && !storedImage) {
      setError("Unauthorized access. Please complete payment first.");
      setIsGenerating(false);
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    // Markiere als gestartet
    hasStartedRef.current = true;

    // Lösche localStorage nach Start (einmalige Nutzung)
    localStorage.removeItem('paymentEmail');
    localStorage.removeItem('paymentImageUrl');

    // Starte Bildgenerierung
    startImageGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, imageUrl]);

  // Progress Timer - 15 Sekunden pro Bild
  useEffect(() => {
    if (!isGenerating || currentImageIndex >= TOTAL_IMAGES) return;

    setProgress(0);
    const startTime = Date.now();
    const duration = 15000; // 15 seconds

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(timer);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(timer);
  }, [isGenerating, currentImageIndex]);

  const startImageGeneration = async () => {
    if (!imageUrl || !email) return;

    try {
      const images: GeneratedImage[] = [];

      // Hole 4 random Szenen
      const scenesResponse = await fetch("/api/scenes");
      const { scenes } = await scenesResponse.json();

      console.log("Selected random scenes:", scenes);

      // Generiere 4 Bilder nacheinander mit VERSCHIEDENEN Prompts
      for (let i = 0; i < TOTAL_IMAGES; i++) {
        setCurrentImageIndex(i + 1);

        const response = await fetch("/api/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selfieUrl: imageUrl,
            referenceUrl: FIXED_REFERENCE_IMAGE,
            promptIndex: i, // Nutze spezifischen Prompt pro Bild (0,1,2,3)
            selectedScenes: scenes, // Pass die 4 random Szenen
            email: email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Image generation failed");
        }

        if (data.result && data.result.images && data.result.images.length > 0) {
          // Füge das generierte Bild hinzu
          const newImage = data.result.images[0];
          images.push(newImage);
          setGeneratedImages([...images]);
        }
      }

      setIsGenerating(false);
      setCurrentImageIndex(TOTAL_IMAGES);

    } catch (err) {
      console.error("Image generation error:", err);
      setError(err instanceof Error ? err.message : "Image generation failed");
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Fehler</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  // Progress Ring Component
  const ProgressRing = ({ progress: ringProgress, size = 120 }: { progress: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (ringProgress / 100) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8b5cf6"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-8 max-w-5xl w-full shadow-lg">

        {/* Header with Upload Preview */}
        <div className="text-center mb-8">
          {imageUrl && (
            <div className="mb-4">
              <div className="inline-block rounded-xl overflow-hidden shadow-lg border-4 border-purple-200">
                <Image
                  src={imageUrl}
                  alt="Dein hochgeladenes Selfie"
                  width={100}
                  height={100}
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Dein Selfie</p>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {isGenerating ? "✨ Deine Bilder werden erstellt..." : "🎉 Fertig!"}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {isGenerating
              ? `Bild ${currentImageIndex} von ${TOTAL_IMAGES} wird generiert`
              : `Alle ${TOTAL_IMAGES} Bilder sind bereit`}
          </p>
        </div>

        {/* 4 Slots - Responsive: 2x2 auf Mobile, 4 nebeneinander auf Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {Array.from({ length: TOTAL_IMAGES }).map((_, index) => {
            const hasImage = generatedImages[index];
            const isActive = isGenerating && currentImageIndex === index + 1;
            const isPending = index + 1 > currentImageIndex && isGenerating;
            const isComplete = generatedImages[index];

            return (
              <div
                key={index}
                className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg relative bg-gray-100"
              >
                {/* Completed Image */}
                {isComplete && (
                  <Image
                    src={generatedImages[index].url}
                    alt={`Generiertes Bild ${index + 1}`}
                    width={generatedImages[index].width || 320}
                    height={generatedImages[index].height || 400}
                    className="w-full h-full object-cover animate-fadeIn"
                  />
                )}

                {/* Active - Generating with Progress Ring */}
                {isActive && !hasImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                    <div className="relative">
                      <ProgressRing progress={progress} size={80} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 font-medium">Wird erstellt...</p>
                  </div>
                )}

                {/* Pending - Waiting */}
                {isPending && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">{index + 1}</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">Wartet...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Download & Nochmal Button */}
        {!isGenerating && generatedImages.length === TOTAL_IMAGES && (
          <div className="space-y-3">
            <button
              onClick={async () => {
                for (let i = 0; i < generatedImages.length; i++) {
                  const image = generatedImages[i];
                  try {
                    const response = await fetch(image.url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `magical-selfie-${i + 1}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    // Small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 500));
                  } catch (error) {
                    console.error(`Failed to download image ${i + 1}:`, error);
                  }
                }
              }}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Alle Bilder herunterladen
            </button>
            <button
              onClick={() => {
                // Clear all session data before going back
                localStorage.removeItem('paymentEmail');
                localStorage.removeItem('paymentImageUrl');
                router.push('/');
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Nochmal?
            </button>
          </div>
        )}

      </div>
    </div>
  );
}