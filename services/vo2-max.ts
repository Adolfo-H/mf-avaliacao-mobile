import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentVo2Max,
  AssessmentVo2MaxResponse,
  UpdateVo2MaxPayload,
} from '@/types/vo2-max';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  return token;
}

export async function getAssessmentVo2Max(
  assessmentUuid: string
): Promise<AssessmentVo2Max> {
  const token = await requireToken();

  const response = await apiRequest<AssessmentVo2MaxResponse>(
    `/assessments/${assessmentUuid}/vo2-max`,
    {
      method: 'GET',
      token,
    }
  );

  return response.data;
}

export async function updateAssessmentVo2Max(
  assessmentUuid: string,
  payload: UpdateVo2MaxPayload
): Promise<AssessmentVo2Max> {
  const token = await requireToken();

  const response = await apiRequest<AssessmentVo2MaxResponse>(
    `/assessments/${assessmentUuid}/vo2-max`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}
