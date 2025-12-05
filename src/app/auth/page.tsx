'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface UserData {
  kakaoId?: string;
  name: string;
  phoneNumber: string;
  gender: 'male' | 'female' | '';
  age: string;
}

type AuthStep = 'kakao' | 'profile';

function AuthPageContent() {
  const [step, setStep] = useState<AuthStep>('kakao');
  const [userData, setUserData] = useState<UserData>({
    name: '',
    phoneNumber: '',
    gender: '',
    age: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle Kakao callback
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    if (code) {
      handleKakaoCallback(code);
    }
  }, [searchParams]);

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&redirect_uri=${encodeURIComponent(
      `${window.location.origin}/api/auth/kakao/callback`
    )}&response_type=code`;

    window.location.href = kakaoAuthUrl;
  };

  const handleKakaoCallback = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🟡 Processing Kakao authentication...');

      const response = await fetch('/api/auth/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '카카오 인증에 실패했습니다.');
      }

      console.log('✅ Kakao authentication successful:', data.user);

      // Check if user already exists
      const { getUserByKakaoId } = await import('@/lib/firestore');
      const existingUser = await getUserByKakaoId(data.user.kakaoId);

      if (existingUser) {
        console.log('🔍 User already exists:', existingUser.id);
        setError(`안녕하세요, ${existingUser.name}님! 이미 가입된 계정입니다. 바 직원에게 문의해 주세요.`);
        return;
      }

      // Update user data with Kakao info for new users
      setUserData(prev => ({
        ...prev,
        kakaoId: data.user.kakaoId,
        name: data.user.name || ''
      }));

      setStep('profile');
    } catch (err: any) {
      console.error('❌ Kakao authentication error:', err);
      setError(err.message || '카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === 'kakao') {
      router.back();
    } else {
      setStep('kakao');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('👤 Saving user data for payment...');

      // Store user data in sessionStorage for payment page
      sessionStorage.setItem('pendingUser', JSON.stringify({
        kakaoId: userData.kakaoId,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
        age: userData.age
      }));

      console.log('✅ User data saved to sessionStorage');

      // Redirect to payment page
      router.push('/payment');
    } catch (err: any) {
      console.error('❌ Error creating user:', err);
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const getStepTitle = () => {
    switch (step) {
      case 'kakao': return '카카오 로그인';
      case 'profile': return '프로필 입력';
    }
  };

  return (
    <AppLayout title={getStepTitle()} showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2">
          {['kakao', 'profile'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName
                    ? 'bg-yellow-500 text-white'
                    : index < ['kakao', 'profile'].indexOf(step)
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    index < ['kakao', 'profile'].indexOf(step)
                      ? 'bg-yellow-200'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'kakao' && (
          <Card>
            <CardHeader>
              <CardTitle>카카오 로그인</CardTitle>
              <CardDescription>
                카카오톡으로 간편하게 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleKakaoLogin}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <span className="mr-2">💬</span>
                      카카오톡으로 로그인
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보 입력</CardTitle>
              <CardDescription>
                꺄르륵 파티 참가를 위한 기본 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="실명을 입력해주세요"
                    value={userData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">휴대폰 번호</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={userData.phoneNumber}
                    onChange={(e) => {
                      const formattedPhone = formatPhoneNumber(e.target.value);
                      handleInputChange('phoneNumber', formattedPhone);
                    }}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>성별</Label>
                  <RadioGroup
                    value={userData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">남성</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">여성</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="만 나이를 입력해주세요"
                    value={userData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    min="19"
                    max="100"
                    disabled={isLoading}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !userData.name || !userData.phoneNumber || !userData.gender || !userData.age}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : '다음 단계로'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔐 개인정보는 안전하게 보호됩니다</p>
          <p>💛 카카오 로그인으로 간편하게 인증하세요</p>
        </div>
      </div>
    </AppLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}