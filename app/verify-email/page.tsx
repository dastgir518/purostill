'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/lib/auth';
import styles from './auth.module.css';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      const user = searchParams.get('user');
      const key = searchParams.get('key');

      if (!user || !key) {
        setStatus('error');
        setMessage('Invalid verification link. Missing user ID or verification key.');
        return;
      }

      try {
        const result = await verifyEmail(user, key);
        setStatus('success');
        setMessage(result.message || 'Email verified successfully. You can now log in.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {status === 'loading' && (
          <div className={styles.loadingMessage}>
            <div className={styles.spinner}></div>
            <h2>Verifying Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.successMessage}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <Link href="/login" className={styles.linkButton}>
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.errorContainer}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className={styles.footer}>
              <Link href="/signup" className={styles.link}>
                Sign up again
              </Link>
              {' or '}
              <Link href="/login" className={styles.link}>
                Try logging in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

