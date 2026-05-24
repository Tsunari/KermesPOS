"use client";

import React from 'react';

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({ message = "İçerik Yükleniyor..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 w-full">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/20 blur-md animate-pulse"></div>
        
        {/* Inner spinning gradient ring */}
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin shadow-inner"></div>
        
        {/* Small center dot */}
        <div className="absolute w-3 h-3 rounded-full bg-blue-600 animate-ping"></div>
      </div>
      
      {/* Loading message */}
      <p className="mt-6 text-sm font-semibold text-gray-500 tracking-wider animate-pulse uppercase">
        {message}
      </p>
    </div>
  );
}
