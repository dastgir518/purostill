import { NextResponse } from 'next/server';

export async function GET() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://backend-ps.purostill.com';
    // Remove trailing slash if present for cleaner replacement
    const cleanBackendUrl = BACKEND_URL.replace(/\/$/, '');

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://purostill.com';
    // Remove trailing slash if present
    const cleanSiteUrl = SITE_URL.replace(/\/$/, '');

    try {
        // User specifically requested /sitemap.xml/
        const response = await fetch(`${cleanBackendUrl}/sitemap.xml/`, {
            next: { revalidate: 3600, tags: ['sitemap'] } // Cache for 1 hour, tag for purging
        });

        if (!response.ok) {
            // Fallback to standard sitemap.xml if trailing slash fails
            const fallbackResponse = await fetch(`${cleanBackendUrl}/sitemap.xml`, {
                next: { revalidate: 3600, tags: ['sitemap'] }
            });
            if (!fallbackResponse.ok) {
                return new NextResponse('Error fetching sitemap', { status: fallbackResponse.status });
            }
            const xml = await fallbackResponse.text();
            const modifiedXml = xml.replaceAll(cleanBackendUrl, cleanSiteUrl);
            return new NextResponse(modifiedXml, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
                },
            });
        }

        const xml = await response.text();

        // Replace backend URL with frontend URL
        const modifiedXml = xml.replaceAll(cleanBackendUrl, cleanSiteUrl);

        return new NextResponse(modifiedXml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
            },
        });
    } catch (error) {
        console.error('Sitemap proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
