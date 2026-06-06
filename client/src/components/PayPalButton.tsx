import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PayPalButtonProps {
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  amount: string;
  description: string;
  className?: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalButton({
  onSuccess,
  onError,
  amount,
  description,
  className = "",
}: PayPalButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load PayPal SDK dynamically
    const loadPayPalScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.paypal) {
          setIsScriptLoaded(true);
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || "test"}&currency=USD&vault=true`;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve();
        };
        script.onerror = () => {
          reject(new Error("Failed to load PayPal SDK"));
        };
        document.body.appendChild(script);
      });
    };

    loadPayPalScript().catch(error => {
      console.error("PayPal SDK load error:", error);
      onError(error);
    });
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !paypalContainerRef.current || !window.paypal) return;

    // Clear previous PayPal buttons
    paypalContainerRef.current.innerHTML = "";

    // Render PayPal button
    window.paypal.Buttons({
      createSubscription: (data: any, actions: any) => {
        return actions.subscription.create({
          plan_id: import.meta.env.VITE_PAYPAL_PLAN_ID || "P-PLAN_ID",
        });
      },
      onApprove: async (data: any) => {
        setIsLoading(true);
        try {
          // In production, you'd verify the subscription with your backend
          await onSuccess({
            subscriptionID: data.subscriptionID,
            orderID: data.orderID,
          });
        } catch (error) {
          onError(error);
        } finally {
          setIsLoading(false);
        }
      },
      onError: (error: any) => {
        console.error("PayPal error:", error);
        onError(error);
      },
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "subscribe",
      },
    }).render(paypalContainerRef.current);
  }, [isScriptLoaded, onSuccess, onError]);

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400 text-sm">Loading PayPal...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <span className="ml-2 text-purple-300 text-sm">Processing payment...</span>
      </div>
    );
  }

  return (
    <div ref={paypalContainerRef} className={className}>
      <div className="text-xs text-slate-400 mt-2 text-center">
        Secure payment powered by PayPal
      </div>
    </div>
  );
}

// Simple one-time payment version for testing
export function PayPalPaymentButton({
  onSuccess,
  onError,
  amount,
  description,
  className = "",
}: PayPalButtonProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPayPalScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.paypal) {
          setIsScriptLoaded(true);
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || "test"}&currency=USD`;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve();
        };
        script.onerror = () => {
          reject(new Error("Failed to load PayPal SDK"));
        };
        document.body.appendChild(script);
      });
    };

    loadPayPalScript().catch(error => {
      console.error("PayPal SDK load error:", error);
      onError(error);
    });
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !paypalContainerRef.current || !window.paypal) return;

    paypalContainerRef.current.innerHTML = "";

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
              currency_code: "USD",
            },
            description: description,
          }],
        });
      },
      onApprove: async (data: any, actions: any) => {
        setIsLoading(true);
        try {
          await actions.order.capture();
          await onSuccess({
            orderID: data.orderID,
            payerID: data.payerID,
          });
        } catch (error) {
          onError(error);
        } finally {
          setIsLoading(false);
        }
      },
      onError: (error: any) => {
        console.error("PayPal error:", error);
        onError(error);
      },
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "pay",
      },
    }).render(paypalContainerRef.current);
  }, [isScriptLoaded, amount, description, onSuccess, onError]);

  if (!isScriptLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400 text-sm">Loading PayPal...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        <span className="ml-2 text-purple-300 text-sm">Processing payment...</span>
      </div>
    );
  }

  return (
    <div ref={paypalContainerRef} className={className}>
      <div className="text-xs text-slate-400 mt-2 text-center">
        Secure payment powered by PayPal
      </div>
    </div>
  );
}
