import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { Run2400PreviewData } from '@/types/vo2-2400-preview';

export async function getRun2400Preview(assessmentUuid: string): Promise<Run2400PreviewData> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const response = await apiRequest<{ data: Run2400PreviewData }>(
    `/assessments/${assessmentUuid}/vo2-max/2400m-preview`,
    { method: 'GET', token },
  );
  return response.data;
}
