"use strict";

const crypto = require("crypto");
const Logger = require("../../../../config/logger.js");

const BASE_URL = process.env.NETWORK_BASE_URL;
const API_KEY = process.env.NETWORK_API_KEY;
const MERCHANT_ID = process.env.NETWORK_MERCHANT_ID;
const WEBHOOK_SECRET = process.env.NETWORK_WEBHOOK_SECRET;

class NetworkService {
  /**
   * Obtain a short-lived Bearer token from N-Genius.
   * Tokens expire in ~5 minutes; always fetch a fresh one per request.
   * POST /identity/auth/access-token
   */
  static async getAccessToken() {
    const url = `${BASE_URL}/identity/auth/access-token`;

    console.log(`[Network] Fetching access token from ${url} with API_KEY=${API_KEY}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${API_KEY}`,
        "Content-Type": "application/vnd.ni-identity.v1+json",
      },
      body: JSON.stringify({ realmName: "ni" }),
    });

    if (!response.ok) {
      const text = await response.text();
      Logger.error(`[Network] getAccessToken failed ${response.status}: ${text}`);
      throw new Error(`N-Genius auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Create a payment session on the Network Payment Gateway.
   * POST /transactions/outlets/{outletRef}/orders
   *
   * @param {object} params
   * @param {number} params.amount          - Amount in major units (e.g. 100.00)
   * @param {string} params.currency        - e.g. "USD" or "AED"
   * @param {string} params.orderReference  - Our internal order reference for reconciliation
   * @param {string} params.returnUrl       - Redirect URL after successful payment
   * @param {string} params.cancelUrl       - Redirect URL on cancellation
   * @param {string} [params.description]   - Optional payment description
   */
  static async createPayment({ amount, currency = "AED", orderReference, returnUrl, cancelUrl, email }) {
    const token = await this.getAccessToken();
    const url = `${BASE_URL}/transactions/outlets/${MERCHANT_ID}/orders`;

    // Network API expects amount in minor currency units (cents/fils)
    const amountInMinorUnits = Math.round(parseFloat(amount) * 100);

    const body = {
      action: "SALE",
      amount: {
        currencyCode: currency,
        value: amountInMinorUnits,
      },
      emailAddress: email,
      merchantAttributes: {
        redirectUrl: returnUrl,
        cancelUrl: cancelUrl,
        skipConfirmationPage: true,
      },
      merchantOrderReference: orderReference,
    };

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/vnd.ni-payment.v2+json",
          Accept: "application/vnd.ni-payment.v2+json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      const reason = err.name === "TimeoutError" ? "timed out after 15s" : `network error – ${err.cause?.code ?? err.message}`;
      Logger.error(`[Network] createPayment fetch failed: ${reason} (url=${url})`);
      throw new Error(`Payment gateway unreachable: ${reason}`);
    }

    if (!response.ok) {
      const text = await response.text();
      Logger.error(`[Network] createPayment failed ${response.status}: ${text}`);
      throw new Error(`Network payment creation failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      transactionId: data.reference,
      paymentUrl: data._links?.payment?.href,
    };
  }

  /**
   * Verify a webhook signature using HMAC-SHA256.
   * Signature = HMAC_SHA256(transaction_id + amount + reference, WEBHOOK_SECRET)
   *
   * @param {string} transactionId
   * @param {number|string} amount    - Amount as received in webhook payload (minor units integer)
   * @param {string} reference        - Order reference
   * @param {string} receivedSignature
   * @returns {boolean}
   */
  static verifyWebhookSignature(transactionId, amount, reference, receivedSignature) {
    const payload = `${transactionId}${amount}${reference}`;
    const expectedSignature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");

    // Use timingSafeEqual to prevent timing attacks
    try {
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      const receivedBuf = Buffer.from(receivedSignature, "hex");
      if (expectedBuf.length !== receivedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, receivedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Map Network Gateway status string to our internal payment_status enum.
   *
   * @param {string} networkStatus - Status from webhook or polling
   * @returns {"paid"|"failed"|"pending"}
   */
  static mapStatus(state) {
    switch (state) {
      case "CAPTURED":
      case "PURCHASED":
        return "paid";
      case "FAILED":
      case "DECLINED":
      case "GATEWAY_RISK_PRE_AUTH_REJECTED": // ✅ add this
      case "GATEWAY_RISK_POST_AUTH_REJECTED": // ✅ also add post-auth rejection
        return "failed";
      case "REFUNDED":
      case "REVERSED":
        return "refunded";
      case "INITIATED":
      case "AWAIT_PAYMENT":
      case "AWAIT_3DS":
      case "AUTHORISED":
        return "pending";
      default:
        Logger.warn(`[Webhook] Unknown state: ${state}`);
        return "pending";
    }
  }
}

module.exports = NetworkService;
