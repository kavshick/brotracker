import { NextResponse } from 'next/server';

export function middleware(request) {
  // Let API requests pass through to the function
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For all other non-API routes, allow normal routing
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
