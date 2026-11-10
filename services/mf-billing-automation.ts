import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { BillingAutomationInput, BillingAutomationSettings, BillingAutomationJob } from '@/types/mf-billing-automation';

async function request<T>(path: string, method = 'GET', body?: BillingAutomationInput): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão terminou. Entre novamente.');
  return apiRequest<T>(`/billing/automation/${path}`, {
    method,
    token,
    cache: 'no-store',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function getAutomationSettings(): Promise<BillingAutomationSettings> {
  return (await request<{data: BillingAutomationSettings}>('settings')).data;
}
export async function updateAutomationSettings(data: BillingAutomationInput): Promise<BillingAutomationSettings> {
  return (await request<{data: BillingAutomationSettings}>('settings', 'PUT', data)).data;
}
export async function getAutomationHistory(): Promise<BillingAutomationJob[]> {
  return (await request<{data: BillingAutomationJob[]}>('history')).data;
}
