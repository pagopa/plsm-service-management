// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Logica per controllare l'autenticazione a livello di route
  // Questa è un'alternativa per gestire la protezione delle route
}

export const config = {
  matcher: '/dashboard/:path*'
};