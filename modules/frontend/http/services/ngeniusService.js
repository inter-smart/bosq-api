"use strict";

const Logger = require("../../../../config/logger.js");

const BASE_URL = process.env.NGENIUS_BASE_URL;
const API_KEY = process.env.NGENIUS_API_KEY;
const OUTLET = process.env.NGENIUS_OUTLET_REF;

class NgeniusService {
  /**
   * Obtain a short-lived Bearer token from N-Genius.
   * Tokens expire in ~5 minutes; always fetch a fresh one per request.
   * POST /identity/auth/access-token
   */
  static async getAccessToken() {
    const url = `${BASE_URL}/identity/auth/access-token`;

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
      Logger.error(`[Ngenius] getAccessToken failed ${response.status}: ${text}`);
      throw new Error(`N-Genius auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Create a payment order on N-Genius.
   * POST /transactions/outlets/{outletRef}/orders
   *
   * @param {object} params
   * @param {number} params.amountInFils  - grand_total * 100 (minor currency units)
   * @param {string} params.currency      - e.g. "AED"
   * @param {string} params.returnUrl     - where N-Genius redirects after payment
   * @param {string} params.merchantRef   - our internal BOSQ order code for reconciliation
   */
  static async createPaymentOrder({ amountInFils, currency = "AED", returnUrl, merchantRef }) {
    const token = await this.getAccessToken();

    const url = `${BASE_URL}/transactions/outlets/${OUTLET}/orders`;

    const body = {
      action: "SALE",
      amount: {
        currencyCode: currency,
        value: amountInFils,
      },
      merchantAttributes: {
        redirectUrl: returnUrl,
        skipConfirmationPage: true,
        cancelUrl: returnUrl,
      },
      merchantOrderReference: merchantRef,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ni-payment.v2+json",
        Accept: "application/vnd.ni-payment.v2+json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      Logger.error(`[Ngenius] createPaymentOrder failed ${response.status}: ${text}`);
      throw new Error(`N-Genius create order failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      paymentUrl: data._links?.payment?.href,
      ngeniusOrderRef: data.reference,
      rawResponse: data,
    };
  }

  /**
   * Retrieve the status of an existing N-Genius order.
   * GET /transactions/outlets/{outletRef}/orders/{orderReference}
   *
   * @param {string} ngeniusOrderRef - the reference stored in our DB
   */
  static async getPaymentStatus(ngeniusOrderRef) {
    const token = await this.getAccessToken();

    const url = `${BASE_URL}/transactions/outlets/${OUTLET}/orders/${ngeniusOrderRef}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.ni-payment.v2+json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      Logger.error(`[Ngenius] getPaymentStatus failed ${response.status}: ${text}`);
      throw new Error(`N-Genius status check failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      status: data.status,
      rawResponse: data,
    };
  }
}

module.exports = NgeniusService;
