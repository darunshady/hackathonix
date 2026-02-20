/**
 * NanoBiz — Expanded API Service Layer
 *
 * Provides typed wrapper functions around the Axios instance
 * for all backend endpoints. Uses the existing api.js base.
 *
 * ──────────────────────────────────────────────────────────────
 * USAGE:
 *   import { fetchCustomers, createInvoice, ... } from "../services/apiService";
 * ──────────────────────────────────────────────────────────────
 *
 * NOTE: This is a NEW file. The existing api.js (Axios instance)
 *       is untouched and still works for anyone importing it directly.
 */

import api from "./api";

// ────────────────────────────────────────────────────────────────
// Customers
// ────────────────────────────────────────────────────────────────

export async function fetchCustomers() {
  const { data } = await api.get("/customers");
  return data;
}

export async function fetchCustomer(clientId) {
  const { data } = await api.get(`/customers/${clientId}`);
  return data;
}

export async function createCustomer(customer) {
  const { data } = await api.post("/customers", customer);
  return data;
}

export async function updateCustomer(clientId, updates) {
  const { data } = await api.put(`/customers/${clientId}`, updates);
  return data;
}

export async function recalculateBalance(clientId) {
  const { data } = await api.post(`/customers/${clientId}/recalculate`);
  return data;
}

// ────────────────────────────────────────────────────────────────
// Invoices
// ────────────────────────────────────────────────────────────────

export async function fetchInvoices(customerId = null) {
  const params = customerId ? { customerId } : {};
  const { data } = await api.get("/invoices", { params });
  return data;
}

export async function createInvoice(invoice) {
  const { data } = await api.post("/invoices", invoice);
  return data;
}

export async function updateInvoice(clientId, updates) {
  const { data } = await api.put(`/invoices/${clientId}`, updates);
  return data;
}

export async function markWhatsappSent(clientId) {
  const { data } = await api.put(`/invoices/${clientId}/whatsapp-sent`);
  return data;
}

// ────────────────────────────────────────────────────────────────
// Ledger
// ────────────────────────────────────────────────────────────────

export async function fetchLedger(customerId = null) {
  const params = customerId ? { customerId } : {};
  const { data } = await api.get("/ledger", { params });
  return data;
}

export async function createLedgerEntry(entry) {
  const { data } = await api.post("/ledger", entry);
  return data;
}

export async function fetchCustomerBalance(customerId) {
  const { data } = await api.get(`/ledger/balance/${customerId}`);
  return data;
}

// ────────────────────────────────────────────────────────────────
// Sync
// ────────────────────────────────────────────────────────────────

export async function bulkSync(payload) {
  const { data } = await api.post("/sync", payload);
  return data;
}

// ────────────────────────────────────────────────────────────────
// WhatsApp
// ────────────────────────────────────────────────────────────────

export async function sendWhatsApp(invoiceClientId) {
  const { data } = await api.post("/send-whatsapp", { invoiceClientId });
  return data;
}

// ────────────────────────────────────────────────────────────────
// Voice / AI
// ────────────────────────────────────────────────────────────────

export async function processVoice(transcript) {
  const { data } = await api.post("/voice-process", { transcript });
  return data;
}

// ────────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────────

export async function healthCheck() {
  const { data } = await api.get("/health");
  return data;
}
