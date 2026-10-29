import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type { AssessmentPhotoComparisonResponse } from '@/types/assessment-photo-comparison';

export async function getStudentAssessmentPhotoComparison(
  studentUuid: string,
  firstUuid: string,
  secondUuid: string
): Promise<AssessmentPhotoComparisonResponse['data']> {
  const token = await getToken();

  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const params = new URLSearchParams({
    first_uuid: firstUuid,
    second_uuid: secondUuid,
  });

  const result = await apiRequest<AssessmentPhotoComparisonResponse>(
    `/students/${encodeURIComponent(studentUuid)}` +
      `/assessment-photo-comparison?${params.toString()}`,
    { method: 'GET', token, cache: 'no-store' }
  );

  return result.data;
}
