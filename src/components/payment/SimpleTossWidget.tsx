"use client";

import { useEffect, useRef, useState } from "react";

// Global state to prevent multiple initializations
let isGlobalScriptLoading = false;
let isGlobalScriptLoaded = false;
let globalWidgetInstances = new Set();

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
  const mountedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const instanceId = useRef(
    `toss-widget-${Date.now()}-${Math.random().toString(36).substring(2)}`
  );

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // First render the DOM elements
    setIsInitialized(true);

    // Then initialize the widget after a delay to ensure DOM is ready
    const timeoutId = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        // Load TossPayments script
        await loadTossScript();

        if (!mountedRef.current) return;

        const paymentSelector = `#payment-${instanceId.current}`;
        const agreementSelector = `#agreement-${instanceId.current}`;

        // Wait for DOM elements to exist
        await waitForElements(paymentSelector, agreementSelector);

        if (!mountedRef.current) return;

        // Clear existing content
        const paymentEl = document.querySelector(paymentSelector);
        const agreementEl = document.querySelector(agreementSelector);
        if (paymentEl) paymentEl.innerHTML = "";
        if (agreementEl) agreementEl.innerHTML = "";

        // Initialize widgets
        const tossPayments = (window as any).TossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey });

        // Set amount
        await widgets.setAmount({
          currency: "KRW",
          value: amount,
        });

        if (!mountedRef.current) return;

        // Render payment methods first
        await widgets.renderPaymentMethods({
          selector: paymentSelector,
          variantKey: "DEFAULT",
        });

        if (!mountedRef.current) return;

        // Render agreement
        await widgets.renderAgreement({
          selector: agreementSelector,
          variantKey: "AGREEMENT",
        });

        globalWidgetInstances.add(instanceId.current);
        widgetsRef.current = widgets;
        onPaymentRequest(widgets);
        onReady();
      } catch (error: any) {
        console.error("Widget initialization failed:", error);
        if (mountedRef.current) {
          onError(error.message || "위젯 초기화에 실패했습니다.");
        }
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      mountedRef.current = false;
      globalWidgetInstances.delete(instanceId.current);

      try {
        const paymentSelector = `#payment-${instanceId.current}`;
        const agreementSelector = `#agreement-${instanceId.current}`;

        const paymentEl = document.querySelector(paymentSelector);
        const agreementEl = document.querySelector(agreementSelector);
        if (paymentEl) paymentEl.innerHTML = "";
        if (agreementEl) agreementEl.innerHTML = "";

        widgetsRef.current = null;
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    };
  }, []);

  // Function to wait for DOM elements to exist
  const waitForElements = (
    paymentSelector: string,
    agreementSelector: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      const checkElements = () => {
        attempts++;
        const paymentEl = document.querySelector(paymentSelector);
        const agreementEl = document.querySelector(agreementSelector);

        if (paymentEl && agreementEl) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(
            new Error(
              `DOM elements not found: ${paymentSelector}, ${agreementSelector}`
            )
          );
        } else {
          setTimeout(checkElements, 100);
        }
      };

      checkElements();
    });
  };

  // Function to load TossPayments script
  const loadTossScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (isGlobalScriptLoaded && (window as any).TossPayments) {
        resolve();
        return;
      }

      // Currently loading
      if (isGlobalScriptLoading) {
        const checkLoaded = () => {
          if (isGlobalScriptLoaded && (window as any).TossPayments) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Start loading
      isGlobalScriptLoading = true;

      const existingScript = document.querySelector(
        'script[src*="tosspayments.com"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = "https://js.tosspayments.com/v2/standard";
      script.async = true;
      script.onload = () => {
        isGlobalScriptLoaded = true;
        isGlobalScriptLoading = false;
        resolve();
      };
      script.onerror = () => {
        isGlobalScriptLoading = false;
        reject(new Error("TossPayments script load failed"));
      };

      document.head.appendChild(script);
    });
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* 결제 UI */}
      <div className="rounded-xl overflow-hidden shadow-sm">
        <div id={`payment-${instanceId.current}`}></div>
      </div>

      {/* 이용약관 UI */}
      <div className="rounded-xl overflow-hidden shadow-sm">
        <div id={`agreement-${instanceId.current}`}></div>
      </div>
    </div>
  );
}
