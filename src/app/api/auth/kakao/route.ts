import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    console.log('🟡 Processing Kakao authentication...');

    // Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        code,
        redirect_uri: `${process.env.NODE_ENV === 'production'
          ? 'https://kyareureuk-party-ju7qi5g9o-dongeun-kims-projects-f8739078.vercel.app'
          : 'http://localhost:3000'}/api/auth/kakao/callback`
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('❌ Kakao token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        response: tokenData
      });
      return NextResponse.json(
        {
          error: 'Failed to exchange authorization code',
          details: tokenData,
          debug: {
            client_id: process.env.KAKAO_REST_API_KEY,
            redirect_uri: `${process.env.NODE_ENV === 'production'
              ? 'https://kyareureuk-party-ju7qi5g9o-dongeun-kims-projects-f8739078.vercel.app'
              : 'http://localhost:3000'}/api/auth/kakao/callback`
          }
        },
        { status: 400 }
      );
    }

    // Step 2: Get user information using access token
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('❌ Kakao user info failed:', userData);
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 400 }
      );
    }

    console.log('✅ Kakao authentication successful:', {
      id: userData.id,
      nickname: userData.kakao_account?.profile?.nickname
    });

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        kakaoId: userData.id,
        name: userData.kakao_account?.profile?.nickname
      }
    });

  } catch (error: any) {
    console.error('❌ Kakao authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}