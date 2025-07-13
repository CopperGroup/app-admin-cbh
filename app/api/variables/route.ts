// src/app/api/variables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

const SHARED_VARIABLES_SERVICE_URL = process.env.SHARED_VARIABLES_SERVICE_URL;
const SHARED_VARIABLES_SERVICE_API_KEY = process.env.SHARED_VARIABLES_SERVICE_API_KEY;

// GET all variables
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables`, { // Target the root /variables endpoint
      headers: {
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY,
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying GET all variables request:', error);
    return NextResponse.json({ message: 'Failed to fetch all variables' }, { status: 500 });
  }
}

// POST to create a new variable
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  const { name, value } = await req.json();

  try {
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY,
      },
      body: JSON.stringify({ name, value }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying create variable request:', error);
    return NextResponse.json({ message: 'Failed to create variable' }, { status: 500 });
  }
}