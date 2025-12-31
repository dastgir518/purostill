'use client';

import { useState } from 'react';
import { showToast } from '@/components/Toast';
import styles from './page.module.css';

const useCases = [
    'Questions about our water purification systems, filters and accessories',
    'Help choosing the right solution for your home or business',
    'Support with orders, deliveries or returns',
    'Product setup, maintenance or replacement filter advice',
    'General questions about water quality and testing',
];

export default function ContactPageClient() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        query: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const WOOCOMMERCE_URL =
                process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

            const response = await fetch(`${WOOCOMMERCE_URL}/wp-json/custom/v1/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Failed to send message');
            }

            // Success
            showToast(result.message || 'Thank you for your message. We will get back to you soon!');

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                query: '',
            });
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send message. Please try again later.';
            setError(errorMessage);
            showToast(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(''); // Clear error when user types
    };

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <section className={styles.hero}>
                    <div>
                        <p>Contact PurOstill</p>
                        <h1>We&apos;re here to help.</h1>
                        <p>
                            Whether you&apos;re just starting your search for better water, comparing systems, or need support with an existing order, the PurOstill team is ready to assist.
                        </p>
                        <p>
                            Please share your details and a brief description of your query, and we&apos;ll get back to you promptly.
                        </p>
                    </div>
                </section>

                <section className={styles.contactLayout}>
                    <div className={styles.useCasesCard}>
                        <h2>You can use this form for:</h2>
                        <ul className={styles.useCasesList}>
                            {useCases.map((useCase, index) => (
                                <li key={index}>{useCase}</li>
                            ))}
                        </ul>
                        <p style={{ marginTop: '1.5rem' }}>
                            Simply enter your details in the form and one of our team members will respond as soon as possible.
                        </p>
                    </div>

                    <div className={styles.formCard}>
                        <h2>Get in Touch</h2>
                        {error && (
                            <div style={{
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                backgroundColor: '#fee',
                                border: '1px solid #fcc',
                                borderRadius: '4px',
                                color: '#c33'
                            }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name" className={styles.label}>
                                    Name <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className={styles.input}
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={styles.input}
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone" className={styles.label}>
                                    Phone Number <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    className={styles.input}
                                    placeholder="Your phone number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="query" className={styles.label}>
                                    Query <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    id="query"
                                    name="query"
                                    className={`${styles.input} ${styles.textarea}`}
                                    placeholder="Please describe your question or how we can help..."
                                    value={formData.query}
                                    onChange={handleChange}
                                    rows={6}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </section>

                <section className={styles.socialSection}>
                    <h3>Follow us</h3>
                    <div className={styles.socialLinks}>
                        <a href="https://www.facebook.com/purostillwater" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                            <FacebookIcon />
                        </a>
                        <a href="https://www.instagram.com/purostillwater/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                            <InstagramIcon />
                        </a>
                        <a href="https://www.youtube.com/@purostillwater" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                            <YouTubeIcon />
                        </a>
                        <a href="https://www.tiktok.com/@purostill" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                            <TikTokIcon />
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M22.675 0h-21.35C.602 0 0 .602 0 1.343v21.314c0 .741.602 1.343 1.325 1.343h11.494V15.11H9.423V11.8h3.4v-2.58c0-3.378 2.062-5.22 5.078-5.22 1.446 0 2.688.107 3.05.156v3.13h-1.847c-1.64 0-1.956.78-1.956 1.922v2.44h3.46l-.45 3.31h-3.01V24h6.115c.723 0 1.325-.602 1.325-1.343V1.343C24 .602 23.398 0 22.675 0z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    );
}

function YouTubeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

function TikTokIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}
