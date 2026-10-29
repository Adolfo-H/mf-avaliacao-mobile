import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { DashboardSummary, DashboardSummaryResponse } from '@/types/dashboard-summary';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const response = await apiRequest<DashboardSummaryResponse>('/dashboard/summary', {
    method: 'GET',
    token,
  });

  return response.data;
}
