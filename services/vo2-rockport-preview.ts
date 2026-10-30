import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { RockportPreviewData, RockportPreviewResponse } from '@/types/vo2-rockport-preview';

/** Consulta apenas o cálculo de conferência; não grava avaliações nem envia medidas. */
export async function getRockportPreview(assessmentUuid: string): Promise<RockportPreviewData> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');

  const response = await apiRequest<RockportPreviewResponse>(
    `/assessments/${encodeURIComponent(assessmentUuid)}/vo2-max/rockport-preview`,
    { method: 'GET', token }
  );
  return response.data;
}
