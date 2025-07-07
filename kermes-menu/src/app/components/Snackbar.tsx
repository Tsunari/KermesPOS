"use client";
import React, { useEffect, ReactNode } from 'react';

interface SnackbarProps {
  open: boolean;
  text: string;
  onClose?: () => void;
  duration?: number;
  icon?: ReactNode;
}

export default function Snackbar({ open, text, onClose, duration = 2000, icon }: SnackbarProps) {
  useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black text-white px-6 py-3 rounded-full shadow-lg text-base font-semibold flex items-center gap-2 animate-fadeIn">
        <span>{text}</span>
        {icon}
      </div>
    </div>
  );
}
