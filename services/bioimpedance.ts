import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import type {
  BioimpedanceCompositionResponse,
  BioimpedancePreview,
  BioimpedancePreviewResponse,
  BioimpedanceRecord,
} from '@/types/bioimpedance';

async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  return token;
}

/** Reutiliza a composição corporal criptografada do Laravel. */
export async function getBioimpedanceRecord(assessmentUuid: string): Promise<BioimpedanceCompositionResponse['data']> {
  const token = await requireToken();
  const response = await apiRequest<BioimpedanceCompositionResponse>(
    `/assessments/${assessmentUuid}/body-composition`, { method: 'GET', token }
  );
  return response.data;
}

/** Persiste SOMENTE a transcrição do equipamento, não resultados oficiais. */
export async function saveBioimpedanceRecord(assessmentUuid: string, data: BioimpedanceRecord): Promise<void> {
  const token = await requireToken();
  await apiRequest(
    `/assessments/${assessmentUuid}/body-composition`,
    { method: 'PUT', token, body: JSON.stringify({ protocol: 'bioimpedance', bioimpedance: data }) }
  );
}

export async function getBioimpedancePreview(assessmentUuid: string): Promise<BioimpedancePreview> {
  const token = await requireToken();
  const response = await apiRequest<BioimpedancePreviewResponse>(
    `/assessments/${assessmentUuid}/body-composition/bioimpedance-preview`,
    { method: 'GET', token }
  );
  return response.data;
}
