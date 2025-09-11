'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  setToastContainer: (container: HTMLElement | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastContainer, setToastContainer] = useState<HTMLElement | null>(null);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-800';
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-times-circle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const toastMarkup = (
    <div className="fixed top-5 right-5 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center px-6 py-4 rounded-lg shadow-lg text-white mb-2 animate-slide-in-right ${getToastColor(toast.type)}`}
        >
          <i className={`${getToastIcon(toast.type)} mr-3`}></i>
          {toast.message}
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ addToast, setToastContainer }}>
      {children}
      {toastContainer ? createPortal(toastMarkup, toastContainer) : toastMarkup}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
