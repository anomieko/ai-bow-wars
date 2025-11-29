/**
 * API route to get client-safe configuration
 * GET /api/config
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    // Only expose safe, client-needed config
    mockMode: process.env.MOCK_AI === 'true',
  });
}
