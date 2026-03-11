import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ isOpen, title, children, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-start justify-center py-6">
        <div
          ref={modalRef}
          className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl max-h-[calc(100vh-3rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-none items-center justify-between border-b border-slate-800/70 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            <button
              className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/40"
              onClick={onClose}
              type="button"
              aria-label="Close modal"
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          <div className="flex flex-none items-center justify-end gap-2 border-t border-slate-800/70 px-5 py-3">
            <button
              className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/40"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
