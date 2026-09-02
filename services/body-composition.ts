import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentBodyComposition,
  AssessmentBodyCompositionResponse,
  UpdateBodyCompositionPayload,
} from '@/types/body-composition';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function getAssessmentBodyComposition(
  assessmentUuid: string
): Promise<AssessmentBodyComposition> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentBodyCompositionResponse>(
      `/assessments/${assessmentUuid}/body-composition`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function updateAssessmentBodyComposition(
  assessmentUuid: string,
  payload: UpdateBodyCompositionPayload
): Promise<AssessmentBodyComposition> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentBodyCompositionResponse>(
      `/assessments/${assessmentUuid}/body-composition`,
      {
        method: 'PUT',
        token,

        body: JSON.stringify(
          payload
        ),
      }
    );

  return response.data;
}