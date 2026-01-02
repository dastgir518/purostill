import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import styles from './Checkout.module.css';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number; // Amount in major currency unit (e.g. 20.00)
    currency: string;
}

export default function PaymentModal({ isOpen, onClose, amount, currency }: PaymentModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && amount > 0) {
            // Create PaymentIntent as soon as the modal opens
            fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, currency }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret));
        }
    }, [isOpen, amount, currency]);

    if (!isOpen) return null;

    const options = {
        clientSecret: clientSecret || undefined,
        appearance: {
            theme: 'stripe' as const,
        },
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2 className={styles.title}>Secure Payment</h2>
                {clientSecret && (
                    <Elements options={options} stripe={getStripe()}>
                        <CheckoutForm amount={amount} currency={currency} />
                    </Elements>
                )}
            </div>
        </div>
    );
}
