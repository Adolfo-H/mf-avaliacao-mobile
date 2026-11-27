import { prepareMFPhoto } from '@/lib/mf-photo-prepare';
import type { MFPhotoAsset } from '@/lib/mf-photo-common';

import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';
import {
  AssessmentProgressPhotos,
  AssessmentProgressPhotosResponse,
  ProgressPhotoItem,
  ProgressPhotoPosition,
  UpdatePhotoConsentPayload,
} from '@/types/progress-photos';

async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  return token;
}

function apiBase(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error('A URL da API não foi configurada.');
  }
  return url.replace(/\/+$/, '');
}

async function imageToBase64(asset: MFPhotoAsset): Promise<string> {
  return prepareMFPhoto(asset, 1600, 0.8);
}

export async function getAssessmentProgressPhotos(
  assessmentUuid: string
): Promise<AssessmentProgressPhotos> {
  const token = await requireToken();
  const response =
    await apiRequest<AssessmentProgressPhotosResponse>(
      `/assessments/${assessmentUuid}/progress-photos`,
      {
        method: 'GET',
        token,
      }
    );
  return response.data;
}

export async function savePhotoConsent(
  assessmentUuid: string,
  payload: UpdatePhotoConsentPayload
): Promise<void> {
  const token = await requireToken();
  await apiRequest(
    `/assessments/${assessmentUuid}/progress-photos/consent`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function revokePhotoConsent(
  assessmentUuid: string
): Promise<void> {
  const token = await requireToken();
  await apiRequest(
    `/assessments/${assessmentUuid}/progress-photos/consent`,
    {
      method: 'DELETE',
      token,
    }
  );
}

export async function uploadProgressPhoto(
  assessmentUuid: string,
  position: ProgressPhotoPosition,
  asset: MFPhotoAsset,
  observation?: string | null
): Promise<ProgressPhotoItem> {
  const token = await requireToken();
  const photoBase64 = await imageToBase64(asset);

  const response = await apiRequest<{ data: ProgressPhotoItem }>(
    `/assessments/${assessmentUuid}/progress-photos/${position}`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        photo_base64: photoBase64,
        observation: observation?.trim() || null,
        captured_at: new Date().toISOString(),
      }),
    }
  );

  return response.data;
}

export async function updateProgressPhoto(
  assessmentUuid: string,
  position: ProgressPhotoPosition,
  observation: string
): Promise<ProgressPhotoItem> {
  const token = await requireToken();

  const response = await apiRequest<{ data: ProgressPhotoItem }>(
    `/assessments/${assessmentUuid}/progress-photos/${position}`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify({
        observation: observation.trim() || null,
      }),
    }
  );

  return response.data;
}

export async function deleteProgressPhoto(
  assessmentUuid: string,
  position: ProgressPhotoPosition
): Promise<void> {
  const token = await requireToken();

  await apiRequest(
    `/assessments/${assessmentUuid}/progress-photos/${position}`,
    {
      method: 'DELETE',
      token,
    }
  );
}

export async function getProgressPhotoDataUrl(
  assessmentUuid: string,
  position: ProgressPhotoPosition
): Promise<string | null> {
  const token = await requireToken();

  const response = await fetch(
    `${apiBase()}/assessments/${assessmentUuid}/progress-photos/${position}`,
    {
      headers: {
        Accept: 'image/*',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = 'Não foi possível carregar a fotografia.';
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Não foi possível carregar a fotografia.'));
      }
    };
    reader.onerror = () =>
      reject(new Error('Não foi possível carregar a fotografia.'));
    reader.readAsDataURL(blob);
  });
}
