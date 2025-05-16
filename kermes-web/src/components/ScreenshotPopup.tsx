"use client";

import { useState, ReactNode } from "react";
import Image from "next/image";

interface ScreenshotPopupProps {
  thumbnailSrc?: string;
  fullImageSrc: string;
  altText: string;
  customThumbnail?: ReactNode;
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export default function ScreenshotPopup({
  thumbnailSrc,
  fullImageSrc,
  altText,
  customThumbnail,
  imageClassName = "",
  imageWidth,
  imageHeight,
}: ScreenshotPopupProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!customThumbnail && !thumbnailSrc) {
    throw new Error("Either 'thumbnailSrc' or 'customThumbnail' must be provided.");
  }

  return (
    <div>
      {/* Thumbnail */}
      {customThumbnail ? (
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          {customThumbnail}
        </div>
      ) : (
        <div
          className="w-72 h-44 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-inner flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={thumbnailSrc!}
            alt={altText}
            width={288}
            height={176}
            className="object-cover w-full h-full"
            priority
          />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <Image
              src={fullImageSrc}
              alt={altText}
              width={imageWidth ? imageWidth : 1400}
              height={imageHeight ? imageHeight : 1000}
              className={`rounded-lg ${imageClassName}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
