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
  getUserByKakaoId,
  getRegistrationByUser,
} from "@/lib/firestore";

export default function WaitingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: "국민은행",
    accountNumber: "01027695861",
    accountHolder: "이중후",
    amount: 35000,
  });

  const router = useRouter();

  useEffect(() => {
    // Route protection: Check if user has proper session data
    const pendingUserData = sessionStorage.getItem("pendingUser");
    const paymentResultData = sessionStorage.getItem("paymentResult");

    if (!pendingUserData && !paymentResultData) {
      // No valid session data, redirect to home
      router.push("/");
      return;
    }

    checkApprovalStatus();
    // Poll every 30 seconds to check for approval
    const interval = setInterval(checkApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const checkApprovalStatus = async () => {
    try {
      // Get user data from session storage
      const pendingUserData = sessionStorage.getItem("pendingUser");
      const paymentResultData = sessionStorage.getItem("paymentResult");

      let userData = null;
      if (paymentResultData) {
        const paymentResult = JSON.parse(paymentResultData);
        userData = paymentResult.userData;
      } else if (pendingUserData) {
        userData = JSON.parse(pendingUserData);
      }

      if (!userData || !userData.kakaoId) {
        setError("사용자 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setUserInfo(userData);

      // Get user from database
      const user = await getUserByKakaoId(userData.kakaoId);
      if (!user) {
        setError(
          "참가 신청이 거부되었습니다. 자세한 사항은 DM으로 문의해주세요"
        );
        setIsLoading(false);
        return;
      }

      // Get current event
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        setError("활성 이벤트를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // Check registration status
      const registration = await getRegistrationByUser(
        user.id,
        currentEvent.id
      );
      if (!registration) {
        setError("등록 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      // If approved, redirect to dashboard
      if (registration.approvalStatus === "approved") {
        // Update session storage to reflect approval
        sessionStorage.setItem(
          "paymentResult",
          JSON.stringify({
            success: true,
            paymentId: `approved_${Date.now()}`,
            amount: currentEvent.price,
            userData,
          })
        );
        router.push("/dashboard");
        return;
      }

      // If rejected, show error
      if (registration.approvalStatus === "rejected") {
        setError(
          "참가 신청이 거부되었습니다. 자세한 사항은 DM으로 문의해주세요."
        );
        setIsLoading(false);
        return;
      }

      // Still pending - could calculate queue position here if needed
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error checking approval status:", error);
      setError("상태 확인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <AppLayout title="승인 대기 중" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="승인 상태를 확인하는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="승인 대기" showBackButton onBack={handleGoBack}>
        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">😢</div>
                <h2 className="text-lg font-bold text-red-800">오류 발생</h2>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="승인 대기 중" showBackButton onBack={handleGoBack}>
      <div className="space-y-6">
        {/* 대기 상태 카드 */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <CardTitle className="text-yellow-800">승인 대기 중</CardTitle>
            <CardDescription className="text-yellow-700">
              {userInfo?.name}님의 참가 신청이 접수되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">현재 상태</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium">관리자 승인 대기 중</span>
              </div>
            </div>
            <p className="text-xs text-yellow-600">
              승인까지 보통 6-8시간이 소요됩니다.
              <br />
              안심하고 창을 닫으시고 나중에 확인해주셔도 좋습니다.
            </p>
          </CardContent>
        </Card>

        {/* 입금 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-left">입금 정보</CardTitle>
            <CardDescription className="text-left">
              아래 계좌로 참가비를 입금해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">은행</span>
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">입금할 금액</span>
                  <span className="text-lg font-bold text-blue-600">
                    {bankInfo.amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• 입금자명은 신청시 입력한 이름과 동일하게 해주세요</p>
              <p>• 입금 확인 후 관리자가 승인 처리해요</p>
              <p>• 승인되면 자동으로 대시보드가 보여져요</p>
            </div>
          </CardContent>
        </Card>

        {/* 문의 정보 */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>입금 관련 문의: DM - yeonrim_bar</p>
        </div>
      </div>
    </AppLayout>
  );
}
