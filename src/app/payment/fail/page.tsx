"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// 에러 코드에 따른 한글 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
  PAY_PROCESS_ABORTED: "결제 진행 중 문제가 발생했습니다.",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT: "일일 결제 한도를 초과했습니다.",
  EXCEED_MAX_PAYMENT_AMOUNT: "결제 금액 한도를 초과했습니다.",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 만료되었습니다.",
  INVALID_STOPPED_CARD: "정지된 카드입니다.",
  INVALID_CARD_LOST_OR_STOLEN: "분실 또는 도난 신고된 카드입니다.",
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "할부가 지원되지 않는 카드입니다.",
  INVALID_CARD_NUMBER: "카드 번호가 올바르지 않습니다.",
  BELOW_MINIMUM_AMOUNT: "최소 결제 금액 이하입니다.",
  ALREADY_PROCESSED_PAYMENT: "이미 처리된 결제입니다.",
  NOT_FOUND_PAYMENT: "결제 정보를 찾을 수 없습니다.",
  NOT_FOUND_PAYMENT_SESSION: "결제 세션이 만료되었습니다.",
};

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("code") || "UNKNOWN_ERROR";
  const errorMessage = searchParams.get("message") || "알 수 없는 오류가 발생했습니다.";

  // 한글 메시지가 있으면 사용, 없으면 토스에서 받은 메시지 사용
  const displayMessage = ERROR_MESSAGES[errorCode] || errorMessage;

  return (
    <AppLayout title="결제 실패">
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <span className="text-2xl">❌</span>
              <span>결제에 실패했습니다</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-red-100">
              <p className="text-red-700 font-medium">{displayMessage}</p>
              {errorCode !== "UNKNOWN_ERROR" && (
                <p className="text-xs text-gray-500 mt-2">
                  오류 코드: {errorCode}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/payment")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                다시 결제하기
              </Button>
              <Button
                onClick={() => router.push("/status")}
                variant="outline"
                className="w-full"
              >
                이벤트 페이지로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 도움말 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="space-y-3 text-sm text-gray-600">
              <h4 className="font-bold text-gray-800">결제가 계속 실패하나요?</h4>
              <ul className="space-y-2">
                <li>• 다른 카드로 시도해보세요.</li>
                <li>• 카드사 앱에서 한도를 확인해주세요.</li>
                <li>• 계좌 이체를 원하시면 아래 계좌로 입금해주세요.</li>
              </ul>
              <div className="bg-white p-3 rounded-lg border mt-3">
                <p className="font-medium text-gray-800">계좌 입금 안내</p>
                <p className="text-blue-600 font-mono mt-1">
                  국민은행 01027695861 (이중후)
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                문의사항은 DM으로 연락주세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <AppLayout title="결제 실패">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" text="로딩 중..." />
          </div>
        </AppLayout>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
