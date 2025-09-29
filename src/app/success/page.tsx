"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');
  const email = searchParams.get('email');
  const imageUrl = searchParams.get('image');

  const [countdown, setCountdown] = useState(30);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session ID");
      return;
    }

    // Verify payment and start countdown
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      // Simulate verification
      setTimeout(() => {
        setVerifying(false);
        startCountdown();
      }, 1000);
    } catch {
      setError("Payment verification failed");
      setVerifying(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect zur Results-Seite mit email und imageUrl
          const effectiveEmail = email || localStorage.getItem('paymentEmail');
          const effectiveImageUrl = imageUrl || localStorage.getItem('paymentImageUrl');
          router.push(`/results?email=${encodeURIComponent(effectiveEmail || '')}&image=${encodeURIComponent(effectiveImageUrl || '')}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Zahlungsfehler</h1>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        {verifying ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Zahlung wird überprüft...</h1>
            <p className="text-gray-600">Bitte warten, während wir deine Zahlung bestätigen.</p>
          </>
        ) : (
          <>
            {/* Success Animation */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung erfolgreich! 🎉</h1>
            <p className="text-gray-600 mb-6">Deine Verwandlung beginnt gleich.</p>

            {/* Preview Section */}
            {imageUrl && (
              <div className="mb-6">
                <div className="inline-block rounded-xl overflow-hidden shadow-lg mb-3">
                  <Image
                    src={imageUrl}
                    alt="Your Selfie"
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600">Dein hochgeladenes Selfie</p>
              </div>
            )}

            {/* Processing Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">🪄 Was passiert jetzt?</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✨ 4 magische Bilder werden erstellt</p>
                <p>⏱️ Verarbeitung dauert ~60 Sekunden insgesamt</p>
                <p>📧 Gesendet an {email || 'deine E-Mail'}</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="border-t pt-4">
              <p className="text-gray-600 mb-2">Start in</p>
              <div className="text-3xl font-bold text-blue-600 mb-2">{countdown}</div>
              <p className="text-sm text-gray-500">Sekunden...</p>
            </div>

            {/* Manual Continue Button */}
            <button
              onClick={() => {
                const effectiveEmail = email || localStorage.getItem('paymentEmail');
                const effectiveImageUrl = imageUrl || localStorage.getItem('paymentImageUrl');
                router.push(`/results?email=${encodeURIComponent(effectiveEmail || '')}&image=${encodeURIComponent(effectiveImageUrl || '')}`);
              }}
              className="w-full mt-4 bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-all duration-200"
            >
              Zu deinen Bildern →
            </button>
          </>
        )}
      </div>
    </div>
  );
}