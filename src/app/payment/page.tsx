"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadMockPaymentWidget, shouldUseMockPayment } from "@/lib/mockPayment";
import SimpleTossWidget from "@/components/payment/SimpleTossWidget";
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

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

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

  const paymentWidgetRef = useRef<any>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [showTossWidget, setShowTossWidget] = useState(false);

  // 이벤트 데이터 및 사용자 정보 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 사용자 데이터 로드
        const pendingUserData = sessionStorage.getItem("pendingUser");
        const parsedUserData = pendingUserData
          ? JSON.parse(pendingUserData)
          : null;

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

  // 위젯 타입 결정
  useEffect(() => {
    if (!paymentInfo || !userData) return;

    const useMock = shouldUseMockPayment();
    setIsUsingMock(useMock);

    if (useMock) {
      // 모의 결제 위젯 초기화
      const initMockWidget = async () => {
        try {
          const customerKey = `customer_${userData.kakaoId}`;
          const mockWidget = await loadMockPaymentWidget(TOSS_CLIENT_KEY, customerKey);
          paymentWidgetRef.current = mockWidget;

          // DOM이 준비될 때까지 기다린 후 렌더링
          setTimeout(() => {
            try {
              mockWidget.renderPaymentMethods("#mock-payment-methods", { value: paymentInfo.amount });
              mockWidget.renderAgreement("#mock-agreement");
              setWidgetReady(true);
            } catch (error) {
              console.error("Mock widget render error:", error);
              setError("모의 결제 위젯을 렌더링할 수 없습니다.");
            }
          }, 500);
        } catch (error) {
          console.error("Mock widget init error:", error);
          setError("모의 결제 위젯을 초기화할 수 없습니다.");
        }
      };

      initMockWidget();
    } else {
      // 실제 Toss 위젯 사용
      setShowTossWidget(true);
    }
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
      sessionStorage.setItem(
        "paymentOrder",
        JSON.stringify({
          orderId,
          amount: paymentInfo.amount,
          orderName: paymentInfo.eventName,
          userData,
        })
      );

      // 토스페이먼츠 결제 요청 (공식 예제 방식)
      if (isUsingMock) {
        // 모의 결제는 amount 파라미터 필요
        await paymentWidgetRef.current.requestPayment({
          orderId,
          orderName: paymentInfo.eventName,
          customerName: userData.name,
          customerMobilePhone: userData.phoneNumber.replace(/[^0-9]/g, ""),
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
          amount: paymentInfo.amount,
        });
      } else {
        // 공식 예제와 동일한 방식
        console.log("🚀 Requesting payment with widgets:", paymentWidgetRef.current);

        // 전화번호 정규화 및 검증
        let cleanPhoneNumber = userData.phoneNumber.replace(/[^0-9]/g, "");

        // 전화번호 길이 검증 (한국 휴대폰: 11자리)
        if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 11) {
          console.warn("📱 Invalid phone length:", cleanPhoneNumber);
          // 기본값으로 설정 (테스트용)
          cleanPhoneNumber = "01012341234";
        }

        console.log("📱 Original phone:", userData.phoneNumber, "→ Clean:", cleanPhoneNumber);

        await paymentWidgetRef.current.requestPayment({
          orderId: orderId,
          orderName: paymentInfo.eventName,
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
          customerEmail: "customer@example.com", // 공식 예제처럼 추가
          customerName: userData.name,
          customerMobilePhone: cleanPhoneNumber,
        });
      }
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
        {/* Mock 모드 알림 */}
        {isUsingMock && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <span className="font-semibold">테스트 모드</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Toss 승인 전까지 임의로 넣어둔 모의 결제입니다.
            </p>
          </div>
        )}
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
                {/* <li>• 간단한 안주 및 주류</li> */}
                <li>• 서비스 이용료</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 토스페이먼츠 결제 위젯 */}
        {isUsingMock ? (
          // 모의 결제 위젯
          <div key="mock-payment">
            <div id="mock-payment-methods" className="min-h-[200px]">
              {!widgetReady && (
                <div className="flex justify-center items-center h-[200px]">
                  <LoadingSpinner size="md" text="모의 결제 로딩 중..." />
                </div>
              )}
            </div>
            <div id="mock-agreement" />
          </div>
        ) : showTossWidget && paymentInfo && userData ? (
          // 실제 Toss 위젯 (공식 예제 방식)
          <SimpleTossWidget
            key={`simple-toss-${userData.kakaoId}-${paymentInfo.amount}`}
            clientKey={TOSS_CLIENT_KEY}
            customerKey={`customer_${userData.kakaoId}`}
            amount={paymentInfo.amount}
            onReady={() => setWidgetReady(true)}
            onError={(error) => setError(error)}
            onPaymentRequest={(widgets) => {
              paymentWidgetRef.current = widgets;
              console.log("🎯 Payment widgets ready for use");
            }}
          />
        ) : (
          // 로딩 상태
          <div className="flex justify-center items-center h-[200px]">
            <LoadingSpinner size="md" text="결제 위젯 준비 중..." />
          </div>
        )}

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
          <CardContent className="pt-1">
            <div className="space-y-2 text-xs text-gray-600">
              <h4 className="font-bold text-sm text-gray-800 mb-2">
                결제 안내사항
              </h4>
              <p>• 환불/취소는 이벤트 하루 전까지 가능해요.</p>
              {/* <p>• 계좌 입금 희망시: 국민 01027695861 (이중후)</p> */}
              <p>• 다른 문의 사항들은 DM 주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
