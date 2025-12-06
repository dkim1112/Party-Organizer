"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { EventStatus } from "@/types";

export default function StatusPage() {
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [averageAges, setAverageAges] = useState<{
    male: number | null;
    female: number | null;
  }>({ male: null, female: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchEventStatus();
  }, []);

  const fetchEventStatus = async () => {
    try {
      const { getCurrentEvent, getEventStatus } = await import(
        "@/lib/firestore"
      );

      // Get current active event
      const currentEvent = await getCurrentEvent();

      if (!currentEvent) {
        throw new Error("현재 활성화된 이벤트가 없습니다.");
      }

      // Convert Firestore timestamp to readable date
      const eventDate = (currentEvent.date as any).toDate
        ? (currentEvent.date as any).toDate()
        : new Date(currentEvent.date as any);

      // Check if event date is in the past
      const now = new Date();
      const isEventPast = eventDate < now;

      if (isEventPast) {
        throw new Error(
          "이벤트가 종료되었습니다. 새로운 이벤트를 기다려 주세요!"
        );
      }

      // Get real event status from Firebase
      const status = await getEventStatus(currentEvent.id);
      if (status) {
        setEventStatus(status);

        // Calculate average ages by getting all registered users
        const { getUserById } = await import("@/lib/firestore");
        const { collection, query, where, getDocs } = await import(
          "firebase/firestore"
        );
        const { db } = await import("@/lib/firebase");

        const registrationsQuery = query(
          collection(db, "registrations"),
          where("eventId", "==", currentEvent.id),
          where("paymentStatus", "==", "completed")
        );

        const registrationsSnapshot = await getDocs(registrationsQuery);

        const maleAges: number[] = [];
        const femaleAges: number[] = [];

        for (const registrationDoc of registrationsSnapshot.docs) {
          const registration = registrationDoc.data();
          const user = await getUserById(registration.userId);

          if (user) {
            if (user.gender === "male") {
              maleAges.push(user.age);
            } else if (user.gender === "female") {
              femaleAges.push(user.age);
            }
          }
        }

        const averageMaleAge =
          maleAges.length > 0
            ? +(
                maleAges.reduce((sum, age) => sum + age, 0) / maleAges.length
              ).toFixed(1)
            : null;

        const averageFemaleAge =
          femaleAges.length > 0
            ? +(
                femaleAges.reduce((sum, age) => sum + age, 0) /
                femaleAges.length
              ).toFixed(1)
            : null;

        setAverageAges({
          male: averageMaleAge,
          female: averageFemaleAge,
        });

        // Set event info from Firebase
        setEventInfo({
          title: currentEvent.title,
          date: eventDate.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          }),
          time: eventDate.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: currentEvent.location,
        });
      } else {
        throw new Error("이벤트 상태를 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch event status:", error);
      setError(
        error instanceof Error
          ? error.message
          : "이벤트 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = () => {
    router.push("/auth");
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
      <AppLayout title="참가자 현황 확인" showBackButton onBack={handleGoBack}>
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
      <AppLayout title="참가자 현황 확인" showBackButton onBack={handleGoBack}>
        <div className="text-center">
          <p>현황을 불러올 수 없습니다. 다시 시도해주세요.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="참가자 현황 확인" showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* Event Info */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {eventInfo.title}
          </h2>
          <div className="text-gray-600 space-y-1">
            <p>📅 {eventInfo.date}</p>
            <p>🕐 {eventInfo.time} (~ 3시간)</p>
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
                  <span className="text-lg text-gray-500">
                    /{eventStatus.maleSlots}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {eventStatus.availableMaleSlots > 0 ? (
                    <span className="text-green-600 font-medium">
                      {eventStatus.availableMaleSlots}자리 남았어요.
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      아쉽게도 마감이에요.
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
                  <span className="text-lg text-gray-500">
                    /{eventStatus.femaleSlots}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {eventStatus.availableFemaleSlots > 0 ? (
                    <span className="text-green-600 font-medium">
                      {eventStatus.availableFemaleSlots}자리 남았어요.
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      아쉽게도 마감이에요.
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
            <CardTitle>전체 참가자 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>전체 참가자</span>
                <span>
                  {eventStatus.totalSlots -
                    eventStatus.availableMaleSlots -
                    eventStatus.availableFemaleSlots}
                  /{eventStatus.totalSlots}명
                </span>
              </div>
              {(averageAges.male || averageAges.female) && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>평균 나이</span>
                  <span>
                    {averageAges.male && `남성 ${averageAges.male}세`}
                    {averageAges.male && averageAges.female && ", "}
                    {averageAges.female && `여성 ${averageAges.female}세`}
                  </span>
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((eventStatus.totalSlots -
                        eventStatus.availableMaleSlots -
                        eventStatus.availableFemaleSlots) /
                        eventStatus.totalSlots) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {eventStatus.canJoin ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-2">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-800">
                    아직 참가 신청이 가능해요.
                  </h3>
                  <p className="text-sm text-green-700">
                    자리가 다 차기 전에 얼른 신청 하세요!
                  </p>
                </div>
                <Button
                  onClick={handleJoinEvent}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  참가 신청 ✨
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-2">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-800">
                    --마감--
                  </h3>
                  <p className="text-sm text-red-700">
                    감사하게도 정원이 모두 찼어요.
                    <br />더 재밌는 꺄르륵 파티로 빨리 찾아올게요!
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
          <p>⏰ 참가 신청은 선착순으로 마감되어요.</p>
          <p>💌 (두근두근) 멋진 만남이 기다리고 있어요.</p>
        </div>
      </div>
    </AppLayout>
  );
}
