'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';
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
                        const { getCartItems, clearCart } = require('@/lib/cart');
                        const cartItems = getCartItems();

                        // Send purchase event
                        // Only send if we haven't already (simple check to prevent double counting on re-renders, 
                        // though strict mode might still fire twice in dev, usually fine in prod)
                        if (status !== 'succeeded') {
                            sendGAEvent('event', 'purchase', {
                                transaction_id: paymentIntent.id,
                                value: paymentIntent.amount / 100,
                                currency: paymentIntent.currency.toUpperCase(),
                                items: cartItems.map((item: any) => ({
                                    item_id: item.id,
                                    item_name: item.name,
                                    price: parseFloat(item.price || '0'),
                                    quantity: item.quantity
                                }))
                            });
                            clearCart();
                        }

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
