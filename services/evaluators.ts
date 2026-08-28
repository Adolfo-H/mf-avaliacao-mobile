import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import {
  CreateEvaluatorPayload,
  Evaluator,
  EvaluatorListResponse,
  EvaluatorResponse,
  UpdateEvaluatorPayload,
} from '@/types/evaluator';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  return token;
}

export async function listEvaluators(
  page = 1
): Promise<EvaluatorListResponse> {
  const token = await requireToken();

  return apiRequest<EvaluatorListResponse>(
    `/evaluators?page=${page}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function getEvaluator(
  id: number
): Promise<Evaluator> {
  const token = await requireToken();

  const response = await apiRequest<EvaluatorResponse>(
    `/evaluators/${id}`,
    {
      method: 'GET',
      token,
    }
  );

  return response.data;
}

export async function createEvaluator(
  payload: CreateEvaluatorPayload
): Promise<Evaluator> {
  const token = await requireToken();

  const response = await apiRequest<EvaluatorResponse>(
    '/evaluators',
    {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}

export async function updateEvaluator(
  id: number,
  payload: UpdateEvaluatorPayload
): Promise<Evaluator> {
  const token = await requireToken();

  const response = await apiRequest<EvaluatorResponse>(
    `/evaluators/${id}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}

export async function updateEvaluatorStatus(
  id: number,
  active: boolean
): Promise<Evaluator> {
  const token = await requireToken();

  const response = await apiRequest<EvaluatorResponse>(
    `/evaluators/${id}/status`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({
        active,
      }),
    }
  );

  return response.data;
}