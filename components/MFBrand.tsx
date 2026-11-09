import { Image, Text, View } from 'react-native';
import type { ImageStyle, ViewStyle } from 'react-native';

export function MFBrand({ compact = false, style }: { compact?: boolean; style?: ViewStyle }) {
  return (
    <View style={[{ justifyContent: 'center', alignItems: compact ? 'center' : 'flex-start' }, style]}>
      <Image
        source={require('../assets/images/mf-logo.png')}
        resizeMode="contain"
        accessibilityLabel="MF Saúde & Movimento"
        style={{ width: compact ? 114 : 194, height: compact ? 46 : 79 } as ImageStyle}
      />
      {!compact ? <Text style={{ color: '#B5C0DB', fontSize: 9, letterSpacing: 2.2, fontWeight: '700', marginTop: 16 }}>AVALIAÇÃO FÍSICA</Text> : null}
    </View>
  );
}
