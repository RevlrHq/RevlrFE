import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle Unsplash OAuth callback
 * This endpoint receives the authorization code from Unsplash and redirects back to the client
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Build the redirect URL with the callback parameters
    const redirectUrl = new URL('/dashboard', request.url);

    // Add query parameters for the client to handle
    if (code) {
        redirectUrl.searchParams.set('unsplash_code', code);
    }

    if (error) {
        redirectUrl.searchParams.set('unsplash_error', error);
    }

    if (state) {
        redirectUrl.searchParams.set('unsplash_state', state);
    }

    // Add a flag to indicate this is an Unsplash callback
    redirectUrl.searchParams.set('unsplash_callback', 'true');

    return NextResponse.redirect(redirectUrl);
}
