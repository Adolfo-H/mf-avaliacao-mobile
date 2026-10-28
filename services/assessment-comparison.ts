import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { AssessmentComparisonResponse } from '@/types/assessment-comparison';

export async function getStudentAssessmentComparison(
  studentUuid: string,
  firstUuid: string,
  secondUuid: string
): Promise<AssessmentComparisonResponse['data']> {
  const token = await getToken();

  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const params = new URLSearchParams({
    first_uuid: firstUuid,
    second_uuid: secondUuid,
  });

  const result = await apiRequest<AssessmentComparisonResponse>(
    `/students/${encodeURIComponent(studentUuid)}` +
      `/assessment-comparison?${params.toString()}`,
    { method: 'GET', token }
  );

  return result.data;
}
