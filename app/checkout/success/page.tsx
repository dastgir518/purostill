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
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'succeeded' | 'processing' | 'error'>('loading');

    useEffect(() => {
        console.log('SuccessPage Effect running');
        console.log('Params:', { paymentIntentClientSecret, orderId });

        // Case 1: Free Order (Redirected with order_id)
        if (orderId && !paymentIntentClientSecret) {
            console.log('Free order detected. Clearing cart.');
            const { getCartItems, clearCart } = require('@/lib/cart');
            const cartItems = getCartItems();

            // Send request to GA only if not already done
            if (status !== 'succeeded') {
                console.log('Sending GA event for free order.');
                sendGAEvent('event', 'purchase', {
                    transaction_id: orderId,
                    value: 0, // Free order
                    currency: 'GBP', // Default or fetch from somewhere
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
            return;
        }

        // Case 2: Stripe Payment (Redirected with payment_intent_client_secret)
        if (!paymentIntentClientSecret) {
            console.log('No payment intent found. Setting error status.');
            setStatus('error');
            return;
        }

        console.log('Stripe payment detected. Loading stripe...');
        getStripe().then((stripe) => {
            if (!stripe) return;

            stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({ paymentIntent }) => {
                console.log('Payment intent retrieved:', paymentIntent);
                if (!paymentIntent) {
                    setStatus('error');
                    return;
                }

                switch (paymentIntent.status) {
                    case 'succeeded':
                        const { getCartItems, clearCart } = require('@/lib/cart');
                        const cartItems = getCartItems();

                        // Send purchase event
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
    }, [paymentIntentClientSecret, orderId]);

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
                        Something went wrong or the order details are missing. Please contact support.
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
                <h1 className={styles.title}>Order Successful!</h1>
                <p className={styles.message}>
                    Thank you for your purchase. Your order has been placed successfully.
                </p>
                <Link href="/product-category" className={styles.button}>
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
