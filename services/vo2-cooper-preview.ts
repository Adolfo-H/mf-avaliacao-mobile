import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { CooperPreviewData, CooperPreviewResponse } from '@/types/vo2-cooper-preview';

export async function getCooperPreview(assessmentUuid: string): Promise<CooperPreviewData> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }
  const response = await apiRequest<CooperPreviewResponse>(
    `/assessments/${encodeURIComponent(assessmentUuid)}/vo2-max/cooper-preview`,
    { method: 'GET', token }
  );
  return response.data;
}
