import api from "./api";

/**
 * Send a natural-language sentence to the backend AI route
 * and receive structured invoice JSON.
 *
 * @param {string} sentence  — e.g. "Sold 5 bags of cement to Ramesh for 2500"
 * @returns {Promise<{
 *   transaction_type: "selling"|"buying"|"payment",
 *   party_name: string,
 *   item_name: string|null,
 *   quantity: number|null,
 *   amount: number,
 *   payment_method: "cash"|"upi"|"bank"|null
 * }>}
 */
export async function parseWithAI(sentence) {
  const response = await api.post("/ai/parse", { sentence });
  return response.data;
}
