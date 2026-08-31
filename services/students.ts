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
  const contentType =
    response.headers.get('content-type') ?? '';

  if (
    contentType.includes('application/json')
  ) {
    try {
      const body = (await response.json()) as {
        message?: string;

        errors?: Record<
          string,
          string[]
        >;
      };

      if (body.message) {
        return body.message;
      }

      if (body.errors) {
        const firstError =
          Object.values(
            body.errors
          ).flat()[0];

        if (firstError) {
          return firstError;
        }
      }
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const text = await response.text();

    if (text.trim()) {
      return text.trim();
    }
  } catch {
    // Mantém a mensagem padrão.
  }

  return fallbackMessage;
}

function getImageFileName(
  asset: ImagePickerAsset
): string {
  if (asset.fileName?.trim()) {
    return asset.fileName;
  }

  const mimeType =
    asset.mimeType?.toLowerCase();

  if (mimeType === 'image/png') {
    return `student-photo-${Date.now()}.png`;
  }

  if (mimeType === 'image/webp') {
    return `student-photo-${Date.now()}.webp`;
  }

  return `student-photo-${Date.now()}.jpg`;
}

function getImageMimeType(
  asset: ImagePickerAsset
): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  const uri = asset.uri.toLowerCase();

  if (uri.endsWith('.png')) {
    return 'image/png';
  }

  if (uri.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function blobToDataUrl(
  blob: Blob
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (
          typeof reader.result === 'string'
        ) {
          resolve(reader.result);
          return;
        }

        reject(
          new Error(
            'Não foi possível carregar a fotografia.'
          )
        );
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
    params.set(
      'search',
      options.search.trim()
    );
  }

  if (options.status) {
    params.set(
      'status',
      options.status
    );
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

/*
|--------------------------------------------------------------------------
| Foto do aluno
|--------------------------------------------------------------------------
*/

export async function uploadStudentPhoto(
  uuid: string,
  asset: ImagePickerAsset
): Promise<Student> {
  const token = await requireToken();

  const formData = new FormData();

  /*
   * No navegador, o ImagePicker pode
   * fornecer um File diretamente.
   */
  if (asset.file) {
    formData.append(
      'photo',
      asset.file,
      getImageFileName(asset)
    );
  } else {
    /*
     * Android/iOS trabalham com a URI
     * local retornada pelo ImagePicker.
     *
     * Não configure manualmente o
     * Content-Type multipart/form-data,
     * pois o fetch precisa adicionar
     * o boundary automaticamente.
     */
    formData.append(
      'photo',
      {
        uri: asset.uri,
        name: getImageFileName(asset),
        type: getImageMimeType(asset),
      } as unknown as Blob
    );
  }

  const response = await fetch(
    buildApiUrl(
      `/students/${uuid}/photo`
    ),
    {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        Authorization:
          `Bearer ${token}`,
      },

      body: formData,
    }
  );

  if (!response.ok) {
    const message =
      await getResponseError(
        response,
        'Não foi possível enviar a fotografia.'
      );

    throw new Error(message);
  }

  const body =
    (await response.json()) as StudentResponse;

  return body.data;
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

  /*
   * 404 é normal quando o aluno
   * ainda não possui fotografia.
   */
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message =
      await getResponseError(
        response,
        'Não foi possível carregar a fotografia.'
      );

    throw new Error(message);
  }

  const blob = await response.blob();

  return blobToDataUrl(blob);
}