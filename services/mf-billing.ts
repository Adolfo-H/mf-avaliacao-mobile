import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { BillingAccountInput, BillingAccountResponse, BillingList, BillingPreview, BillingSettings, BillingSendResult, BillingReminder } from '@/types/mf-billing';
async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  return apiRequest<T>(`/billing${path}`, { method, token, cache: 'no-store', ...(body ? { body: JSON.stringify(body) } : {}) });
}
export async function billingSettings(): Promise<BillingSettings> { return (await request<{data: BillingSettings}>('/settings')).data; }
export function generateBillingMonth(month: string) { return request<{created: number}>('/generate','POST',{month}); }
export function listBilling(month: string, status: string, search: string, page: number) {
  return request<BillingList>(`/invoices?${new URLSearchParams({month,status,search,page:String(page)})}`);
}
export function billingAccount(uuid: string) { return request<BillingAccountResponse>(`/students/${encodeURIComponent(uuid)}`); }
export function saveBillingAccount(uuid: string, body: BillingAccountInput) { return request(`/students/${encodeURIComponent(uuid)}`,'PUT',body); }
export function payBilling(uuid: string, revision: number, paid_on: string, method: string) { return request(`/invoices/${uuid}/pay`,'POST',{revision,paid_on,method}); }
export function reverseBilling(uuid: string, revision: number, reason: string) { return request(`/invoices/${uuid}/reverse`,'POST',{revision,reason}); }
export function cancelBilling(uuid: string, revision: number, reason: string) { return request(`/invoices/${uuid}/cancel`,'POST',{revision,reason}); }
export function restoreBilling(uuid: string, revision: number, amount_cents: number, due_date: string, reason: string) { return request(`/invoices/${uuid}/restore`,'POST',{revision,amount_cents,due_date,reason}); }
export function adjustBilling(uuid: string, revision: number, amount_cents: number, due_date: string, reason: string) { return request(`/invoices/${uuid}/terms`,'PATCH',{revision,amount_cents,due_date,reason}); }
export async function previewBilling(uuid: string) { return (await request<{data: BillingPreview}>(`/invoices/${uuid}/preview`)).data; }
export function sendBillingReminder(uuid: string, revision: number, account_revision: number, channel: 'manual' | 'cloud', idempotency_key: string) {
  return request<BillingSendResult>(`/invoices/${uuid}/reminders`,'POST',{revision,account_revision,channel,idempotency_key,confirmed_unpaid:true});
}
export async function billingReminderHistory(uuid: string) { return (await request<{data: BillingReminder[]}>(`/invoices/${uuid}/reminders`)).data; }
export function resolveBillingReminder(uuid: string, outcome: 'manual_sent'|'not_sent'|'accepted', reason: string) { return request(`/reminders/${uuid}/resolve`,'POST',{outcome,reason}); }
