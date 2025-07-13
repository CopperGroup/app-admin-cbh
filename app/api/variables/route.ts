// src/app/api/variables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

const SHARED_VARIABLES_SERVICE_URL = process.env.SHARED_VARIABLES_SERVICE_URL;
const SHARED_VARIABLES_SERVICE_API_KEY = process.env.SHARED_VARIABLES_SERVICE_API_KEY;

// Handles GET requests to /api/variables (to fetch all variables)
export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  try {
    // Proxy the GET request to your shared-variables-service's /variables endpoint
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables`, {
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

// Handles POST requests to /api/variables (to create a new variable)
export async function POST(req: NextRequest) {
  if (!await isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  const { name, value } = await req.json(); // Get name and value from the request body

  try {
    // Proxy the POST request to your shared-variables-service's /variables endpoint
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY,
      },
      body: JSON.stringify({ name, value }), // Send the name and value
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying create variable request:', error);
    return NextResponse.json({ message: 'Failed to create variable' }, { status: 500 });
  }
}

// Handles PUT requests to /api/variables (to update an existing variable - name in body)
export async function PUT(req: NextRequest) {
  if (!await isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  // Get name AND value from the request body
  const { name, value } = await req.json(); 

  // --- IMPORTANT ---
  // Your shared-variables-service's PUT route currently expects name in the URL params.
  // To make this work, you must either:
  // 1. Change the backend service's PUT /variables/:name to PUT /variables (name in body).
  //    This would require modifying src/routes/variable.routes.js and src/controllers/variable.controller.js in your shared-variables-service.
  // 2. Or, for a quick fix *while keeping the backend as is*, append the name to the URL here.
  //    I'll assume option 2 for now to avoid modifying the backend, but recommend option 1 for consistency.
  // ---

  try {
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables/${name}`, { // Still target dynamic route on backend
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY,
      },
      body: JSON.stringify({ value }), // Only send value, name is in URL for backend
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying PUT variable '${name}':`, error);
    return NextResponse.json({ message: `Failed to update variable '${name}'` }, { status: 500 });
  }
}