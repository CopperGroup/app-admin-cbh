// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

const SHARED_VARIABLES_SERVICE_URL = process.env.SHARED_VARIABLES_SERVICE_URL;
const SHARED_VARIABLES_SERVICE_API_KEY = process.env.SHARED_VARIABLES_SERVICE_API_KEY; // Needed for shared-variables-service health endpoint

const PLAN_CONTROLLER_SERVICE_URL = process.env.PLAN_CONTROLLER_SERVICE_URL;
const PLAN_CONTROLLER_SERVICE_API_KEY = process.env.PLAN_CONTROLLER_SERVICE_API_KEY; // Needed for plan-controller-service health endpoint


export async function GET(req: NextRequest) {
  if (!await isAuthenticated(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const serviceToFetch = req.nextUrl.searchParams.get('service'); // Get which service to fetch

  let serviceUrl: string | undefined;
  let serviceApiKey: string | undefined; // Health endpoints might not always need API keys, but it's safer to include if they *might* be protected.
  let serviceName: string;

  if (serviceToFetch === 'shared-variables') {
    serviceUrl = SHARED_VARIABLES_SERVICE_URL;
    serviceApiKey = SHARED_VARIABLES_SERVICE_API_KEY; // Shared variables health endpoint is protected
    serviceName = "shared-variables-service";
  } else if (serviceToFetch === 'plan-controller') {
    serviceUrl = PLAN_CONTROLLER_SERVICE_URL;
    serviceApiKey = PLAN_CONTROLLER_SERVICE_API_KEY; // Plan controller health endpoint is NOT protected by default, but if it were, this would be the key.
    serviceName = "plan-controller-service";
  } else {
    return NextResponse.json({ message: 'Invalid service specified' }, { status: 400 });
  }

  if (!serviceUrl) {
    return NextResponse.json({ service: serviceName, status: "error", error: `${serviceName} URL not configured in .env.local` }, { status: 500 });
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    // Only add API key if it's defined and needed for the health endpoint
    // Your plan-controller-service health endpoint is NOT protected by API key,
    // but shared-variables-service health *is* protected.
    if (serviceApiKey && serviceToFetch === 'shared-variables') { // Only send API key for shared-variables-service health
      headers['x-api-key'] = serviceApiKey;
    }

    const response = await fetch(`${serviceUrl}/health`, { headers });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`Error proxying health check for ${serviceName}:`, error);
    return NextResponse.json({ service: serviceName, status: "error", error: `Network error or service unreachable: ${error.message}` }, { status: 500 });
  }
}