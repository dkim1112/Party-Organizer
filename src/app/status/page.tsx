'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventStatus } from '@/types';

export default function StatusPage() {
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchEventStatus();
  }, []);

  const fetchEventStatus = async () => {
    try {
      const { getCurrentEvent, getEventStatus } = await import('@/lib/firestore');

      // Get current active event
      const currentEvent = await getCurrentEvent();

      if (!currentEvent) {
        throw new Error('현재 활성화된 이벤트가 없습니다. Firebase에서 이벤트를 생성해주세요.');
      }

      // Get real event status from Firebase
      const status = await getEventStatus(currentEvent.id);
      if (status) {
        setEventStatus(status);

        // Set event info from Firebase
        const eventDate = (currentEvent.date as any).toDate ? (currentEvent.date as any).toDate() : new Date(currentEvent.date as any);

        setEventInfo({
          title: currentEvent.title,
          date: eventDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          }),
          time: eventDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: currentEvent.location
        });
      } else {
        throw new Error('이벤트 상태를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch event status:', error);
      setError(error instanceof Error ? error.message : '이벤트 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = () => {
    router.push('/auth');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AppLayout title="참가 현황 확인" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="현황을 확인하는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="참가 현황 확인" showBackButton onBack={handleGoBack}>
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchEventStatus} variant="outline">
            다시 시도
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!eventStatus || !eventInfo) {
    return (
      <AppLayout title="참가 현황 확인" showBackButton onBack={handleGoBack}>
        <div className="text-center">
          <p>현황을 불러올 수 없습니다. 다시 시도해주세요.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="참가 현황 확인" showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* Event Info */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {eventInfo.title}
          </h2>
          <div className="text-gray-600 space-y-1">
            <p>📅 {eventInfo.date}</p>
            <p>🕐 {eventInfo.time}</p>
            <p>📍 {eventInfo.location}</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Male Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-center">남성</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {eventStatus.maleSlots - eventStatus.availableMaleSlots}
                  <span className="text-lg text-gray-500">/{eventStatus.maleSlots}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {eventStatus.availableMaleSlots > 0 ? (
                    <span className="text-green-600 font-medium">
                      {eventStatus.availableMaleSlots}자리 남음
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      마감
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Female Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-center">여성</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-pink-600">
                  {eventStatus.femaleSlots - eventStatus.availableFemaleSlots}
                  <span className="text-lg text-gray-500">/{eventStatus.femaleSlots}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {eventStatus.availableFemaleSlots > 0 ? (
                    <span className="text-green-600 font-medium">
                      {eventStatus.availableFemaleSlots}자리 남음
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      마감
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle>전체 참가 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>전체 참가자</span>
                <span>{eventStatus.totalSlots - eventStatus.availableMaleSlots - eventStatus.availableFemaleSlots}/{eventStatus.totalSlots}명</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${((eventStatus.totalSlots - eventStatus.availableMaleSlots - eventStatus.availableFemaleSlots) / eventStatus.totalSlots) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {eventStatus.canJoin ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-800">
                    🎉 참가 가능합니다!
                  </h3>
                  <p className="text-sm text-green-700">
                    아직 자리가 남아있어요. 지금 바로 참가 신청을 하세요!
                  </p>
                </div>
                <Button
                  onClick={handleJoinEvent}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  참가 신청하기 ✨
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-800">
                    😔 마감되었습니다
                  </h3>
                  <p className="text-sm text-red-700">
                    이번 파티는 정원이 찼습니다.<br />
                    다음 꺄르륵 파티를 기대해주세요!
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="w-full border-red-300 text-red-700 hover:bg-red-100"
                  size="lg"
                >
                  다음 기회에 💕
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>⏰ 참가 신청은 선착순으로 마감됩니다</p>
          <p>💌 멋진 만남이 기다리고 있어요</p>
        </div>
      </div>
    </AppLayout>
  );
}