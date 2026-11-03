import type { File as ExpoFile } from 'expo-file-system';
import { getToken } from '@/services/auth';

/**
 * Web-only: PDF clínico recebido com Authorization: Bearer e Cache-Control: no-store.
 * O documento é mantido em memória enquanto o usuário estiver nesta tela;
 * NÃO usar localStorage, links públicos ou service worker para estes arquivos.
 */
export async function downloadAssessmentReport(
  studentUuid: string,
  assessmentUuid: string
): Promise<ExpoFile> {
  const token = await getToken();
  if (!token) throw new Error('Sua sessão expirou. Entre novamente.');

  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) throw new Error('Configure EXPO_PUBLIC_API_URL para acessar a API.');

  const url =
    apiUrl.replace(/\/+$/, '') +
    `/students/${encodeURIComponent(studentUuid)}` +
    `/assessment-reports/${encodeURIComponent(assessmentUuid)}/pdf`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/pdf',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.message ||
      (response.status === 403
        ? 'Você não possui permissão para consultar este relatório.'
        : response.status === 422
          ? 'Somente avaliações concluídas podem gerar relatórios.'
          : 'Não foi possível gerar o relatório.')
    );
  }

  if (!(response.headers.get('content-type') || '').toLowerCase().includes('application/pdf')) {
    throw new Error('O servidor não retornou um PDF válido.');
  }

  const rawBytes = await response.arrayBuffer();
  const bytes = new Uint8Array(rawBytes);
  if (bytes.length < 5 || bytes[0] !== 37 || bytes[1] !== 80 ||
      bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) {
    throw new Error('O arquivo retornado não possui a assinatura de PDF.');
  }

  const objectUrl = URL.createObjectURL(new Blob([rawBytes], { type: 'application/pdf' }));
  let active = true;

  // Interface compatível com as operações usadas no componente nativo.
  // A visualização Web ocorre em clique separado, por exigência do Safari.
  const webPdf = {
    uri: objectUrl,
    get exists() { return active; },
    delete() {
      if (active) {
        URL.revokeObjectURL(objectUrl);
        active = false;
      }
    },
    async preview() {
      if (active) window.open(objectUrl, '_blank', 'noopener,noreferrer');
    },
  };
  return webPdf as unknown as ExpoFile;
}
