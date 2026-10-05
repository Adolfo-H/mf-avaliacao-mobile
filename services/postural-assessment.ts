import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  AssessmentPostural,
  AssessmentPosturalResponse,
  PosturalPhoto,
  PosturalPhotoPosition,
  UpdatePosturalPayload,
  UpdatePosturalPhotoPayload,
} from '@/types/postural-assessment';

async function requireToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
  return token;
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) throw new Error('A URL da API não foi configurada.');
  return apiUrl.replace(/\/+$/, '');
}

async function preparePhoto(asset: ImagePickerAsset): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width && asset.width > 1800) {
    context.resize({ width: 1800, height: null });
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.82,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('Não foi possível preparar a fotografia.');
  }

  return result.base64;
}

export async function getAssessmentPostural(
  assessmentUuid: string
): Promise<AssessmentPostural> {
  const token = await requireToken();
  const response = await apiRequest<AssessmentPosturalResponse>(
    `/assessments/${assessmentUuid}/postural-assessment`,
    { method: 'GET', token }
  );

  return response.data;
}

export async function updateAssessmentPostural(
  assessmentUuid: string,
  payload: UpdatePosturalPayload
): Promise<AssessmentPostural> {
  const token = await requireToken();
  const response = await apiRequest<AssessmentPosturalResponse>(
    `/assessments/${assessmentUuid}/postural-assessment`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}

export async function uploadPosturalPhoto(
  assessmentUuid: string,
  position: PosturalPhotoPosition,
  asset: ImagePickerAsset,
  options: UpdatePosturalPhotoPayload = {}
): Promise<PosturalPhoto> {
  const token = await requireToken();
  const photoBase64 = await preparePhoto(asset);

  const response = await apiRequest<{ data: PosturalPhoto }>(
    `/assessments/${assessmentUuid}/postural-assessment/photos/${position}`,
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        photo_base64: photoBase64,
        ...options,
      }),
    }
  );

  return response.data;
}

export async function updatePosturalPhoto(
  assessmentUuid: string,
  position: PosturalPhotoPosition,
  payload: UpdatePosturalPhotoPayload
): Promise<PosturalPhoto> {
  const token = await requireToken();
  const response = await apiRequest<{ data: PosturalPhoto }>(
    `/assessments/${assessmentUuid}/postural-assessment/photos/${position}`,
    {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}

export async function removePosturalPhoto(
  assessmentUuid: string,
  position: PosturalPhotoPosition
): Promise<void> {
  const token = await requireToken();

  await apiRequest(
    `/assessments/${assessmentUuid}/postural-assessment/photos/${position}`,
    { method: 'DELETE', token }
  );
}

export async function getPosturalPhotoDataUrl(
  assessmentUuid: string,
  position: PosturalPhotoPosition
): Promise<string | null> {
  const token = await requireToken();

  const response = await fetch(
    `${getApiBaseUrl()}/assessments/${assessmentUuid}/postural-assessment/photos/${position}`,
    {
      headers: {
        Accept: 'image/*',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    let message = 'Não foi possível carregar a fotografia postural.';
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Não foi possível carregar a fotografia postural.'));
    };

    reader.onerror = () =>
      reject(new Error('Não foi possível carregar a fotografia postural.'));

    reader.readAsDataURL(blob);
  });
}
