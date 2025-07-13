// src/app/api/variables/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth'; // Imports your authentication helper

const SHARED_VARIABLES_SERVICE_URL = process.env.SHARED_VARIABLES_SERVICE_URL;
const SHARED_VARIABLES_SERVICE_API_KEY = process.env.SHARED_VARIABLES_SERVICE_API_KEY;

// Handles GET requests to /api/variables/[name] (to fetch a single variable)
export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  if (!await isAuthenticated(req)) { // Await is crucial here for isAuthenticated
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  const { name } = params; // Get the variable name from the URL path

  try {
    // Proxy the GET request to your shared-variables-service's /variables/:name endpoint
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables/${name}`, {
      headers: {
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY, // Use the API key
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying GET variable '${name}':`, error);
    return NextResponse.json({ message: `Failed to fetch variable '${name}'` }, { status: 500 });
  }
}

// Handles PUT requests to /api/variables/[name] (to update an existing variable)
export async function PUT(req: NextRequest, { params }: { params: { name: string } }) {
  if (!await isAuthenticated(req)) { // Await is crucial here for isAuthenticated
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!SHARED_VARIABLES_SERVICE_URL || !SHARED_VARIABLES_SERVICE_API_KEY) {
    return NextResponse.json({ message: 'Service configuration missing' }, { status: 500 });
  }

  const { name } = params; // Get the variable name from the URL path
  const { value } = await req.json(); // Get the new value from the request body

  try {
    // Proxy the PUT request to your shared-variables-service's /variables/:name endpoint
    const response = await fetch(`${SHARED_VARIABLES_SERVICE_URL}/variables/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHARED_VARIABLES_SERVICE_API_KEY, // Use the API key
      },
      body: JSON.stringify({ value }), // Send the new value
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error proxying PUT variable '${name}':`, error);
    return NextResponse.json({ message: `Failed to update variable '${name}'` }, { status: 500 });
  }
}