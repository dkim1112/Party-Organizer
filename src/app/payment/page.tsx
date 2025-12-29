"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentWidgetRef = useRef<any>(null);

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

  // Check for refund parameter in URL
  useEffect(() => {
    const refundParam = searchParams.get("refund");
    if (refundParam === "true") {
      setShowRefundModal(true);
    }
  }, [searchParams]);

  const handleGoBack = () => {
    router.back();
  };

  const openRefundModal = () => {
    setShowRefundModal(true);
    // Update URL with refund parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("refund", "true");
    window.history.pushState({}, "", newUrl.toString());
  };

  const closeRefundModal = () => {
    setShowRefundModal(false);
    // Remove refund parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("refund");
    window.history.pushState({}, "", newUrl.toString());
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

      // 전화번호 정규화 및 검증
      let cleanPhoneNumber = userData.phoneNumber.replace(/[^0-9]/g, "");

      // 전화번호 길이 검증 (한국 휴대폰: 11자리)
      if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 11) {
        console.warn("📱 Invalid phone length:", cleanPhoneNumber);
        cleanPhoneNumber = "01012341234"; // 기본값으로 설정
      }

      await paymentWidgetRef.current.requestPayment({
        orderId: orderId,
        orderName: paymentInfo.eventName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: "customer@example.com",
        customerName: userData.name,
        customerMobilePhone: cleanPhoneNumber,
      });
    } catch (error: any) {
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
                {/* <li>• 간단한 안주 및 주류</li> */}
                <li>• 서비스 이용료</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 결제 안내사항 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-1">
            <div className="space-y-2 text-xs text-gray-600">
              <h4 className="font-bold text-xl text-gray-800 mb-4">
                결제 안내사항
              </h4>
              <div className="flex items-center space-x-1">
                <span>•</span>
                <button
                  onClick={openRefundModal}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  자세한 환불 규정은 여기서 확인해주세요.
                </button>
              </div>
              <p>
                • 상품 유효 기간은 결제 시점과 무관한, 이벤트 종료 시점이에요.
              </p>
              <p>• 기타 문의 사항은 DM 주세요.</p>
            </div>
          </CardContent>
        </Card>

        {/* 토스페이먼츠 결제 위젯 */}
        {paymentInfo && userData ? (
          <SimpleTossWidget
            key={`simple-toss-${userData.kakaoId}-${paymentInfo.amount}`}
            clientKey={TOSS_CLIENT_KEY}
            customerKey={`customer_${userData.kakaoId}`}
            amount={paymentInfo.amount}
            onReady={() => setWidgetReady(true)}
            onError={(error) => setError(error)}
            onPaymentRequest={(widgets) => {
              paymentWidgetRef.current = widgets;
            }}
          />
        ) : (
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

        {/* 환불 정책 모달 */}
        {showRefundModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeRefundModal}
          >
            <div
              className="bg-white rounded-lg p-6 m-4 max-w-md w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">환불 정책</h3>
                <button
                  onClick={closeRefundModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    환불 및 취소 규정
                  </h4>
                  <div className="space-y-6 text-sm">
                    <div>
                      <p className="font-medium mb-2">
                        1. 예약 확정 후 당일 취소 및 노쇼(No-show)의 경우
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        예약 확정 후 당일 취소 또는 사전 연락 없이
                        미방문(No-show) 시에는, 어떠한 경우에도 환불이
                        불가합니다.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium mb-2">
                        2. 방문일 기준 7일 이전 취소
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        방문일 기준 7일 전까지 취소 요청 시 결제 금액의 100%를
                        환불해드립니다.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium mb-2">
                        3. 방문일 기준 7일 이내 취소
                      </p>
                      <p className="text-gray-600 leading-relaxed mb-2">
                        방문일을 기준으로 7일 이내에 취소하는 경우, 아래 기준에
                        따라 환불이 제한됩니다.
                      </p>
                      <ul className="text-gray-600 space-y-1 ml-4">
                        <li>• 방문 6 ~ 4일 전 취소: 결제 금액의 50% 환불</li>
                        <li>• 방문 3 ~ 1일 전 취소: 결제 금액 환불 불가</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium mb-2">
                        4. 매장 사정으로 인한 취소
                      </p>
                      <p className="text-gray-600 leading-relaxed">
                        매장의 사정 (환불 처리 문제, 운영 불가 등)으로 예약이
                        취소될 경우, 결제 금액 전액을 환불 해드립니다.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium mb-2">5. 환불 처리 기간</p>
                      <p className="text-gray-600 leading-relaxed">
                        환불은 취소 확정일 기준 영업일 7~14일 이내 결제 수단에
                        따라 처리됩니다. 결제 수단에 따라 실제 환불 시점은 다소
                        차이가 있을 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mt-7 mb-2">
                    환불 절차
                  </h4>
                  <ul className="space-y-2">
                    <li>1. DM으로 환불 요청</li>
                    <li>2. 페이지 내에서 취소 신청</li>
                    <li>3. 환불 사유 확인</li>
                    <li>4. 환불 승인 후 처리</li>
                  </ul>
                </div>
                <div className="text-xs text-gray-500 mt-4 pt-3 border-t">
                  본 정책은 2025년 12월 29일에 최신화 되었습니다.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
