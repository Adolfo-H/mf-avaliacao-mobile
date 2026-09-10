import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentNeuromotor,
  AssessmentNeuromotorResponse,
  UpdateNeuromotorPayload,
} from '@/types/neuromotor-tests';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function getAssessmentNeuromotor(
  assessmentUuid: string
): Promise<AssessmentNeuromotor> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentNeuromotorResponse>(
      `/assessments/${assessmentUuid}/neuromotor-tests`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function updateAssessmentNeuromotor(
  assessmentUuid: string,
  payload: UpdateNeuromotorPayload
): Promise<AssessmentNeuromotor> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentNeuromotorResponse>(
      `/assessments/${assessmentUuid}/neuromotor-tests`,
      {
        method: 'PUT',
        token,
        body: JSON.stringify(payload),
      }
    );

  return response.data;
}
