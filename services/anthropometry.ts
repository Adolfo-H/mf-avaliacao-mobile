import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentAnthropometry,
  AssessmentAnthropometryResponse,
  UpdateAnthropometryPayload,
} from '@/types/anthropometry';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function getAssessmentAnthropometry(
  assessmentUuid: string
): Promise<AssessmentAnthropometry> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentAnthropometryResponse>(
      `/assessments/${assessmentUuid}/anthropometry`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function updateAssessmentAnthropometry(
  assessmentUuid: string,
  payload: UpdateAnthropometryPayload
): Promise<AssessmentAnthropometry> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentAnthropometryResponse>(
      `/assessments/${assessmentUuid}/anthropometry`,
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
