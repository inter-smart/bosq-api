"use strict";

const crypto = require("crypto");
const Logger = require("../../../../config/logger.js");

const BASE_URL = process.env.NETWORK_BASE_URL;
const API_KEY = process.env.NETWORK_API_KEY;
const MERCHANT_ID = process.env.NETWORK_MERCHANT_ID;
const WEBHOOK_SECRET = process.env.NETWORK_WEBHOOK_SECRET;

class NetworkService {
  /**
   * Create a payment session on the Network Payment Gateway.
   * POST /payments
   *
   * @param {object} params
   * @param {number} params.amount          - Amount in major units (e.g. 100.00)
   * @param {string} params.currency        - e.g. "USD" or "AED"
   * @param {string} params.orderReference  - Our internal order reference for reconciliation
   * @param {string} params.returnUrl       - Redirect URL after successful payment
   * @param {string} params.cancelUrl       - Redirect URL on cancellation
   * @param {string} [params.description]   - Optional payment description
   */
  static async createPayment({ amount, currency = "AED", orderReference, returnUrl, cancelUrl, description = "" }) {
    const url = `${BASE_URL}/payments`;

    // Network API expects amount in minor currency units (cents/fils)
    const amountInMinorUnits = Math.round(parseFloat(amount) * 100);

    const body = {
      merchant_id: MERCHANT_ID,
      amount: amountInMinorUnits,
      currency,
      reference: orderReference,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      description,
    };

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      const reason =
        err.name === "TimeoutError"
          ? "timed out after 15s"
          : `network error – ${err.cause?.code ?? err.message}`;
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
      transactionId: data.transaction_id,
      paymentUrl: data.payment_url,
      rawResponse: data,
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
    const expectedSignature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

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
  static mapStatus(networkStatus) {
    const status = (networkStatus || "").toUpperCase();
    if (["SUCCESS", "CAPTURED", "AUTHORISED", "PARTIALLY_CAPTURED"].includes(status)) {
      return "paid";
    }
    if (["FAILED", "REVERSED", "VOIDED", "CANCELLED", "DECLINED"].includes(status)) {
      return "failed";
    }
    return "pending";
  }
}

module.exports = NetworkService;
