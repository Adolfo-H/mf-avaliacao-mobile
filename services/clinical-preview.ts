import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { AssessmentClinicalPreviewResponse } from '@/types/clinical-preview';

export async function getAssessmentClinicalPreview(
  assessmentUuid: string
): Promise<AssessmentClinicalPreviewResponse['data']> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const response = await apiRequest<AssessmentClinicalPreviewResponse>(
    `/assessments/${assessmentUuid}/body-composition/clinical-preview`,
    { method: 'GET', token, cache: 'no-store' }
  );
  return response.data;
}
