import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { GuedesPreviewResponse } from '@/types/guedes-preview';

export async function getAssessmentGuedesPreview(
  assessmentUuid: string
): Promise<GuedesPreviewResponse['data']> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  const response = await apiRequest<GuedesPreviewResponse>(
    `/assessments/${encodeURIComponent(assessmentUuid)}/body-composition/guedes-preview`,
    { method: 'GET', token }
  );
  return response.data;
}
