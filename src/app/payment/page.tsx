'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PaymentInfo {
  amount: number;
  eventName: string;
  eventDate: string;
  participantFee: number;
}

export default function PaymentPage() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadEventData = async () => {
      try {
        const { getCurrentEvent } = await import('@/lib/firestore');
        const currentEvent = await getCurrentEvent();

        if (!currentEvent) {
          throw new Error('활성화된 이벤트가 없습니다.');
        }

        const eventDate = (currentEvent.date as any).toDate ? (currentEvent.date as any).toDate() : new Date(currentEvent.date as any);

        setPaymentInfo({
          amount: currentEvent.price,
          eventName: currentEvent.title,
          eventDate: eventDate.toLocaleDateString('ko-KR'),
          participantFee: currentEvent.price
        });
      } catch (error) {
        console.error('Failed to load event data:', error);
        setError('이벤트 정보를 불러올 수 없습니다.');
      } finally {
        setLoadingData(false);
      }
    };

    loadEventData();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handlePayment = async () => {
    if (!paymentInfo) return;

    setIsLoading(true);
    setError('');

    try {
      // Get user data from session storage
      const pendingUserData = sessionStorage.getItem('pendingUser');
      const userData = pendingUserData ? JSON.parse(pendingUserData) : null;

      if (!userData) {
        throw new Error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      }

      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Always succeed for development
      const paymentId = `mock_payment_${Date.now()}`;

      // Store payment success info
      sessionStorage.setItem('paymentResult', JSON.stringify({
        success: true,
        paymentId: paymentId,
        amount: paymentInfo.amount,
        userData
      }));

      console.log('💳 Mock payment completed:', {
        paymentId,
        amount: paymentInfo.amount,
        userData: userData.name
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoPayment = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Use same payment logic as Toss Pay for now
      await handlePayment();
    } catch (err) {
      setError('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AppLayout title="참가비 결제" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="이벤트 정보를 불러오는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (!paymentInfo) {
    return (
      <AppLayout title="참가비 결제" showBackButton onBack={handleGoBack}>
        <div className="text-center space-y-4">
          <p className="text-red-600">{error || '이벤트 정보를 불러올 수 없습니다.'}</p>
          <Button onClick={handleGoBack} variant="outline">
            돌아가기
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="참가비 결제" showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🎉</span>
              <span>{paymentInfo.eventName}</span>
            </CardTitle>
            <CardDescription>
              {paymentInfo.eventDate} 참가비 결제
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">참가비</span>
                <span>{paymentInfo.participantFee.toLocaleString()}원</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>총 결제 금액</span>
                  <span className="text-lg text-purple-600">
                    {paymentInfo.amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">참가비 포함 내역</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 이벤트 진행비</li>
                <li>• 간단한 안주 및 음료</li>
                <li>• 아이스브레이킹 게임</li>
                <li>• 매칭 서비스</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>결제 방법 선택</CardTitle>
            <CardDescription>
              편리한 결제 방법을 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Toss Pay */}
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <div className="flex items-center justify-center space-x-3">
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <div className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-bold">
                      toss
                    </div>
                    <span>토스페이 결제</span>
                  </>
                )}
              </div>
            </Button>

            {/* Kakao Pay */}
            <Button
              onClick={handleKakaoPayment}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-gray-800"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">K</span>
                </div>
                <span className="font-medium">카카오페이</span>
              </div>
            </Button>

            {/* Card Payment */}
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>신용카드 / 체크카드</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* Payment Info */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-xs text-gray-600">
              <h4 className="font-medium text-gray-800 mb-2">🔒 결제 안내사항</h4>
              <p>• 결제 완료 후 취소는 이벤트 2시간 전까지 가능합니다</p>
              <p>• 취소 시 100% 환불되며, 당일 취소는 50% 수수료가 발생합니다</p>
              <p>• 결제 관련 문의는 바 직원에게 말씀해주세요</p>
              <p>• 안전한 결제를 위해 공인된 PG사를 이용합니다</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center text-xs text-gray-500">
          <p>💳 결제 문제 발생 시 바 직원에게 문의해주세요</p>
        </div>
      </div>
    </AppLayout>
  );
}