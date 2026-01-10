import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    ExpressCheckoutElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';
import styles from './Checkout.module.css';

interface InlineCheckoutProps {
    amount: number;
    currency: string;
}

const ExpressCheckoutWrapper = ({ amount, currency }: { amount: number, currency: string }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const onConfirm = async (event: any) => {
        if (!stripe || !elements) {
            return;
        }

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message || 'Submission failed');
            return;
        }

        // Create the PaymentIntent
        const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
        });

        const { clientSecret } = await res.json();

        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'Payment failed');
        }
    };

    return (
        <div className={styles.expressContainer}>
            {errorMessage && <div className={styles.message}>{errorMessage}</div>}
            <ExpressCheckoutElement
                onConfirm={onConfirm}
                onReady={({ availablePaymentMethods }) => {
                    console.log('Express Checkout Ready. Available methods:', availablePaymentMethods);
                    if (availablePaymentMethods && !availablePaymentMethods.google_pay) {
                        console.warn('Google Pay not available. Reason: Browser support or HTTPS check failed?');
                    }
                }}
            />
        </div>
    );
};

export default function InlineCheckout({ amount, currency }: InlineCheckoutProps) {
    // Convert basic currency to lowercase for Stripe
    const stripeCurrency = currency.toLowerCase();

    // Amount for Elements must be integer (e.g., cents/pence)? 
    // Actually, for mode: 'payment', amount is in integers in the smallest currency unit.
    // Our prop 'amount' is passed as e.g. 20.00 from parent?
    // Let's assume parent passes major units (e.g. 20.00). 
    // Stripe Elements 'amount' prop expects integer (lowest denomination) usually.
    // Wait, Elements options `amount` and `currency` are required for `mode: 'payment'`.
    // And yes, it expects standard smallest unit (e.g. 2000 for $20.00).
    const amountInSmallestUnit = Math.round(amount * 100);

    const options = {
        mode: 'payment' as const,
        amount: amountInSmallestUnit,
        currency: stripeCurrency,
        appearance: {
            theme: 'stripe' as const,
        },
    };

    return (
        <div className={styles.inlineCheckoutWrapper}>
            <Elements stripe={getStripe()} options={options}>
                <ExpressCheckoutWrapper amount={amount} currency={currency} />
            </Elements>
        </div>
    );
}
