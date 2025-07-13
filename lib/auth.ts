// src/lib/auth.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  // Await the resolution of the cookies() function
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  // For this simple panel, we just check if the token exists and has the expected value
  return authToken?.value === 'authenticated';
}