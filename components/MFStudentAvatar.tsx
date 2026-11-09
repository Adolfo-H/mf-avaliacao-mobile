import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useMFTheme } from '@/contexts/MFThemeContext';
import { getMFStudentThumbnail } from '@/lib/mf-photo-cache';
import { getStudentPhotoDataUrl } from '@/services/students';

function initials(name: string): string {
  const names = name.trim().split(/\s+/).filter(Boolean);
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : (names[0] || 'MF').slice(0, 2).toUpperCase();
}

type LoadedPhoto = {
  identity: string;
  uri: string | null;
};

/**
 * Miniatura da foto privada cadastrada: reaproveita o GET autenticado existente.
 * O resultado fica vinculado ao UUID, ao usuário e ao estado hasPhoto.
 * Assim, ao trocar aluno/conta, uma foto antiga nunca aparece por engano,
 * sem precisar limpar o estado de forma síncrona dentro de useEffect.
 */
export function MFStudentAvatar({
  uuid,
  name,
  hasPhoto,
  size = 45,
}: {
  uuid: string;
  name: string;
  hasPhoto: boolean;
  size?: number;
}) {
  const { colors: c } = useMFTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const identity = `${userId ?? 'guest'}:${uuid}:${hasPhoto ? 'photo' : 'none'}`;
  const [loadedPhoto, setLoadedPhoto] = useState<LoadedPhoto | null>(null);

  useEffect(() => {
    let active = true;

    if (hasPhoto && userId && uuid) {
      void getMFStudentThumbnail(uuid, userId, () => getStudentPhotoDataUrl(uuid))
        .then((uri) => {
          if (active) setLoadedPhoto({ identity, uri });
        })
        .catch(() => {
          if (active) setLoadedPhoto({ identity, uri: null });
        });
    }

    return () => {
      active = false;
    };
  }, [uuid, hasPhoto, userId, identity]);

  // Uma imagem de outro aluno ou de uma sessão anterior não é renderizada.
  const source = hasPhoto && loadedPhoto?.identity === identity
    ? loadedPhoto.uri
    : null;
  const radius = Math.round(size * 0.32);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: c.greenSoft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {source ? (
        <Image
          accessibilityLabel={`Fotografia de ${name}`}
          source={{ uri: source }}
          resizeMode="cover"
          onError={() => setLoadedPhoto({ identity, uri: null })}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text
          style={{
            color: c.greenText,
            fontWeight: '800',
            fontSize: Math.max(12, Math.round(size * 0.29)),
          }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
