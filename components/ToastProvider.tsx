'use client';

import { useState, useEffect } from 'react';
import { Toast, setToastCallback } from './Toast';

export default function ToastProvider() {
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set the callback for showing toasts
    setToastCallback((message: string) => {
      setToastMessage(message);
      setIsVisible(true);
    });

    // Listen for toast events
    const handleShowToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.message) {
        setToastMessage(customEvent.detail.message);
        setIsVisible(true);
      }
    };

    window.addEventListener('showToast', handleShowToast);

    return () => {
      window.removeEventListener('showToast', handleShowToast);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  return <Toast message={toastMessage} isVisible={isVisible} onClose={handleClose} />;
}

