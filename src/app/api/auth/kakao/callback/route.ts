import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('❌ Kakao authentication error:', error);
    return NextResponse.redirect(
      `${process.env.NODE_ENV === 'production'
        ? 'https://kyareureuk-party-ju7qi5g9o-dongeun-kims-projects-f8739078.vercel.app'
        : 'http://localhost:3000'}/auth?error=kakao_auth_failed`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NODE_ENV === 'production'
        ? 'https://kyareureuk-party-ju7qi5g9o-dongeun-kims-projects-f8739078.vercel.app'
        : 'http://localhost:3000'}/auth?error=no_code`
    );
  }

  // Redirect back to auth page with the code
  return NextResponse.redirect(
    `${process.env.NODE_ENV === 'production'
      ? 'https://kyareureuk-party-ju7qi5g9o-dongeun-kims-projects-f8739078.vercel.app'
      : 'http://localhost:3000'}/auth?code=${code}`
  );
}