import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Get the current host dynamically
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  if (error) {
    console.error('❌ Kakao authentication error:', error);
    return NextResponse.redirect(`${baseUrl}/auth?error=kakao_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/auth?error=no_code`);
  }

  // Redirect back to auth page with the code
  return NextResponse.redirect(`${baseUrl}/auth?code=${code}`);
}