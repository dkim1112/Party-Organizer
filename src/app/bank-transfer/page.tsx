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
import {
  getCurrentEvent,
  createUser,
  createRegistration,
} from "@/lib/firestore";

interface UserData {
  kakaoId: string;
  name: string;
  phoneNumber: string;
  gender: "male" | "female";
  age: string;
}

interface EventInfo {
  id: string;
  title: string;
  price: number;
  date: string;
}

export default function BankTransferPage() {
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);

  const router = useRouter();

  const bankInfo = {
    bankName: "국민은행",
    accountNumber: "01027695861",
    accountHolder: "이중후",
  };

  useEffect(() => {
    // Route protection: Check if user has valid pending user data
    const pendingUserData = sessionStorage.getItem("pendingUser");

    if (!pendingUserData) {
      // No valid session data, redirect to home
      router.push("/");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Load user data from session storage
      const pendingUserData = sessionStorage.getItem("pendingUser");
      if (!pendingUserData) {
        router.push("/auth");
        return;
      }

      const parsedUserData = JSON.parse(pendingUserData);
      setUserData(parsedUserData);

      // Load event data
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        throw new Error("활성화된 이벤트가 없습니다.");
      }

      const eventDate = (currentEvent.date as any).toDate
        ? (currentEvent.date as any).toDate()
        : new Date(currentEvent.date as any);

      setEventInfo({
        id: currentEvent.id,
        title: currentEvent.title,
        price: currentEvent.price,
        date: eventDate.toLocaleDateString("ko-KR"),
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("데이터를 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!userData || !eventInfo) {
      setError("사용자 정보 또는 이벤트 정보가 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create user in database
      const userId = await createUser({
        kakaoId: userData.kakaoId,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
        age: parseInt(userData.age),
      });

      // Create registration with pending approval status
      const registrationId = await createRegistration({
        userId: userId,
        eventId: eventInfo.id,
        paymentStatus: "pending",
        approvalStatus: "pending",
        questionnaireAnswers: {}, // Will be filled later
      });

      console.log("Registration created successfully:", registrationId);

      // Navigate to waiting page
      router.push("/waiting");
    } catch (error: any) {
      console.error("Registration failed:", error);
      setError(error.message || "등록 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <AppLayout title="계좌이체 안내" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="정보를 불러오는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (!eventInfo || !userData) {
    return (
      <AppLayout title="계좌이체 안내" showBackButton onBack={handleGoBack}>
        <div className="text-center space-y-4">
          <p className="text-red-600">
            {error || "이벤트 정보 또는 사용자 정보를 불러올 수 없습니다."}
          </p>
          <Button onClick={handleGoBack} variant="outline">
            돌아가기
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="계좌이체 안내" showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* 이벤트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🎉</span>
              <span>{eventInfo.title}</span>
            </CardTitle>
            <CardDescription>{eventInfo.date} 참가 신청</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">신청자</span>
                <span className="font-medium">{userData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">참가비</span>
                <span className="font-medium">
                  {eventInfo.price.toLocaleString()}원
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 결제 방법 안내 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">결제 방법 안내</CardTitle>
            <CardDescription className="text-blue-700">
              아래 계좌로 참가비를 입금해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">은행명</span>
                <span className="font-medium">{bankInfo.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">계좌번호</span>
                <span className="font-medium font-mono">
                  {bankInfo.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예금주</span>
                <span className="font-medium">{bankInfo.accountHolder}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">입금 금액</span>
                  <span className="text-lg font-bold text-blue-600">
                    {eventInfo.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-100 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                ⚠️ 입금 시 주의사항
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • 입금자명은 <strong>"{userData.name}"</strong>으로 정확히
                  입금해주세요
                </li>
                <li>• 입금 확인까지 최대 하루 정도 소요될 수 있어요</li>
                <li>• 입금 후 아래 버튼을 눌러 신청을 완료해주세요</li>
                <li>
                  •{" "}
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    환불 규정 확인하기
                  </button>
                </li>
              </ul>
            </div>
            <Button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                "입금 완료 - 신청하기"
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* 문의 정보 */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>입금 관련 문의: DM - yeonrim_bar</p>
        </div>
      </div>

      {/* Refund Policy Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  연림 환불 규정
                </h2>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold text-black-700 mb-2">
                    1. 예약 확정 후 당일 취소 및 노쇼(No-show)의 경우
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    예약 확정 후 당일 취소 또는 사전 연락 없이 미방문(No-show)
                    시에는, 어떠한 경우에도 환불이 불가합니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-black-700 mb-2">
                    2. 방문일 기준 7일 이전 취소
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    방문일 기준 7일 전까지 취소 요청 시 결제 금액의{" "}
                    <strong>100%를 환불</strong>해드립니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-black-700 mb-2">
                    3. 방문일 기준 7일 이내 취소
                  </h3>
                  <div className="text-gray-700 leading-relaxed space-y-2">
                    <p>
                      방문일을 기준으로 7일 이내에 취소하는 경우, 아래 기준에
                      따라 환불이 제한됩니다.
                    </p>
                    <ul className="pl-4 space-y-1">
                      <li>
                        • <strong>방문 6 ~ 4일 전 취소:</strong> 결제 금액의 50%
                        환불
                      </li>
                      <li>
                        • <strong>방문 3 ~ 1일 전 취소:</strong> 결제 금액의
                        환불 불가
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-black-700 mb-2">
                    4. 매장 사정으로 인한 취소
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    매장의 사정 (환불 처리 문제, 운영 불가 등)으로 예약이 취소될
                    경우, 결제 금액 전액을 환불 해드립니다.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-black-700 mb-2">
                    5. 환불 처리 기간
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    환불은 취소 확정일 기준 영업일 7~14일 이내 결제 수단에 따라
                    처리됩니다. 결제 수단에 따라 실제 환불 시점은 다소 차이가
                    있을 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
