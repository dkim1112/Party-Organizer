import { PaymentData } from '@/types';

// Mock payment processing for development
export const mockPayment = {
  process: async (paymentData: PaymentData): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    console.log('Mock payment processing:', paymentData);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        paymentId: `mock_payment_${Date.now()}`
      };
    } else {
      return {
        success: false,
        error: '결제가 실패했습니다. 카드 정보를 확인해주세요.'
      };
    }
  }
};

// Real Toss Payments integration (to be implemented when keys are available)
export const tossPayments = {
  process: async (paymentData: PaymentData) => {
    // TODO: Implement actual Toss Payments SDK integration
    console.log('Toss Payments processing:', paymentData);

    try {
      // This would be the actual Toss Payments implementation
      // const tossPayments = TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
      // const payment = tossPayments.payment({ amount: paymentData.amount });
      // const result = await payment.requestPayment('카드', {
      //   amount: paymentData.amount,
      //   orderId: paymentData.orderId,
      //   orderName: paymentData.orderName,
      //   customerName: paymentData.customerName,
      //   successUrl: `${window.location.origin}/payment/success`,
      //   failUrl: `${window.location.origin}/payment/fail`,
      // });

      // For now, fallback to mock payment
      return await mockPayment.process(paymentData);
    } catch (error) {
      console.error('Toss Payments error:', error);
      throw error;
    }
  }
};

export const generateOrderId = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('ko-KR') + '원';
};