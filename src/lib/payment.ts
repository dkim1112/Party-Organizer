/**
 * 토스페이먼츠 결제 관련 유틸리티 함수들
 */

// 주문 ID 생성
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `order_${timestamp}_${randomStr}`;
};

// 통화 포맷팅
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("ko-KR") + "원";
};

// 결제 상태 한글 변환
export const getPaymentStatusText = (
  status: "pending" | "completed" | "failed"
): string => {
  switch (status) {
    case "pending":
      return "결제 대기";
    case "completed":
      return "결제 완료";
    case "failed":
      return "결제 실패";
    default:
      return "알 수 없음";
  }
};

// 결제 수단 한글 변환
export const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    카드: "신용/체크카드",
    CARD: "신용/체크카드",
    간편결제: "간편결제",
    EASY_PAY: "간편결제",
    계좌이체: "계좌이체",
    TRANSFER: "계좌이체",
    가상계좌: "가상계좌",
    VIRTUAL_ACCOUNT: "가상계좌",
    휴대폰: "휴대폰 결제",
    MOBILE_PHONE: "휴대폰 결제",
  };
  return methodMap[method] || method;
};

// 결제 확인 API 호출
export const confirmPayment = async (
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{
  success: boolean;
  message: string;
  payment?: {
    paymentKey: string;
    orderId: string;
    status: string;
    amount: number;
    method: string;
    approvedAt: string;
  };
  code?: string;
}> => {
  const response = await fetch("/api/payment/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  return response.json();
};

// 테스트용 환경 체크
export const isTestEnvironment = (): boolean => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  return clientKey.startsWith("test_");
};

// 결제 금액 검증
export const validatePaymentAmount = (
  amount: number,
  expectedAmount: number
): boolean => {
  return amount === expectedAmount && amount > 0;
};

// 전화번호 정규화 (하이픈 제거)
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/-/g, "").replace(/\s/g, "");
};

// 결제 에러 메시지 변환
export const getPaymentErrorMessage = (code: string): string => {
  const errorMessages: Record<string, string> = {
    PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
    PAY_PROCESS_ABORTED: "결제 진행 중 문제가 발생했습니다.",
    REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다.",
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
    USER_CANCEL: "사용자가 결제를 취소했습니다.",
    INVALID_REQUEST: "잘못된 요청입니다.",
    FORBIDDEN_REQUEST: "허용되지 않은 요청입니다.",
  };
  return errorMessages[code] || "결제 처리 중 오류가 발생했습니다.";
};
