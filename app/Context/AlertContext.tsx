"use client";
import AlertModal from "@/components/AlertModal";
import { createContext, useContext, useState, ReactNode } from "react";


interface AlertState {
  show: boolean;
  message: string;
  success: boolean;
  confirmation: boolean;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, success: boolean) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({
    show: false,
    message: "",
    success: true,
    confirmation: false,
  });

  const showAlert = (message: string, success: boolean) => {
    setState({ show: true, message, success, confirmation: false });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setState({ show: true, message, success: true, confirmation: true, onConfirm });
  };

  const handleClose = () => {
    setState((prev) => ({ ...prev, show: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        show={state.show}
        message={state.message}
        success={state.success}
        confirmation={state.confirmation}
        onClose={handleClose}
        onConfirm={state.onConfirm}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}