// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth'; // Imports your authentication helper

const SHARED_VARIABLES_SERVICE_URL = process.env.SHARED_VARIABLES_SERVICE_URL;

export async function GET(req: NextRequest) {
  // Check if the request to *this Next.js API route* is authenticated
  if (!await isAuthenticated(req)) { // Await is crucial here for isAuthenticated
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Ensure the backend service URL is configured
  if (!SHARED_VARIABLES_SERVICE_URL) {
    return NextResponse.json({ message: 'Shared variables service URL not configured' }, { status: 500 });
  }

  try {
    // Proxy the request to the actual shared-variables-service health endpoint
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/health`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying health check:', error);
    return NextResponse.json({ message: 'Failed to fetch service health' }, { status: 500 });
  }
}