"use client";

import { useEffect, useRef } from "react";

// 전역 위젯 인스턴스 관리
let globalWidgetInstance: any = null;
let globalInitPromise: Promise<any> | null = null;
let isGloballyInitializing = false;

interface SimpleTossWidgetProps {
  clientKey: string;
  customerKey: string;
  amount: number;
  onReady: () => void;
  onError: (error: string) => void;
  onPaymentRequest: (widgets: any) => void;
}

export default function SimpleTossWidget({
  clientKey,
  customerKey,
  amount,
  onReady,
  onError,
  onPaymentRequest,
}: SimpleTossWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetsRef = useRef<any>(null);
  const initRef = useRef(false);
  const instanceId = useRef(`simple-${Date.now()}-${Math.random().toString(36).substring(2)}`);

  useEffect(() => {
    if (initRef.current) return;

    async function main() {
      try {
        initRef.current = true;

        // 전역 위젯이 이미 초기화 중이면 기다리기
        if (isGloballyInitializing && globalInitPromise) {
          console.log("⏳ Waiting for global widget initialization...");
          const widgets = await globalInitPromise;
          widgetsRef.current = widgets;
          onPaymentRequest(widgets);
          onReady();
          return;
        }

        // 전역 위젯이 이미 존재하면 재사용
        if (globalWidgetInstance) {
          console.log("♻️ Reusing existing global widget");

          // 금액 업데이트
          await globalWidgetInstance.setAmount({
            currency: "KRW",
            value: amount,
          });

          widgetsRef.current = globalWidgetInstance;
          onPaymentRequest(globalWidgetInstance);
          onReady();
          return;
        }

        isGloballyInitializing = true;

        // 새로운 전역 위젯 생성
        globalInitPromise = (async () => {
          // TossPayments 스크립트 로드 대기
          const checkTossPayments = () => {
            return new Promise<void>((resolve) => {
              const check = () => {
                if (typeof window !== 'undefined' && (window as any).TossPayments) {
                  resolve();
                } else {
                  setTimeout(check, 50);
                }
              };
              check();
            });
          };

          await checkTossPayments();

          console.log("🚀 Initializing new global Toss widget");

          // DOM 요소 정리
          const paymentSelector = `#simple-payment-method-${instanceId.current}`;
          const agreementSelector = `#simple-agreement-${instanceId.current}`;

          const paymentEl = document.querySelector(paymentSelector);
          const agreementEl = document.querySelector(agreementSelector);
          if (paymentEl) paymentEl.innerHTML = "";
          if (agreementEl) agreementEl.innerHTML = "";

          // 위젯 초기화
          const tossPayments = (window as any).TossPayments(clientKey);
          const widgets = tossPayments.widgets({ customerKey });

          // 금액 설정
          await widgets.setAmount({
            currency: "KRW",
            value: amount,
          });

          console.log("✅ Amount set:", amount);

          // 렌더링
          await new Promise(resolve => setTimeout(resolve, 200));

          await Promise.all([
            widgets.renderPaymentMethods({
              selector: paymentSelector,
              variantKey: "DEFAULT",
            }),
            widgets.renderAgreement({
              selector: agreementSelector,
              variantKey: "AGREEMENT"
            }),
          ]);

          console.log("✅ Global widget rendered successfully");

          globalWidgetInstance = widgets;
          isGloballyInitializing = false;
          globalInitPromise = null;

          return widgets;
        })();

        const widgets = await globalInitPromise;
        widgetsRef.current = widgets;
        onPaymentRequest(widgets);
        onReady();

      } catch (error: any) {
        console.error("❌ Widget initialization failed:", error);
        isGloballyInitializing = false;
        globalInitPromise = null;
        onError(error.message);
        initRef.current = false;
      }
    }

    main();

    return () => {
      console.log("🧹 Cleaning up simple widget");
      try {
        // 로컬 레퍼런스만 정리, 전역 인스턴스는 유지
        widgetsRef.current = null;
        initRef.current = false;
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    };
  }, [clientKey, customerKey, amount]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* 결제 UI */}
      <div>
        <div id={`simple-payment-method-${instanceId.current}`} className="min-h-[200px]"></div>
      </div>

      {/* 이용약관 UI */}
      <div>
        <div id={`simple-agreement-${instanceId.current}`}></div>
      </div>
    </div>
  );
}