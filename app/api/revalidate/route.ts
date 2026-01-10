import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Purge the entire site cache by revalidating the root layout
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
