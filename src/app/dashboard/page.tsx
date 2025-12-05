'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getCurrentEvent, getUserByKakaoId, createRegistration, cancelRegistration } from '@/lib/firestore';

interface UserInfo {
  name: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  age: number;
  paymentStatus: 'completed' | 'pending' | 'failed';
}

interface EventInfo {
  date: string;
  time: string;
  location: string;
  mcName: string;
  description: string;
  rules: string[];
}

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '김철수',
    phoneNumber: '010-1234-5678',
    gender: 'male',
    age: 28,
    paymentStatus: 'completed'
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 사용자 등록 생성 함수
  const createUserRegistration = async (userData: any, paymentId: string) => {
    try {
      console.log('🚀 Creating user registration...', userData);

      // 현재 이벤트 가져오기
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        throw new Error('활성 이벤트를 찾을 수 없습니다');
      }

      console.log('📅 Current event found:', currentEvent.id);

      // 사용자 정보 가져오기 - Auth에서 이미 생성된 사용자 검색
      console.log('🔍 Searching for user with Kakao ID:', userData.kakaoId);
      const user = await getUserByKakaoId(userData.kakaoId);

      if (!user) {
        console.error('❌ User not found in Firestore. Auth 페이지에서 사용자 생성이 실패했을 수 있습니다.');
        throw new Error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      }

      console.log('✅ User found:', user);

      // 등록 생성
      console.log('📝 Creating registration with userId:', user.id);
      const registrationId = await createRegistration({
        userId: user.id,
        eventId: currentEvent.id,
        paymentStatus: 'completed',
        paymentId: paymentId,
        questionnaireAnswers: {}
      });

      console.log('✅ Registration created successfully:', registrationId);
      return registrationId;
    } catch (error) {
      console.error('❌ Error creating registration:', error);
      throw error;
    }
  };

  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    console.log(`🔄 Dashboard useEffect started [${uniqueId}]`);

    // Load user data from session storage
    const loadUserData = async () => {
      try {
        console.log(`📊 Loading user data... [${uniqueId}]`);
        const paymentResultData = sessionStorage.getItem('paymentResult');
        const pendingUserData = sessionStorage.getItem('pendingUser');

        console.log(`💾 SessionStorage check [${uniqueId}]:`);
        console.log('- paymentResult:', paymentResultData ? 'EXISTS' : 'MISSING');
        console.log('- pendingUser:', pendingUserData ? 'EXISTS' : 'MISSING');

        let userData = null;
        let paymentStatus = 'pending';

        if (paymentResultData) {
          console.log('🔍 Parsing paymentResult...');
          const paymentResult = JSON.parse(paymentResultData);
          console.log('📄 PaymentResult content:', paymentResult);

          if (paymentResult.success) {
            console.log('✅ Payment was successful');
            userData = paymentResult.userData;
            paymentStatus = 'completed';

            // 결제 완료 시 등록 생성 (한 번만)
            const registrationKey = `registration_created_${userData.kakaoId}`;
            const alreadyCreated = localStorage.getItem(registrationKey);

            console.log(`🔄 Registration check [${uniqueId}]:`);
            console.log('- registrationKey:', registrationKey);
            console.log('- alreadyCreated:', alreadyCreated);

            if (!alreadyCreated) {
              console.log(`🚀 Starting createUserRegistration... [${uniqueId}]`);

              // Double-check right before creating registration
              const doubleCheck = localStorage.getItem(registrationKey);
              if (doubleCheck) {
                console.log(`⚠️ Registration already created during execution [${uniqueId}], skipping...`);
                return;
              }

              // Set flag immediately to prevent race conditions
              localStorage.setItem(registrationKey, 'true');
              console.log(`🔒 Registration flag set [${uniqueId}]`);

              await createUserRegistration(userData, paymentResult.paymentId);
              console.log(`✅ Registration creation completed [${uniqueId}]`);
            } else {
              console.log(`⏭️ Registration already exists, skipping... [${uniqueId}]`);
            }
          } else {
            console.log('❌ Payment was not successful');
          }
        } else if (pendingUserData) {
          userData = JSON.parse(pendingUserData);
          paymentStatus = 'pending';
        }

        if (userData) {
          setUserInfo({
            name: userData.name || '사용자',
            phoneNumber: userData.phoneNumber || '010-0000-0000',
            gender: userData.gender || 'male',
            age: parseInt(userData.age) || 25,
            paymentStatus: paymentStatus as 'completed' | 'pending' | 'failed'
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadUserData();
  }, []);

  const [eventInfo] = useState<EventInfo>({
    date: '2024년 12월 5일',
    time: '오후 8:00 - 11:00',
    location: '강남구 꺄르륵 바',
    mcName: '김진우',
    description: '새로운 인연을 만날 수 있는 즐거운 소셜 파티입니다. 편안한 분위기에서 다양한 게임과 대화를 통해 특별한 만남을 경험해보세요!',
    rules: [
      '상대방을 존중하며 예의를 지켜주세요',
      '개인정보는 서로 동의 하에 공유해주세요',
      '과도한 음주는 자제해주세요',
      '휴대폰 사용은 최소화해주세요'
    ]
  });

  const [activeTab, setActiveTab] = useState<'event' | 'profile'>('event');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancelRegistration = async () => {
    if (confirm('정말로 참가를 취소하시겠습니까? 취소 정책에 따라 수수료가 발생할 수 있습니다.')) {
      setIsLoading(true);
      try {
        console.log('🚫 Starting cancellation process...');

        // Get current user data from session storage
        const pendingUserData = sessionStorage.getItem('pendingUser');
        const paymentResultData = sessionStorage.getItem('paymentResult');

        if (!pendingUserData && !paymentResultData) {
          throw new Error('사용자 정보를 찾을 수 없습니다');
        }

        let userData = null;
        if (paymentResultData) {
          const paymentResult = JSON.parse(paymentResultData);
          userData = paymentResult.userData;
        } else if (pendingUserData) {
          userData = JSON.parse(pendingUserData);
        }

        if (!userData || !userData.kakaoId) {
          throw new Error('사용자 정보가 올바르지 않습니다');
        }

        // Get user from database
        const user = await getUserByKakaoId(userData.kakaoId);
        if (!user) {
          throw new Error('데이터베이스에서 사용자를 찾을 수 없습니다');
        }

        // Get current event
        const currentEvent = await getCurrentEvent();
        if (!currentEvent) {
          throw new Error('활성 이벤트를 찾을 수 없습니다');
        }

        // Cancel the registration
        await cancelRegistration(user.id, currentEvent.id);

        // Clear session storage
        sessionStorage.removeItem('pendingUser');
        sessionStorage.removeItem('paymentResult');
        localStorage.clear();

        alert('참가가 취소되었습니다. 환불은 1-2일 내에 처리됩니다.');
        router.push('/');
      } catch (error: any) {
        console.error('❌ Error cancelling registration:', error);
        alert(`취소 처리 중 오류가 발생했습니다: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuestionnaireClick = () => {
    // TODO: Implement questionnaire page
    alert('질문지 기능은 곧 추가될 예정입니다!');
  };

  return (
    <AppLayout title="꺄르륵 파티 🎉">
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900">
            환영합니다, {userInfo.name}님! 🎊
          </h2>
          <p className="text-gray-600 text-sm">
            참가 신청이 완료되었습니다
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('event')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'event'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            이벤트 정보
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            내 정보
          </button>
        </div>

        {/* Event Tab */}
        {activeTab === 'event' && (
          <div className="space-y-4">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>이벤트 상세 정보</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">날짜</span>
                    <span className="font-medium">{eventInfo.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">시간</span>
                    <span className="font-medium">{eventInfo.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">장소</span>
                    <span className="font-medium">{eventInfo.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MC</span>
                    <span className="font-medium">{eventInfo.mcName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle>🎪 이벤트 소개</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{eventInfo.description}</p>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle>📋 참가 수칙</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {eventInfo.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2 text-gray-700">
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Questionnaire */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-800">💕 매칭 질문지</CardTitle>
                <CardDescription className="text-purple-700">
                  더 좋은 매칭을 위한 간단한 질문지를 작성해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleQuestionnaireClick}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  질문지 작성하기 ✨
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>👤</span>
                    <span>내 정보</span>
                  </div>
                  <Badge
                    variant={userInfo.paymentStatus === 'completed' ? 'default' : 'destructive'}
                    className={userInfo.paymentStatus === 'completed' ? 'bg-green-500' : ''}
                  >
                    {userInfo.paymentStatus === 'completed' ? '결제 완료' : '결제 대기'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이름</span>
                    <span className="font-medium">{userInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전화번호</span>
                    <span className="font-medium">{userInfo.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">성별</span>
                    <span className="font-medium">
                      {userInfo.gender === 'male' ? '남성' : '여성'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">나이</span>
                    <span className="font-medium">{userInfo.age}세</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>📞 문의 및 지원</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>이벤트 문의:</strong> 바 직원에게 직접 문의</p>
                  <p><strong>결제 문의:</strong> 바 직원에게 직접 문의</p>
                  <p><strong>응급상황:</strong> 이벤트 진행 중 MC에게 문의</p>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">⚠️ 참가 취소</CardTitle>
                <CardDescription className="text-red-600">
                  취소 정책을 확인 후 신중히 결정해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-red-50 p-3 rounded-md text-xs text-red-700">
                  <ul className="space-y-1">
                    <li>• 이벤트 2시간 전까지: 100% 환불</li>
                    <li>• 이벤트 2시간 내: 50% 수수료 발생</li>
                    <li>• 이벤트 시작 후: 환불 불가</li>
                  </ul>
                </div>
                <Button
                  onClick={handleCancelRegistration}
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    '참가 취소하기'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Message */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🎉 멋진 만남이 기다리고 있어요!</p>
          <p>문의사항은 언제든 바 직원에게 말씀해주세요</p>
        </div>
      </div>
    </AppLayout>
  );
}