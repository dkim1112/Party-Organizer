"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
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
import { generateOrderId } from "@/lib/payment";

// 테스트용 클라이언트 키 (실제 배포시 환경변수로 교체)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

interface PaymentInfo {
  amount: number;
  eventName: string;
  eventDate: string;
  participantFee: number;
}

interface UserData {
  kakaoId: string;
  name: string;
  phoneNumber: string;
  gender: string;
  age: string;
}

export default function PaymentPage() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const router = useRouter();

  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null);

  // 이벤트 데이터 및 사용자 정보 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 사용자 데이터 로드
        const pendingUserData = sessionStorage.getItem("pendingUser");
        const parsedUserData = pendingUserData ? JSON.parse(pendingUserData) : null;

        if (!parsedUserData) {
          router.push("/auth");
          return;
        }

        setUserData(parsedUserData);

        // 이벤트 데이터 로드
        const { getCurrentEvent } = await import("@/lib/firestore");
        const currentEvent = await getCurrentEvent();

        if (!currentEvent) {
          throw new Error("활성화된 이벤트가 없습니다.");
        }

        const eventDate = (currentEvent.date as any).toDate
          ? (currentEvent.date as any).toDate()
          : new Date(currentEvent.date as any);

        setPaymentInfo({
          amount: currentEvent.price,
          eventName: currentEvent.title,
          eventDate: eventDate.toLocaleDateString("ko-KR"),
          participantFee: currentEvent.price,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("데이터를 불러올 수 없습니다.");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [router]);

  // 토스 페이먼츠 위젯 초기화
  useEffect(() => {
    if (!paymentInfo || !userData) return;

    const initializeWidget = async () => {
      try {
        // 고객 키 생성 (카카오 ID 기반)
        const customerKey = `customer_${userData.kakaoId}`;

        // 결제 위젯 로드
        const paymentWidget = await loadPaymentWidget(TOSS_CLIENT_KEY, customerKey);
        paymentWidgetRef.current = paymentWidget;

        // 결제 수단 위젯 렌더링
        const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
          "#payment-methods",
          { value: paymentInfo.amount },
          { variantKey: "DEFAULT" }
        );
        paymentMethodsWidgetRef.current = paymentMethodsWidget;

        // 약관 동의 위젯 렌더링
        paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

        setWidgetReady(true);
      } catch (error) {
        console.error("Failed to initialize payment widget:", error);
        setError("결제 위젯을 초기화할 수 없습니다.");
      }
    };

    initializeWidget();
  }, [paymentInfo, userData]);

  const handleGoBack = () => {
    router.back();
  };

  const handlePayment = async () => {
    if (!paymentWidgetRef.current || !paymentInfo || !userData) {
      setError("결제 정보를 불러올 수 없습니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const orderId = generateOrderId();

      // 결제 정보를 세션 스토리지에 저장 (성공 페이지에서 사용)
      sessionStorage.setItem("paymentOrder", JSON.stringify({
        orderId,
        amount: paymentInfo.amount,
        orderName: paymentInfo.eventName,
        userData,
      }));

      // 토스페이먼츠 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName: paymentInfo.eventName,
        customerName: userData.name,
        customerMobilePhone: userData.phoneNumber.replace(/-/g, ""),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error: any) {
      // 사용자가 결제를 취소한 경우
      if (error.code === "USER_CANCEL") {
        setError("결제가 취소되었습니다.");
      } else {
        console.error("Payment error:", error);
        setError(error.message || "결제 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AppLayout title="참가비 결제" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="결제 정보를 불러오는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (!paymentInfo || !userData) {
    return (
      <AppLayout title="참가비 결제" showBackButton onBack={handleGoBack}>
        <div className="text-center space-y-4">
          <p className="text-red-600">
            {error || "결제 정보를 불러올 수 없습니다."}
          </p>
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
        {/* 결제 정보 */}
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
              <h4 className="font-medium text-blue-800 mb-2">
                참가비 포함 내역
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 이벤트 진행비</li>
                <li>• 간단한 안주 및 주류</li>
                <li>• 서비스 이용료</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 토스페이먼츠 결제 위젯 */}
        <Card>
          <CardHeader>
            <CardTitle>결제 수단 선택</CardTitle>
            <CardDescription>
              원하시는 결제 수단을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 결제 수단 위젯 영역 */}
            <div id="payment-methods" className="min-h-[300px]">
              {!widgetReady && (
                <div className="flex justify-center items-center h-[300px]">
                  <LoadingSpinner size="md" text="결제 수단 로딩 중..." />
                </div>
              )}
            </div>

            {/* 약관 동의 위젯 영역 */}
            <div id="agreement" />
          </CardContent>
        </Card>

        {/* 결제 버튼 */}
        <Button
          onClick={handlePayment}
          disabled={isLoading || !widgetReady}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            `${paymentInfo.amount.toLocaleString()}원 결제하기`
          )}
        </Button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* 결제 안내사항 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="space-y-2 text-xs text-gray-600">
              <h4 className="font-bold text-sm text-gray-800 mb-2">
                결제 안내사항
              </h4>
              <p>• 환불/취소는 이벤트 하루 전까지 가능해요.</p>
              <p>• 계좌 입금 희망시: 국민 01027695861 (이중후)</p>
              <p>• 다른 문의 사항들은 DM 주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
