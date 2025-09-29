"use client";

import { useState } from "react";
import Image from "next/image";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: (email: string) => void;
  uploadedImageUrl: string;
  isProcessing?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPayment,
  uploadedImageUrl,
  isProcessing = false
}: PaymentModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError("Email ist erforderlich");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Bitte gib eine gültige Email-Adresse ein");
      return;
    }

    setEmailError("");
    onPayment(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Transform bezahlen
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview Image */}
          <div className="mb-6 text-center">
            <div className="inline-block rounded-xl overflow-hidden shadow-lg mb-3">
              <Image
                src={uploadedImageUrl}
                alt="Dein Selfie"
                width={128}
                height={128}
                className="object-cover"
              />
            </div>
            <p className="text-sm text-gray-600">Dein hochgeladenes Selfie</p>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">20,00 €</div>
            <div className="text-sm text-gray-600">
              Einmalige Zahlung für 4 transformierte Bilder
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email-Adresse
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  emailError ? 'border-red-300' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="deine@email.de"
                disabled={isProcessing}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wird verarbeitet...
                </>
              ) : (
                "🚀 Jetzt bezahlen & transformieren"
              )}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Nach der Zahlung wird dein Bild sofort transformiert.</p>
            <p>Du erhältst eine E-Mail mit dem Ergebnis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}