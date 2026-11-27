import * as ImagePicker from 'expo-image-picker';
import { MFPhotoError, type MFPhotoAsset, type MFPhotoKind, type MFPhotoSource } from './mf-photo-common';
let selecting = false;

/** O recorte quadrado só é mantido no avatar. Avaliações preservam a fotografia inteira. */
export async function pickMFPhoto(source: MFPhotoSource, kind: MFPhotoKind): Promise<MFPhotoAsset | null> {
  if (selecting) return null;
  selecting = true;
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new MFPhotoError('selection', 'Permita o acesso à câmera nas configurações do aparelho.');
    }
    // O seletor do sistema concede acesso à imagem escolhida; não exige acesso à galeria inteira.
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'], allowsEditing: kind === 'student', quality: 0.9,
      ...(kind === 'student' ? { aspect: [1, 1] as [number, number] } : {}),
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      exif: false, base64: false,
    };
    const result = await (source === 'camera' ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    if (!asset?.uri) throw new MFPhotoError('selection', 'Nenhuma imagem válida foi selecionada.');
    return asset;
  } catch (error) {
    if (error instanceof MFPhotoError) throw error;
    throw new MFPhotoError('selection', source === 'camera' ? 'Não foi possível abrir a câmera. Confira as permissões do aparelho.' : 'Não foi possível selecionar a foto. Tente novamente.');
  } finally { selecting = false; }
}
