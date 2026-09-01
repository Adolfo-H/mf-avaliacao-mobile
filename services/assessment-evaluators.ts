import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentEvaluatorListResponse,
  AssessmentEvaluatorOption,
} from '@/types/assessment-evaluator';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function listAssessmentEvaluators(): Promise<
  AssessmentEvaluatorOption[]
> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentEvaluatorListResponse>(
      '/assessment-evaluators',
      {
        method: 'GET',
        token,
      }
    );

  return response.data ?? [];
}