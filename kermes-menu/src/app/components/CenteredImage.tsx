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

export default function CenteredImage({
  src,
  alt,
  outerClassName = 'flex justify-center items-center mt-15 w-full',
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
  return (
    <div className={outerClassName}>
      <div className={innerClassName}>
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
      </div>
    </div>
  );
}
