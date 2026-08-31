import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  Assessment,
  AssessmentListResponse,
  AssessmentResponse,
  CreateAssessmentPayload,
  ListAssessmentsOptions,
  UpdateAssessmentPayload,
} from '@/types/assessment';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

export async function listAssessments(
  options: ListAssessmentsOptions = {}
): Promise<AssessmentListResponse> {
  const token = await requireToken();

  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set(
      'search',
      options.search.trim()
    );
  }

  if (options.student_uuid) {
    params.set(
      'student_uuid',
      options.student_uuid
    );
  }

  if (options.evaluator_id) {
    params.set(
      'evaluator_id',
      String(options.evaluator_id)
    );
  }

  if (options.status) {
    params.set(
      'status',
      options.status
    );
  }

  if (options.date_from) {
    params.set(
      'date_from',
      options.date_from
    );
  }

  if (options.date_to) {
    params.set(
      'date_to',
      options.date_to
    );
  }

  params.set(
    'page',
    String(options.page ?? 1)
  );

  return apiRequest<AssessmentListResponse>(
    `/assessments?${params.toString()}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function getAssessment(
  uuid: string
): Promise<Assessment> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentResponse>(
      `/assessments/${uuid}`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function createAssessment(
  payload: CreateAssessmentPayload
): Promise<Assessment> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentResponse>(
      '/assessments',
      {
        method: 'POST',
        token,

        body: JSON.stringify(
          payload
        ),
      }
    );

  return response.data;
}

export async function updateAssessment(
  uuid: string,
  payload: UpdateAssessmentPayload
): Promise<Assessment> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentResponse>(
      `/assessments/${uuid}`,
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

export async function completeAssessment(
  uuid: string
): Promise<Assessment> {
  const token = await requireToken();

  const response =
    await apiRequest<AssessmentResponse>(
      `/assessments/${uuid}/complete`,
      {
        method: 'POST',
        token,
      }
    );

  return response.data;
}