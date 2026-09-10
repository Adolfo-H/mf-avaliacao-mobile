import {
  ImageManipulator,
  SaveFormat,
} from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import { apiRequest } from '@/lib/api';
import { getToken } from '@/services/auth';

import {
  CreateStudentPayload,
  Student,
  StudentListResponse,
  StudentResponse,
  StudentStatus,
  UpdateStudentPayload,
} from '@/types/student';

async function requireToken(): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error(
      'Sua sessão expirou. Entre novamente.'
    );
  }

  return token;
}

function getApiBaseUrl(): string {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error(
      'A URL da API não foi configurada.'
    );
  }

  return apiUrl.replace(/\/+$/, '');
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function getResponseError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const body = await response.json();

    if (body?.message) {
      return body.message;
    }

    if (body?.errors) {
      const firstError =
        Object.values(body.errors)
          .flat()
          .find(Boolean);

      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  } catch {
    // mantém fallback
  }

  return fallbackMessage;
}

async function prepareStudentPhoto(
  asset: ImagePickerAsset
): Promise<string> {
  const context =
    ImageManipulator.manipulate(asset.uri);

  if (asset.width && asset.width > 1600) {
    context.resize({
      width: 1600,
      height: null,
    });
  }

  const rendered =
    await context.renderAsync();

  const result =
    await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8,
      base64: true,
    });

  if (!result.base64) {
    throw new Error(
      'Não foi possível preparar a fotografia.'
    );
  }

  return result.base64;
}

type ListStudentsOptions = {
  search?: string;
  status?: StudentStatus;
  page?: number;
};

export async function listStudents(
  options: ListStudentsOptions = {}
): Promise<StudentListResponse> {
  const token = await requireToken();

  const params = new URLSearchParams();

  if (options.search?.trim()) {
    params.set('search', options.search.trim());
  }

  if (options.status) {
    params.set('status', options.status);
  }

  params.set(
    'page',
    String(options.page ?? 1)
  );

  return apiRequest<StudentListResponse>(
    `/students?${params.toString()}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function getStudent(
  uuid: string
): Promise<Student> {
  const token = await requireToken();

  const response =
    await apiRequest<StudentResponse>(
      `/students/${uuid}`,
      {
        method: 'GET',
        token,
      }
    );

  return response.data;
}

export async function createStudent(
  payload: CreateStudentPayload
): Promise<Student> {
  const token = await requireToken();

  const response =
    await apiRequest<StudentResponse>(
      '/students',
      {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }
    );

  return response.data;
}

export async function updateStudent(
  uuid: string,
  payload: UpdateStudentPayload
): Promise<Student> {
  const token = await requireToken();

  const response =
    await apiRequest<StudentResponse>(
      `/students/${uuid}`,
      {
        method: 'PUT',
        token,
        body: JSON.stringify(payload),
      }
    );

  return response.data;
}

export async function updateStudentStatus(
  uuid: string,
  active: boolean
): Promise<Student> {
  const token = await requireToken();

  const response =
    await apiRequest<StudentResponse>(
      `/students/${uuid}/status`,
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

export async function uploadStudentPhoto(
  uuid: string,
  asset: ImagePickerAsset
): Promise<Student> {
  const token = await requireToken();

  const base64 =
    await prepareStudentPhoto(asset);

  const response =
    await apiRequest<StudentResponse>(
      `/students/${uuid}/photo`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({
          photo_base64: base64,
        }),
      }
    );

  return response.data;
}

export async function removeStudentPhoto(
  uuid: string
): Promise<Student> {
  const token = await requireToken();

  const response =
    await apiRequest<StudentResponse>(
      `/students/${uuid}/photo`,
      {
        method: 'DELETE',
        token,
      }
    );

  return response.data;
}

export async function getStudentPhotoDataUrl(
  uuid: string
): Promise<string | null> {
  const token = await requireToken();

  const response = await fetch(
    buildApiUrl(
      `/students/${uuid}/photo`
    ),
    {
      method: 'GET',

      headers: {
        Accept: 'image/*',
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getResponseError(
        response,
        'Não foi possível carregar a fotografia.'
      )
    );
  }

  const blob = await response.blob();

  return await new Promise<string>(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (
          typeof reader.result === 'string'
        ) {
          resolve(reader.result);
        } else {
          reject(
            new Error(
              'Não foi possível carregar a fotografia.'
            )
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Não foi possível carregar a fotografia.'
          )
        );
      };

      reader.readAsDataURL(blob);
    }
  );
}
