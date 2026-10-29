import { File, Paths } from 'expo-file-system';

import { getToken } from '@/services/auth';

/**
 * Baixa um PDF somente após autenticação Bearer. O token nunca vai na URL.
 * PDF fica em cache privado do app, sem upload a servidor público.
 */
export async function downloadAssessmentReport(
  studentUuid: string,
  assessmentUuid: string
): Promise<File> {
  const token = await getToken();
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não configurada.');
  }

  const url =
    apiUrl.replace(/\/+$/, '') +
    `/students/${encodeURIComponent(studentUuid)}` +
    `/assessment-reports/${encodeURIComponent(assessmentUuid)}/pdf`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-store',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.message ||
        (response.status === 403
          ? 'Você não possui permissão para baixar este relatório.'
          : response.status === 422
            ? 'Somente avaliações concluídas podem gerar relatórios.'
            : 'Não foi possível gerar o relatório PDF.')
    );
  }

  const mime = response.headers.get('content-type') || '';
  if (!mime.toLowerCase().includes('application/pdf')) {
    throw new Error('A API retornou um formato inesperado em vez de PDF.');
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (
    bytes.length < 5 ||
    bytes[0] !== 37 ||
    bytes[1] !== 80 ||
    bytes[2] !== 68 ||
    bytes[3] !== 70 ||
    bytes[4] !== 45
  ) {
    throw new Error('O arquivo retornado não é um PDF válido.');
  }

  const file = new File(
    Paths.cache,
    `mf-avaliacao-${assessmentUuid}-${Date.now()}.pdf`
  );
  file.create();
  await file.write(bytes);
  return file;
}
