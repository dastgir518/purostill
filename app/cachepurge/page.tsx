'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CachePurgePage() {
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    setLoading(true);
    setStatus(null);
    
    try {
      // Note: Cache purge is not available in static export
      // This functionality requires a server-side endpoint
      setStatus({
        success: false,
        message: 'Cache purge is not available in static build. Please use WordPress admin or hosting control panel.',
      });
    } catch (error: any) {
      setStatus({
        success: false,
        message: error.message || 'Failed to purge cache',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '3rem auto', 
      padding: '2rem',
      fontFamily: 'var(--font-poppins), sans-serif'
    }}>
      <h1 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Cache Purge</h1>
      
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        This page allows you to manually purge all cached data. Caches are automatically 
        refreshed every 24 hours, but you can force an immediate refresh here.
      </p>

      <button
        onClick={handlePurge}
        disabled={loading}
        style={{
          padding: '0.75rem 2rem',
          background: loading ? '#95a5a6' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '2rem',
        }}
      >
        {loading ? 'Purging...' : 'Purge All Caches'}
      </button>

      {status && (
        <div style={{
          padding: '1rem',
          borderRadius: '6px',
          background: status.success ? '#d4edda' : '#f8d7da',
          color: status.success ? '#155724' : '#721c24',
          border: `1px solid ${status.success ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '1rem',
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{status.message}</p>
          {status.timestamp && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              Purged at: {new Date(status.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
        <Link 
          href="/" 
          style={{ 
            color: '#3498db', 
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

