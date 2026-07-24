/**
 * Modal Component
 *
 * Props:
 * - isOpen
 * - title
 * - children
 * - onClose
 */

import React from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-stone-100 p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-gray-500 transition hover:bg-gray-200 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            X
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
