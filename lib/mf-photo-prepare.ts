import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { MFPhotoError, MAX_JPEG_BYTES, jpegByteLength, isJpegBase64, photoDimensions, requireJpeg, type MFPhotoAsset } from './mf-photo-common';

/** Nativo: usa o manipulador de imagens do Expo, mantendo a proporção. */
export async function prepareMFPhoto(asset: MFPhotoAsset, maxSide = 1600, quality = 0.8): Promise<string> {
  if (!asset.uri) throw new MFPhotoError('selection', 'Nenhuma fotografia foi selecionada.');
  try {
    photoDimensions(asset.width, asset.height, maxSide);
    for (const [limit, compress] of [[maxSide, quality], [Math.min(maxSide, 1400), 0.7], [Math.min(maxSide, 1100), 0.6]] as const) {
      const target = photoDimensions(asset.width, asset.height, limit);
      const context = ImageManipulator.manipulate(asset.uri);
      if (target.width !== asset.width || target.height !== asset.height) {
        context.resize({ width: target.width, height: target.height });
      }
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
      if (result.base64 && isJpegBase64(result.base64) && jpegByteLength(result.base64) <= MAX_JPEG_BYTES) return requireJpeg(result.base64);
    }
    throw new MFPhotoError('size', 'Não foi possível gerar um JPG de até 5 MB. Selecione uma foto menor.');
  } catch (error) {
    if (error instanceof MFPhotoError) throw error;
    throw new MFPhotoError('conversion', 'O dispositivo não conseguiu converter a foto. Selecione outra imagem JPG ou PNG.');
  }
}
