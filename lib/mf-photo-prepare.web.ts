import { MFPhotoError, MAX_INPUT_BYTES, MAX_JPEG_BYTES, jpegByteLength, isJpegBase64, photoDimensions, requireJpeg, type MFPhotoAsset } from './mf-photo-common';

function loadPhoto(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timer: ReturnType<typeof setTimeout>;
    const clear = () => { clearTimeout(timer); img.onload = null; img.onerror = null; };
    img.onload = () => { clear(); resolve(img); };
    img.onerror = () => { clear(); reject(new MFPhotoError('decode', 'O navegador não conseguiu abrir a foto. Use uma imagem JPG ou PNG. Para HEIC, exporte a foto como JPG.')); };
    timer = setTimeout(() => {
      clear();
      img.removeAttribute('src');
      reject(new MFPhotoError('decode', 'A leitura da fotografia demorou demais. Selecione outra imagem.'));
    }, 30_000);
    img.src = src;
  });
}

/** Não usa canvas nas dimensões originais nem expo-image-manipulator no navegador. */
export async function prepareMFPhoto(asset: MFPhotoAsset, maxSide = 1600, quality = 0.8): Promise<string> {
  let objectUrl: string | undefined;
  let img: HTMLImageElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  try {
    if (asset.file) {
      if (asset.file.size === 0 || asset.file.size > MAX_INPUT_BYTES) throw new MFPhotoError('size', 'Escolha uma imagem não vazia de até 40 MB.');
      if (asset.file.type && !asset.file.type.startsWith('image/')) throw new MFPhotoError('selection', 'Selecione um arquivo de imagem.');
      objectUrl = URL.createObjectURL(asset.file);
    }
    const src = objectUrl ?? asset.uri;
    // Não buscar imagens remotas nem enviar a foto a conversores externos.
    if (!src || !/^(blob:|data:image\/)/i.test(src)) throw new MFPhotoError('selection', 'Selecione uma foto diretamente do dispositivo.');
    if (!objectUrl && src.length > MAX_INPUT_BYTES * 4 / 3 + 1024) throw new MFPhotoError('size', 'A imagem selecionada é muito grande.');
    img = await loadPhoto(src);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    photoDimensions(width, height, maxSide);
    // Evita decodificações/canvas desproporcionais; fotos usuais de 48 MP são aceitas.
    if (width * height > 80_000_000) throw new MFPhotoError('size', 'A resolução da foto é muito alta. Selecione uma foto menor.');
    canvas = document.createElement('canvas');
    // Cada tentativa usa dimensões válidas, menores e proporcionais. Nunca se repete o POST.
    for (const [limit, compress] of [[maxSide, quality], [Math.min(maxSide, 1400), 0.7], [Math.min(maxSide, 1100), 0.6]] as const) {
      const dimensions = photoDimensions(width, height, limit);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new MFPhotoError('conversion', 'O navegador não conseguiu preparar a fotografia. Feche outras abas e tente novamente.');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      const result = canvas.toDataURL('image/jpeg', compress);
      const prefix = 'data:image/jpeg;base64,';
      if (!result.startsWith(prefix)) throw new MFPhotoError('conversion', 'Não foi possível converter a fotografia em JPG neste navegador.');
      const base64 = result.slice(prefix.length);
      if (isJpegBase64(base64) && jpegByteLength(base64) <= MAX_JPEG_BYTES) return requireJpeg(base64);
    }
    throw new MFPhotoError('size', 'A foto continua acima do limite de 5 MB. Selecione uma imagem menor.');
  } catch (error) {
    if (error instanceof MFPhotoError) throw error;
    throw new MFPhotoError('conversion', 'O navegador não conseguiu processar a foto. Tente uma imagem JPG ou PNG menor.');
  } finally {
    if (canvas) { canvas.width = 1; canvas.height = 1; }
    if (img) img.removeAttribute('src');
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
