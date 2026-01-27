import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    // Allow access to login pages and home
    if (pathname === '/' || pathname.includes('/login') || pathname.includes('/api/auth')) {
        return NextResponse.next();
    }

    // Check if user is authenticated
    if (!token) {
        // Redirect to appropriate login page based on the route
        if (pathname.startsWith('/super-admin') || pathname.includes("super-admin") || pathname.startsWith('/admin')) {
            const loginUrl = new URL('/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
        const loginUrl = new URL('/', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    if (pathname.startsWith('/super-admin') && token.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/parent') && token.role !== 'PARENT') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/driver') && token.role !== 'DRIVER') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
        // Allow Super Admin to access Admin routes if needed, or strictly separate them
        if (token.role !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/super-admin/:path*', '/parent/:path*', '/driver/:path*', '/admin/:path*'],
};
