import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type {
  EvolutionPeriodMonths,
  StudentAssessmentEvolutionResponse,
} from '@/types/assessment-evolution';

export async function getStudentAssessmentEvolution(
  studentUuid: string,
  periodMonths: EvolutionPeriodMonths = 6
): Promise<StudentAssessmentEvolutionResponse['data']> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const url =
    `/students/${encodeURIComponent(studentUuid)}/assessment-evolution` +
    `?period_months=${periodMonths}`;

  const result = await apiRequest<StudentAssessmentEvolutionResponse>(url, {
    method: 'GET',
    token,
  });

  return result.data;
}
