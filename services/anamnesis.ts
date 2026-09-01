import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentAnamnesis,
  AssessmentAnamnesisResponse,
  UpdateAssessmentAnamnesisPayload,
} from '@/types/anamnesis';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function getAssessmentAnamnesis(
  assessmentUuid: string
): Promise<AssessmentAnamnesis> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentAnamnesisResponse>(
      `/assessments/${assessmentUuid}/anamnesis`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function updateAssessmentAnamnesis(
  assessmentUuid: string,
  payload: UpdateAssessmentAnamnesisPayload
): Promise<AssessmentAnamnesis> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentAnamnesisResponse>(
      `/assessments/${assessmentUuid}/anamnesis`,
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