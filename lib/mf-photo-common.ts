/** Fotografias privadas: preparação em memória, sem envio para serviços de conversão. */
export type MFPhotoAsset = {
  uri: string;
  width: number;
  height: number;
  file?: File;
  fileName?: string | null;
  mimeType?: string | null;
};
export type MFPhotoSource = 'camera' | 'library';
export type MFPhotoKind = 'student' | 'assessment';
export const MAX_JPEG_BYTES = 5 * 1024 * 1024;
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;

export class MFPhotoError extends Error {
  constructor(public readonly stage: 'selection' | 'decode' | 'conversion' | 'size', message: string) {
    super(message);
    this.name = 'MFPhotoError';
  }
}

export function photoDimensions(width: number, height: number, maxSide: number) {
  if (![width, height, maxSide].every(n => Number.isFinite(n) && n > 0)) {
    throw new MFPhotoError('decode', 'Não foi possível ler as dimensões da foto. Selecione outra imagem JPG ou PNG.');
  }
  if (maxSide > 2048 || maxSide < 1) throw new MFPhotoError('size', 'Limite de dimensões da fotografia inválido.');
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export function jpegByteLength(base64: string) {
  return Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
}
export function isJpegBase64(base64: string): boolean {
  return base64.startsWith('/9j/') && base64.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(base64);
}
export function requireJpeg(base64: string | null | undefined): string {
  if (!base64 || !isJpegBase64(base64)) {
    throw new MFPhotoError('conversion', 'Não foi possível converter a imagem em JPG. Selecione outra fotografia.');
  }
  if (jpegByteLength(base64) > MAX_JPEG_BYTES) {
    throw new MFPhotoError('size', 'A fotografia ultrapassa o limite de 5 MB após a conversão. Selecione uma foto menor.');
  }
  return base64;
}

/** Não imprimir erro bruto, URI, conteúdo ou dados de saúde em logs ou na interface. */
export function photoErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof MFPhotoError) return error.message;
  const e = error as { name?: unknown; message?: unknown; status?: unknown } | null;
  if (e?.name === 'ApiError' && typeof e.status === 'number') {
    if (e.status === 401) return 'Sua sessão expirou. Entre novamente e tente enviar a foto.';
    if (e.status === 403) return 'Acesso não autorizado. Confira as permissões e o consentimento fotográfico.';
    if (e.status === 404) return 'O aluno, a avaliação ou a fotografia não foi encontrado. Atualize a tela.';
    if (e.status === 413) return 'O servidor recusou o tamanho da foto. Selecione uma imagem menor.';
    if (e.status === 422) {
      const msg = typeof e.message === 'string' ? e.message : '';
      if (/consentimento/i.test(msg)) return 'Salve o consentimento com autorização de armazenamento antes de incluir a fotografia.';
      if (/concluída|concluídas|somente leitura/i.test(msg)) return 'Esta avaliação está concluída e não pode ser alterada.';
      if (/5 MB|tamanho/i.test(msg)) return 'A fotografia pode possuir no máximo 5 MB.';
      if (/JPG|fotografia.*inválida/i.test(msg)) return 'A fotografia não foi aceita como JPG válido. Selecione outra imagem.';
      return 'O servidor não aceitou os dados da fotografia. Confira os campos e o consentimento.';
    }
    if (e.status === 429) return 'Muitas solicitações. Aguarde um pouco antes de tentar novamente.';
    if (e.status >= 500) return 'O servidor não conseguiu processar a fotografia. Confira se ela foi salva antes de tentar novamente.';
    return `Não foi possível processar a fotografia (HTTP ${e.status}).`;
  }
  if (typeof e?.message === 'string' && /index is not in the allowed range|indexsizeerror|invalidstateerror/i.test(e.message)) {
    return 'O dispositivo não conseguiu preparar esta imagem. Selecione novamente a foto ou utilize uma imagem JPG.';
  }
  return fallback;
}
