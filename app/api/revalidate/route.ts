import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const tag = request.nextUrl.searchParams.get('tag');

        if (tag) {
            revalidateTag(tag);
            return NextResponse.json({
                revalidated: true,
                now: Date.now(),
                message: `Cache purged for tag: ${tag}`
            });
        }

        // Default: Purge the entire site cache by revalidating the root layout
        revalidateTag('sitemap'); // Ensure sitemap is refreshed
        revalidatePath('/', 'layout');

        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
            message: 'Global cache purge triggered successfully'
        });
    } catch (err: any) {
        return NextResponse.json({
            revalidated: false,
            message: err.message || 'Error purging cache'
        }, { status: 500 });
    }
}
