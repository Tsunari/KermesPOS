/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image, { ImageProps } from 'next/image';
import React from 'react';

interface CenteredImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  outerClassName?: string;
  innerClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  priority?: boolean;
  border?: boolean;
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

export default function CenteredImage({
  src,
  alt,
  outerClassName = 'flex justify-center items-center mt-6 w-full',
  innerClassName = 'flex justify-center items-center w-full',
  className = '',
  style,
  width,
  height,
  priority = true,
  border = true,
  ...imageProps
}: CenteredImageProps) {
  // fallback default if not provided
  const imgWidth = width ?? (imageProps as any).width ?? 600;
  const imgHeight = height ?? (imageProps as any).height ?? 800;
  const borderClass = border ? 'rounded-2xl shadow-lg outline-2 outline-black' : '';
  
  const isVideo = VIDEO_EXTENSIONS.some(ext => src?.toLowerCase().endsWith(ext));
  const hasCustomSize = width !== undefined || height !== undefined;

  return (
    <div className={outerClassName}>
      <div className={innerClassName}>
        {isVideo ? (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            controls
            className={`${borderClass} ${className} w-full max-w-[600px] h-auto`}
            style={{ ...style }}
          />
        ) : !hasCustomSize ? (
          <img
            src={src}
            alt={alt}
            className={`${borderClass} ${className} w-full max-w-[600px] h-auto object-contain`.trim()}
            style={{ display: 'block', ...style }}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={imgWidth}
            height={imgHeight}
            className={`${borderClass} ${className}`.trim()}
            style={{ maxWidth: '100%', height: 'auto', display: 'block', ...style }}
            priority={priority}
            {...imageProps}
          />
        )}
      </div>
    </div>
  );
}
