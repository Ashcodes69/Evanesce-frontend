"use client";
import { FaCheck } from "react-icons/fa6";
import { IoCloseSharp } from "react-icons/io5";
import { MdQuestionMark } from "react-icons/md";

interface AlertModalProps {
  show: boolean;
  message: string;
  success: boolean;
  confirmation?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function AlertModal({
  show,
  message,
  success,
  confirmation,
  onClose,
  onConfirm,
}: AlertModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-black border border-white/20 rounded-2xl shadow-xl p-6 w-72 sm:w-96 text-center">
        {confirmation ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-500/20 mb-3">
              <MdQuestionMark className="text-yellow-400 text-3xl" />
            </div>
            <p className="text-lg font-semibold text-white mb-4 whitespace-pre-line">
              {message}
            </p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-700/20 mb-3">
              <FaCheck className="text-green-500 text-3xl" />
            </div>
            <p className="text-lg font-semibold text-white mb-4 whitespace-pre-line">
              {message}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-700/20 mb-3">
              <IoCloseSharp className="text-red-500 text-3xl" />
            </div>
            <p className="text-lg font-semibold text-white mb-4 whitespace-pre-line">
              {message}
            </p>
          </div>
        )}

        {confirmation ? (
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full transition"
            >
              cancel
            </button>
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-full transition"
            >
              confirm
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-full transition"
          >
            ok
          </button>
        )}
      </div>
    </div>
  );
}