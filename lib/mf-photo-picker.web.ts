import { MAX_INPUT_BYTES, MFPhotoError, type MFPhotoAsset, type MFPhotoKind, type MFPhotoSource } from './mf-photo-common';
let selecting = false;

/** Safari/Chrome web: abre o seletor diretamente no clique, sem await anterior e sem canvas do Expo. */
export function pickMFPhoto(source: MFPhotoSource, _kind: MFPhotoKind): Promise<MFPhotoAsset | null> {
  // O tipo de foto só controla recorte no seletor nativo; web mantém o quadro inteiro.
  void _kind;
  if (selecting) return Promise.resolve(null);
  selecting = true;
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.position = 'fixed';
    input.style.left = '-10000px';
    input.style.top = '0';
    input.setAttribute('aria-label', 'Selecionar fotografia');
    input.tabIndex = -1;
    let settled = false;
    let leftWindow = false;
    let focusTimer: ReturnType<typeof setTimeout> | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    function cleanup() {
      if (focusTimer !== undefined) clearTimeout(focusTimer);
      if (expiry !== undefined) clearTimeout(expiry);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      input.remove();
      selecting = false;
    }
    function finish(file?: File) {
      if (settled) return;
      settled = true;
      cleanup();
      if (!file) { resolve(null); return; }
      if (file.size === 0 || file.size > MAX_INPUT_BYTES) { reject(new MFPhotoError('size', 'Escolha uma imagem não vazia de até 40 MB.')); return; }
      if (file.type && !file.type.startsWith('image/')) { reject(new MFPhotoError('selection', 'Selecione um arquivo de imagem.')); return; }
      // As dimensões reais serão obtidas após carregar a imagem. O arquivo não é persistido.
      resolve({ uri: '', width: 0, height: 0, file, fileName: file.name, mimeType: file.type });
    }
    function onChange() { finish(input.files?.[0]); }
    function onCancel() { finish(); }
    function onBlur() { leftWindow = true; }
    function onFocus() {
      if (!leftWindow || settled) return;
      // Fallback para versões antigas sem evento cancel. Dá prioridade a change.
      if (focusTimer !== undefined) clearTimeout(focusTimer);
      focusTimer = setTimeout(() => finish(input.files?.[0]), 1200);
    }
    function onVisibility() { if (document.hidden) onBlur(); else onFocus(); }
    try {
      input.addEventListener('change', onChange);
      input.addEventListener('cancel', onCancel);
      window.addEventListener('blur', onBlur);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
      expiry = setTimeout(() => finish(), 300_000);
      document.body.appendChild(input);
      input.click(); // síncrono: preserva a ativação do usuário no Safari.
    } catch {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new MFPhotoError('selection', 'Não foi possível abrir o seletor de fotos. Tente novamente pelo navegador.'));
      }
    }
  });
}
