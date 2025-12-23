import { NextRequest, NextResponse } from "next/server";

// 테스트용 시크릿 키 (실제 배포시 환경변수로 교체)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

// 토스페이먼츠 결제 승인 API URL
const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

interface ConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  easyPay?: {
    provider: string;
  };
  // ... 기타 필드
}

interface TossErrorResponse {
  code: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequest = await request.json();
    const { paymentKey, orderId, amount } = body;

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: "필수 파라미터가 누락되었습니다.",
          code: "MISSING_PARAMETER",
        },
        { status: 400 }
      );
    }

    // 금액 유효성 검증
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 결제 금액입니다.",
          code: "INVALID_AMOUNT",
        },
        { status: 400 }
      );
    }

    // Basic Auth 인코딩 (시크릿 키 + ":")
    const encryptedSecretKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

    // 토스페이먼츠 결제 승인 API 호출
    const response = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 토스 API 에러 응답
      const errorData = data as TossErrorResponse;
      console.error("Toss payment confirmation failed:", errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || "결제 승인에 실패했습니다.",
          code: errorData.code || "PAYMENT_CONFIRM_FAILED",
        },
        { status: response.status }
      );
    }

    // 결제 승인 성공
    const paymentData = data as TossPaymentResponse;
    console.log("Payment confirmed successfully:", {
      paymentKey: paymentData.paymentKey,
      orderId: paymentData.orderId,
      status: paymentData.status,
      amount: paymentData.totalAmount,
      method: paymentData.method,
    });

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 승인되었습니다.",
      payment: {
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        status: paymentData.status,
        amount: paymentData.totalAmount,
        method: paymentData.method,
        approvedAt: paymentData.approvedAt,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
