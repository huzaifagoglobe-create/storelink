import "server-only";

/**
 * Payment gateway layer.
 *
 * StoreLink talks to gateways through ONE small interface so you can add a real
 * provider (JazzCash, Easypaisa, Safepay, etc.) without touching the checkout or
 * order code. A working "sandbox" gateway is included so the whole online-payment
 * flow runs and is testable today — swap in a real adapter once you have that
 * provider's merchant credentials.
 *
 * To add a real gateway:
 *   1. Implement PaymentGateway (initiate + verify) using the provider's SDK/API.
 *   2. Add it to GATEWAYS below, keyed by name.
 *   3. Set PAYMENT_GATEWAY=<name> and the provider's keys in the environment.
 * Nothing else changes.
 */

export interface InitiateInput {
  orderId: string; // our order id
  amount: number; // PKR
  customerName: string;
  customerPhone: string;
  /** Where the gateway should send the buyer back to when done. */
  returnUrl: string;
  /** Server-to-server callback URL (for gateways that support it). */
  callbackUrl: string;
}

export interface InitiateResult {
  /** URL to send the buyer to in order to pay. */
  redirectUrl: string;
  /** The gateway's reference for this transaction. */
  gatewayRef: string;
}

export interface VerifyResult {
  status: "paid" | "failed" | "pending";
  gatewayRef: string;
}

export interface PaymentGateway {
  name: string;
  /** Human label shown to buyers, e.g. "Card / Wallet". */
  label: string;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  /** Confirm a transaction from callback/return params. */
  verify(params: Record<string, string>): Promise<VerifyResult>;
}

// ---------------------------------------------------------------------------
// Sandbox gateway — fully working, no credentials needed.
// It "redirects" to an internal mock payment page where the buyer taps
// Pay / Cancel, then returns to our verify endpoint. Lets you exercise the
// entire online-payment path locally and in staging.
// ---------------------------------------------------------------------------
const sandboxGateway: PaymentGateway = {
  name: "sandbox",
  label: "Card / Wallet (test)",
  async initiate({ orderId, amount, returnUrl }) {
    const gatewayRef = `SBX-${orderId}-${Date.now().toString(36)}`;
    // Our internal mock checkout page; it will bounce back to returnUrl.
    const redirectUrl =
      `/pay/sandbox?ref=${encodeURIComponent(gatewayRef)}` +
      `&amount=${encodeURIComponent(String(amount))}` +
      `&return=${encodeURIComponent(returnUrl)}`;
    return { redirectUrl, gatewayRef };
  },
  async verify(params) {
    // The mock page returns ?result=success|cancel and echoes the ref.
    const gatewayRef = params.ref ?? "";
    const status = params.result === "success" ? "paid" : "failed";
    return { status, gatewayRef };
  },
};

// ---------------------------------------------------------------------------
// Real gateways go here. Example skeletons (disabled until keys are provided):
//
// const jazzcashGateway: PaymentGateway = {
//   name: "jazzcash", label: "JazzCash",
//   async initiate({ orderId, amount, returnUrl }) {
//     // Build the JazzCash request (merchant id, password, HMAC-SHA256 hash of
//     // sorted fields with the integrity salt), POST/redirect to their hosted
//     // checkout, return { redirectUrl, gatewayRef: ppTxnRefNo }.
//   },
//   async verify(params) {
//     // Recompute the secure hash from the response fields and compare; map
//     // pp_ResponseCode "000" => paid, else failed.
//   },
// };
//
// const safepayGateway: PaymentGateway = { ... }  // create session, verify via signature
// ---------------------------------------------------------------------------

const GATEWAYS: Record<string, PaymentGateway> = {
  sandbox: sandboxGateway,
  // jazzcash: jazzcashGateway,
  // safepay: safepayGateway,
};

/** The active gateway (defaults to sandbox until a real one is configured). */
export function activeGateway(): PaymentGateway {
  const name = process.env.PAYMENT_GATEWAY || "sandbox";
  return GATEWAYS[name] ?? sandboxGateway;
}

/** Whether online payment is switched on at all. */
export function onlinePaymentEnabled(): boolean {
  // On by default in demo (no Supabase). In production, require an explicit
  // opt-in so it doesn't turn on before a real gateway is wired.
  if (process.env.PAYMENT_GATEWAY) return true;
  return process.env.NODE_ENV !== "production";
}
