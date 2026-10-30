import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import { getAssessmentBodyComposition, updateAssessmentBodyComposition } from '@/services/body-composition';
import type { AssessmentBodyComposition, UpdateBodyCompositionPayload } from '@/types/body-composition';
import type {
  WeltmanMeasurements,
  WeltmanPreview,
  WeltmanPreviewResponse,
} from '@/types/weltman-preview';

async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  return token;
}

export async function getWeltmanSavedRecord(assessmentUuid: string): Promise<{
  record: WeltmanMeasurements;
  protocol: string | null;
  weight_kg: number | null;
  height_m: number | null;
}> {
  const response: AssessmentBodyComposition = await getAssessmentBodyComposition(assessmentUuid);
  const payload = response.body_composition as typeof response.body_composition & {
    weltman?: Partial<WeltmanMeasurements> | null;
  };
  const weltman = payload.weltman;
  return {
    record: {
      abdomen_upper_cm: weltman?.abdomen_upper_cm ?? null,
      abdomen_umbilicus_cm: weltman?.abdomen_umbilicus_cm ?? null,
      applicability_confirmed: weltman?.applicability_confirmed === true,
    },
    protocol: payload.protocol ?? null,
    weight_kg: payload.weight_kg ?? null,
    height_m: payload.height_m ?? null,
  };
}

export async function saveWeltmanRecord(
  assessmentUuid: string,
  measurements: WeltmanMeasurements
): Promise<void> {
  // O PUT já existente salva payload encrypted:array; não modifica o campo results.
  const payload: UpdateBodyCompositionPayload & { weltman: WeltmanMeasurements } = {
    protocol: 'weltman',
    weltman: measurements,
  };
  await updateAssessmentBodyComposition(assessmentUuid, payload);
}

export async function getWeltmanPreview(assessmentUuid: string): Promise<WeltmanPreview> {
  const token = await requireToken();
  const response = await apiRequest<WeltmanPreviewResponse>(
    `/assessments/${assessmentUuid}/body-composition/weltman-preview`,
    { method: 'GET', token }
  );
  return response.data;
}
