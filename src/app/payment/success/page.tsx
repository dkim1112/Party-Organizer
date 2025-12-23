"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // URL에서 결제 정보 추출
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        if (!paymentKey || !orderId || !amount) {
          throw new Error("결제 정보가 올바르지 않습니다.");
        }

        // 세션 스토리지에서 주문 정보 가져오기
        const paymentOrderData = sessionStorage.getItem("paymentOrder");
        const pendingUserData = sessionStorage.getItem("pendingUser");

        if (!paymentOrderData || !pendingUserData) {
          throw new Error("주문 정보를 찾을 수 없습니다. 다시 시도해주세요.");
        }

        const paymentOrder = JSON.parse(paymentOrderData);
        const userData = JSON.parse(pendingUserData);

        // 금액 검증
        if (parseInt(amount) !== paymentOrder.amount) {
          throw new Error("결제 금액이 일치하지 않습니다.");
        }

        // 서버에서 결제 승인 처리
        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "결제 승인에 실패했습니다.");
        }

        // 결제 승인 성공 - 사용자 및 등록 생성
        const { createUser, createRegistration, getCurrentEvent } = await import(
          "@/lib/firestore"
        );

        console.log("Creating user in Firestore...");
        const userId = await createUser({
          kakaoId: userData.kakaoId,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          gender: userData.gender as "male" | "female",
          age: parseInt(userData.age),
        });

        console.log("User created with ID:", userId);

        // 현재 이벤트 가져오기
        const currentEvent = await getCurrentEvent();
        if (!currentEvent) {
          throw new Error("활성 이벤트를 찾을 수 없습니다");
        }

        console.log("Creating registration...");
        await createRegistration({
          userId,
          eventId: currentEvent.id,
          paymentStatus: "completed",
          paymentId: paymentKey,
          questionnaireAnswers: {},
        });

        console.log("Registration created successfully");

        // 결제 결과 저장
        sessionStorage.setItem(
          "paymentResult",
          JSON.stringify({
            success: true,
            paymentId: paymentKey,
            amount: parseInt(amount),
            userData,
          })
        );

        // 임시 데이터 삭제
        sessionStorage.removeItem("paymentOrder");
        sessionStorage.removeItem("pendingUser");

        setStatus("success");

        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } catch (error: any) {
        console.error("Payment confirmation error:", error);
        setErrorMessage(error.message || "결제 처리 중 오류가 발생했습니다.");
        setStatus("error");
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  if (status === "processing") {
    return (
      <AppLayout title="결제 처리 중">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <LoadingSpinner size="lg" text="결제를 확인하고 있습니다..." />
          <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
        </div>
      </AppLayout>
    );
  }

  if (status === "error") {
    return (
      <AppLayout title="결제 오류">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <span className="text-2xl">❌</span>
              <span>결제 처리 실패</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{errorMessage}</p>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push("/payment")}
                className="w-full"
              >
                다시 시도하기
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
      </AppLayout>
    );
  }

  return (
    <AppLayout title="결제 완료">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <span className="text-2xl">✅</span>
            <span>결제가 완료되었습니다!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-700">
            이벤트 참가 등록이 완료되었습니다.
          </p>
          <p className="text-sm text-gray-600">
            잠시 후 대시보드로 이동합니다...
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            대시보드로 이동
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <AppLayout title="결제 처리 중">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" text="로딩 중..." />
          </div>
        </AppLayout>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
