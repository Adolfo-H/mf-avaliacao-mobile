import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type {
  StudentAssessmentHistoryOptions,
  StudentAssessmentHistoryResponse,
} from '@/types/assessment-history';

export async function listStudentAssessmentHistory(
  studentUuid: string,
  options: StudentAssessmentHistoryOptions = {}
): Promise<StudentAssessmentHistoryResponse> {
  const token = await getToken();

  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  params.set('per_page', String(options.per_page ?? 10));

  if (options.status) {
    params.set('status', options.status);
  }

  const endpoint =
    `/students/${encodeURIComponent(studentUuid)}` +
    `/assessment-history?${params.toString()}`;

  return apiRequest<StudentAssessmentHistoryResponse>(endpoint, {
    method: 'GET',
    token,
  });
}
