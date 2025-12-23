/**
 * Mock payment implementation for testing without actual Toss client key
 */

interface MockPaymentRequest {
  orderId: string;
  orderName: string;
  customerName: string;
  customerMobilePhone: string;
  successUrl: string;
  failUrl: string;
  amount?: number;
}

interface MockPaymentWidget {
  renderPaymentMethods: (selector: string, config: any) => void;
  renderAgreement: (selector: string) => void;
  requestPayment: (request: MockPaymentRequest) => Promise<void>;
}

class MockPaymentWidgetInstance implements MockPaymentWidget {
  renderPaymentMethods(selector: string, config: any): void {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = `
        <div class="p-4 text-center text-gray-600 bg-gray-50 rounded-lg">
          <div class="text-sm">모의 결제 모드 - 결제 버튼을 눌러주세요</div>
        </div>
      `;
    }
  }

  renderAgreement(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = `
        <div class="p-4 text-center text-gray-600 bg-gray-50 rounded-lg">
          <div class="text-sm">약관 동의 (테스트 모드)</div>
        </div>
      `;
    }
  }

  async requestPayment(request: MockPaymentRequest): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 항상 성공으로 리디렉션
        const mockPaymentKey = `test_payment_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const url = new URL(request.successUrl);
        url.searchParams.append("paymentKey", mockPaymentKey);
        url.searchParams.append("orderId", request.orderId);
        url.searchParams.append("amount", request.amount?.toString() || "0");

        window.location.href = url.toString();
        resolve();
      }, 1000);
    });
  }
}

// 모의 loadPaymentWidget 함수
export const loadMockPaymentWidget = async (
  clientKey: string,
  customerKey: string
): Promise<MockPaymentWidget> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return new MockPaymentWidgetInstance();
};

// 환경 확인 함수
export const shouldUseMockPayment = (): boolean => {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  return !clientKey || clientKey === "test_ck_demo_client_key_here";
};