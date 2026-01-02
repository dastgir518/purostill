'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import getStripe from '@/lib/stripe';
import styles from './success.module.css';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const [status, setStatus] = useState<'loading' | 'succeeded' | 'processing' | 'error'>('loading');

    useEffect(() => {
        if (!paymentIntentClientSecret) {
            setStatus('error');
            return;
        }

        getStripe().then((stripe) => {
            if (!stripe) return;

            stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({ paymentIntent }) => {
                if (!paymentIntent) {
                    setStatus('error');
                    return;
                }

                switch (paymentIntent.status) {
                    case 'succeeded':
                        setStatus('succeeded');
                        break;
                    case 'processing':
                        setStatus('processing');
                        break;
                    case 'requires_payment_method':
                        setStatus('error');
                        break;
                    default:
                        setStatus('error');
                        break;
                }
            });
        });
    }, [paymentIntentClientSecret]);

    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.message}>Loading payment details...</div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.errorIconWrapper}`}>✕</div>
                    <h1 className={styles.title}>Payment Failed</h1>
                    <p className={styles.message}>
                        Something went wrong with your payment. Please try again or contact support.
                    </p>
                    <Link href="/" className={styles.button}>
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>✓</div>
                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.message}>
                    Thank you for your purchase. Your payment has been processed successfully.
                </p>
                <Link href="/product-category" className={styles.button}>
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
