import React from "react";
import Footer from "./Footer";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  hideFooter?: boolean;
}

export default function AppLayout({
  children,
  title,
  showBackButton = false,
  onBack,
  hideFooter = false,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <h1 className="text-xl font-bold text-center flex-1">
            {title || "🎉 꺄르륵 파티 🎉"}
          </h1>

          {showBackButton && <div className="w-10" />}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-md mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}
