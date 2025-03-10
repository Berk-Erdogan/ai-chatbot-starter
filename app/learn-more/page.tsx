"use client";

import Link from "next/link";

export default function LearnMore() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Technology Behind Our AI</h1>
      <p className="text-lg text-gray-600 max-w-2xl text-center">
        Our onboard menu assistant leverages the power of 
        <strong> Google Gemini AI</strong> to analyze your uploaded menu and 
        provide insights into meal options, dietary preferences, and more.
        Our system ensures that you get accurate and helpful information about 
        the meals available on your flight.
      </p>
      <Link href="/">
        <button className="mt-6 px-6 py-2 bg-black text-white rounded-lg">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
