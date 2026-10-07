import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getAssessmentPostural,
  getPosturalPhotoDataUrl,
  removePosturalPhoto,
  updateAssessmentPostural,
  updatePosturalPhoto,
  uploadPosturalPhoto,
} from '@/services/postural-assessment';

import type {
  AssessmentPostural,
  PosturalOption,
  PosturalPhoto,
  PosturalPhotoPosition,
} from '@/types/postural-assessment';

type PhotoUrls =
  Partial<Record<PosturalPhotoPosition, string | null>>;

const EMPTY_PHOTOS: PhotoUrls = {};

export default function PosturalAssessmentScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
    readOnly?: string | string[];
  }>();

  const assessmentUuid = getParam(params.uuid);
  const readOnly = getParam(params.readOnly) === '1';

  const [data, setData] =
    useState<AssessmentPostural | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [photoUrls, setPhotoUrls] =
    useState<PhotoUrls>(EMPTY_PHOTOS);
  const [preview, setPreview] =
    useState<PosturalPhotoPosition | null>(null);

  const [lateral, setLateral] = useState<string[]>([]);
  const [posterior, setPosterior] = useState<string[]>([]);
  const [anterior, setAnterior] = useState<string[]>([]);
  const [shoulder, setShoulder] = useState<string | null>(null);
  const [hip, setHip] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [photoObservations, setPhotoObservations] =
    useState<Partial<Record<PosturalPhotoPosition, string>>>({});

  const hydrate = useCallback((response: AssessmentPostural) => {
    setLateral(response.postural_assessment.lateral.alterations ?? []);
    setPosterior(response.postural_assessment.posterior.alterations ?? []);
    setAnterior(response.postural_assessment.anterior.alterations ?? []);
    setShoulder(response.postural_assessment.anterior.shoulder_asymmetry ?? null);
    setHip(response.postural_assessment.anterior.hip_asymmetry ?? null);
    setObservations(response.postural_assessment.observations ?? '');

    const drafts: Partial<Record<PosturalPhotoPosition, string>> = {};
    response.photos.forEach(photo => {
      drafts[photo.position] = photo.observation ?? '';
    });
    setPhotoObservations(drafts);
  }, []);

  const loadPhotoUrls = useCallback(async (response: AssessmentPostural) => {
    if (!assessmentUuid) return;

    const next: PhotoUrls = {};
    await Promise.all(
      response.photos.map(async photo => {
        if (!photo.has_photo) {
          next[photo.position] = null;
          return;
        }

        try {
          next[photo.position] =
            await getPosturalPhotoDataUrl(
              assessmentUuid,
              photo.position
            );
        } catch {
          next[photo.position] = null;
        }
      })
    );

    setPhotoUrls(next);
  }, [assessmentUuid]);

  const load = useCallback(async (showLoading = true) => {
    if (!assessmentUuid) {
      setError('Avaliação inválida.');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError('');
      const response = await getAssessmentPostural(assessmentUuid);
      setData(response);
      hydrate(response);
      await loadPhotoUrls(response);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível carregar a avaliação postural.'
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [assessmentUuid, hydrate, loadPhotoUrls]);

  const updateLocalPhoto = useCallback(
    (updatedPhoto: PosturalPhoto) => {
      setData(current => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          photos: current.photos.map(photo =>
            photo.position === updatedPhoto.position
              ? updatedPhoto
              : photo
          ),
        };
      });
    },
    []
  );

  const refreshPhotoUrl = useCallback(
    async (position: PosturalPhotoPosition) => {
      if (!assessmentUuid) {
        return;
      }

      try {
        const uri =
          await getPosturalPhotoDataUrl(
            assessmentUuid,
            position
          );

        setPhotoUrls(current => ({
          ...current,
          [position]: uri,
        }));
      } catch {
        setPhotoUrls(current => ({
          ...current,
          [position]: null,
        }));
      }
    },
    [assessmentUuid]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return undefined;
    }, [load])
  );

  function toggleValue(
    value: string,
    values: string[],
    setter: (next: string[]) => void
  ) {
    if (readOnly) return;

    setter(
      values.includes(value)
        ? values.filter(item => item !== value)
        : [...values, value]
    );
  }

  async function handleSave() {
    if (!assessmentUuid || readOnly || busy) return;

    try {
      setBusy(true);
      setError('');
      setMessage('');

      const response = await updateAssessmentPostural(
        assessmentUuid,
        {
          lateral: { alterations: lateral },
          posterior: { alterations: posterior },
          anterior: {
            alterations: anterior,
            shoulder_asymmetry: shoulder,
            hip_asymmetry: hip,
          },
          observations: observations.trim() || null,
        }
      );

      setData(response);
      hydrate(response);
      setMessage('Avaliação postural salva com sucesso.');
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a avaliação postural.'
      );
    } finally {
      setBusy(false);
    }
  }

  function canManagePhotos(): boolean {
    return Boolean(
      !readOnly &&
      data?.photo_consent?.active
    );
  }

  async function takePhoto(position: PosturalPhotoPosition) {
    if (!canManagePhotos() || busy) return;

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Permita o acesso à câmera para registrar a fotografia.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    await saveSelectedPhoto(position, result.assets[0]);
  }

  async function choosePhoto(position: PosturalPhotoPosition) {
    if (!canManagePhotos() || busy) return;

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permita o acesso às fotos para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    await saveSelectedPhoto(position, result.assets[0]);
  }

  async function saveSelectedPhoto(
    position: PosturalPhotoPosition,
    asset: ImagePicker.ImagePickerAsset
  ) {
    if (!assessmentUuid || !data) return;

    const photo =
      data.photos.find(
        item => item.position === position
      );

    try {
      setBusy(true);
      setError('');
      setMessage('');

      const updatedPhoto =
        await uploadPosturalPhoto(
          assessmentUuid,
          position,
          asset,
          {
            grid_enabled:
              photo?.grid_enabled ?? false,

            observation:
              photoObservations[
                position
              ]?.trim() || null,

            captured_at:
              new Date().toISOString(),
          }
        );

      updateLocalPhoto(updatedPhoto);

      setPhotoObservations(current => ({
        ...current,
        [position]:
          updatedPhoto.observation ?? '',
      }));

      await refreshPhotoUrl(position);

      setMessage(
        'Fotografia postural salva com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a fotografia postural.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function savePhotoObservation(
    position: PosturalPhotoPosition
  ) {
    if (
      !assessmentUuid ||
      readOnly ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');
      setMessage('');

      const updatedPhoto =
        await updatePosturalPhoto(
          assessmentUuid,
          position,
          {
            observation:
              photoObservations[
                position
              ]?.trim() || null,
          }
        );

      updateLocalPhoto(updatedPhoto);

      setPhotoObservations(current => ({
        ...current,
        [position]:
          updatedPhoto.observation ?? '',
      }));

      setMessage(
        'Observação da fotografia salva.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a observação.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleGrid(
    position: PosturalPhotoPosition,
    enabled: boolean
  ) {
    if (
      !assessmentUuid ||
      readOnly ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);
      setError('');

      const updatedPhoto =
        await updatePosturalPhoto(
          assessmentUuid,
          position,
          {
            grid_enabled: enabled,
          }
        );

      updateLocalPhoto(updatedPhoto);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível alterar a grade.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function deletePhoto(
    position: PosturalPhotoPosition
  ) {
    if (
      !assessmentUuid ||
      readOnly ||
      busy
    ) {
      return;
    }

    Alert.alert(
      'Excluir fotografia',
      'Deseja remover esta fotografia postural?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              setError('');
              setMessage('');

              await removePosturalPhoto(
                assessmentUuid,
                position
              );

              setData(current => {
                if (!current) {
                  return current;
                }

                return {
                  ...current,
                  photos: current.photos.map(
                    photo =>
                      photo.position === position
                        ? {
                            ...photo,
                            has_photo: false,
                            grid_enabled: false,
                            grid_settings: null,
                            observation: null,
                            captured_at: null,
                            uploaded_at: null,
                          }
                        : photo
                  ),
                };
              });

              setPhotoUrls(current => ({
                ...current,
                [position]: null,
              }));

              setPhotoObservations(current => ({
                ...current,
                [position]: '',
              }));

              setPreview(current =>
                current === position
                  ? null
                  : current
              );

              setMessage(
                'Fotografia removida.'
              );
            } catch (exception) {
              setError(
                exception instanceof Error
                  ? exception.message
                  : 'Não foi possível remover a fotografia.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#123C47" />
        <Text style={styles.loadingText}>Carregando avaliação postural...</Text>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorPage}>
          <Ionicons name="alert-circle-outline" size={38} color="#B44747" />
          <Text style={styles.errorTitle}>Não foi possível abrir a avaliação postural</Text>
          <Text style={styles.errorText}>{error || 'Tente novamente.'}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const previewUri = preview ? photoUrls[preview] : null;
  const previewPhoto = preview
    ? data.photos.find(item => item.position === preview)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#123C47" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>AVALIAÇÃO FÍSICA</Text>
            <Text style={styles.title}>Avaliação postural</Text>
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="body-outline" size={24} color="#40856C" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.introTitle}>Registro postural</Text>
            <Text style={styles.introText}>
              Selecione apenas os achados observados. A grade é exibida sobre a imagem e não altera a fotografia original.
            </Text>
          </View>
        </View>

        {readOnly ? (
          <View style={styles.infoBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#66757A" />
            <Text style={styles.infoText}>Avaliação concluída: modo somente leitura.</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#B44747" />
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        {message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#40856C" />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <OptionSection
          title="Visão lateral"
          description="Alterações observadas nas vistas laterais."
          options={data.configuration.lateral_alterations}
          selected={lateral}
          disabled={readOnly}
          onToggle={value => toggleValue(value, lateral, setLateral)}
        />

        <OptionSection
          title="Visão posterior"
          description="Alterações observadas na vista posterior."
          options={data.configuration.posterior_alterations}
          selected={posterior}
          disabled={readOnly}
          onToggle={value => toggleValue(value, posterior, setPosterior)}
        />

        <OptionSection
          title="Visão anterior"
          description="Alterações observadas na vista anterior."
          options={data.configuration.anterior_alterations}
          selected={anterior}
          disabled={readOnly}
          onToggle={value => toggleValue(value, anterior, setAnterior)}
        />

        <SingleChoice
          title="Assimetria dos ombros"
          options={data.configuration.shoulder_asymmetries}
          value={shoulder}
          disabled={readOnly}
          onChange={setShoulder}
        />

        <SingleChoice
          title="Assimetria da pelve"
          options={data.configuration.hip_asymmetries}
          value={hip}
          disabled={readOnly}
          onChange={setHip}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Observações</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={observations}
            onChangeText={setObservations}
            editable={!readOnly}
            placeholder="Registre observações adicionais da avaliação postural."
            placeholderTextColor="#9AA6A9"
            textAlignVertical="top"
          />
        </View>

        {!readOnly ? (
          <Pressable
            style={[styles.primaryButton, busy && styles.disabledButton]}
            disabled={busy}
            onPress={handleSave}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Salvar avaliação postural</Text>
              </>
            )}
          </Pressable>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={styles.eyebrow}>FOTOGRAFIAS</Text>
          <Text style={styles.sectionTitle}>Registro por posição</Text>
          <Text style={styles.sectionDescription}>
            Lateral direita, lateral esquerda, posterior e anterior.
          </Text>
        </View>

        {!data.photo_consent?.active ? (
          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#9A6B22" />
            <View style={styles.flex}>
              <Text style={styles.warningTitle}>Consentimento necessário</Text>
              <Text style={styles.warningText}>
                Para adicionar fotografias, primeiro registre a autorização em Fotos de evolução.
              </Text>
            </View>
          </View>
        ) : null}

        {data.photos.map(photo => (
          <View key={photo.position} style={styles.photoCard}>
            <View style={styles.photoHeader}>
              <View>
                <Text style={styles.photoTitle}>{photo.label}</Text>
                <Text style={styles.photoMeta}>
                  {photo.has_photo ? 'Fotografia registrada' : 'Sem fotografia'}
                </Text>
              </View>
              {photo.has_photo ? (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>SALVA</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={styles.photoFrame}
              disabled={!photoUrls[photo.position]}
              onPress={() => setPreview(photo.position)}
            >
              {photoUrls[photo.position] ? (
                <>
                  <Image
                    source={{ uri: photoUrls[photo.position] ?? undefined }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  {photo.grid_enabled ? <SymmetryGrid /> : null}
                  <View style={styles.expandBadge}>
                    <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={34} color="#8A989C" />
                  <Text style={styles.placeholderText}>Adicione uma fotografia desta posição</Text>
                </View>
              )}
            </Pressable>

            {photo.has_photo && data.configuration.symmetrograph_available ? (
              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Grade de simetria</Text>
                  <Text style={styles.switchDescription}>Camada visual sobre a imagem original.</Text>
                </View>
                <Switch
                  value={photo.grid_enabled}
                  disabled={readOnly || busy}
                  onValueChange={value => void toggleGrid(photo.position, value)}
                  trackColor={{ false: '#D7DEDF', true: '#9FCDBD' }}
                  thumbColor={photo.grid_enabled ? '#40856C' : '#F5F5F5'}
                />
              </View>
            ) : null}

            {photo.has_photo ? (
              <View style={styles.photoObservationBlock}>
                <Text style={styles.photoObservationLabel}>Observação da fotografia</Text>
                <TextInput
                  style={styles.photoObservationInput}
                  value={photoObservations[photo.position] ?? ''}
                  onChangeText={value =>
                    setPhotoObservations(current => ({
                      ...current,
                      [photo.position]: value,
                    }))
                  }
                  editable={!readOnly}
                  multiline
                  placeholder="Observação opcional desta posição."
                  placeholderTextColor="#9AA6A9"
                  textAlignVertical="top"
                />
                {!readOnly ? (
                  <Pressable
                    style={styles.saveObservationButton}
                    disabled={busy}
                    onPress={() => void savePhotoObservation(photo.position)}
                  >
                    <Text style={styles.saveObservationText}>Salvar observação</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {!readOnly ? (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.secondaryButton, (!canManagePhotos() || busy) && styles.disabledButton]}
                  disabled={!canManagePhotos() || busy}
                  onPress={() => void takePhoto(photo.position)}
                >
                  <Ionicons name="camera-outline" size={18} color="#123C47" />
                  <Text style={styles.secondaryButtonText}>Câmera</Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryButton, (!canManagePhotos() || busy) && styles.disabledButton]}
                  disabled={!canManagePhotos() || busy}
                  onPress={() => void choosePhoto(photo.position)}
                >
                  <Ionicons name="images-outline" size={18} color="#123C47" />
                  <Text style={styles.secondaryButtonText}>Galeria</Text>
                </Pressable>

                {photo.has_photo ? (
                  <Pressable
                    style={styles.deleteButton}
                    disabled={busy}
                    onPress={() => void deletePhoto(photo.position)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B44747" />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal
        visible={Boolean(preview && previewUri)}
        animationType="fade"
        transparent
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewPhoto?.label ?? 'Fotografia postural'}</Text>
              <Pressable style={styles.modalClose} onPress={() => setPreview(null)}>
                <Ionicons name="close" size={24} color="#123C47" />
              </Pressable>
            </View>
            {previewUri ? (
              <View style={styles.modalImageWrap}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                {previewPhoto?.grid_enabled ? <SymmetryGrid /> : null}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type OptionSectionProps = {
  title: string;
  description: string;
  options: PosturalOption[];
  selected: string[];
  disabled: boolean;
  onToggle: (value: string) => void;
};

function OptionSection({
  title,
  description,
  options,
  selected,
  disabled,
  onToggle,
}: OptionSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.optionsWrap}>
        {options.map(option => {
          const active = selected.includes(option.key);
          return (
            <Pressable
              key={option.key}
              disabled={disabled}
              onPress={() => onToggle(option.key)}
              style={[
                styles.optionChip,
                active && styles.optionChipActive,
              ]}
            >
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={active ? '#FFFFFF' : '#66757A'}
              />
              <Text
                style={[
                  styles.optionText,
                  active && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type SingleChoiceProps = {
  title: string;
  options: PosturalOption[];
  value: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
};

function SingleChoice({
  title,
  options,
  value,
  disabled,
  onChange,
}: SingleChoiceProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.optionsWrap}>
        {options.map(option => {
          const active = value === option.key;
          return (
            <Pressable
              key={option.key}
              disabled={disabled}
              onPress={() => onChange(option.key)}
              style={[
                styles.optionChip,
                active && styles.optionChipActive,
              ]}
            >
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={active ? '#FFFFFF' : '#66757A'}
              />
              <Text
                style={[
                  styles.optionText,
                  active && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SymmetryGrid() {
  return (
    <View pointerEvents="none" style={styles.gridOverlay}>
      {(['20%', '40%', '60%', '80%'] as const).map(value => (
        <View
          key={`v-${value}`}
          style={[styles.gridVertical, { left: value }]}
        />
      ))}
      {(['20%', '40%', '60%', '80%'] as const).map(value => (
        <View
          key={`h-${value}`}
          style={[styles.gridHorizontal, { top: value }]}
        />
      ))}
      <View style={styles.gridCenterVertical} />
      <View style={styles.gridCenterHorizontal} />
    </View>
  );
}

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },
  center: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: '#66757A',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#40856C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#123C47',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 2,
  },
  flex: {
    flex: 1,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 14,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  introTitle: {
    color: '#123C47',
    fontSize: 16,
    fontWeight: '800',
  },
  introText: {
    color: '#66757A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#123C47',
    fontSize: 17,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#738085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 14,
  },
  optionsWrap: {
    gap: 9,
    marginTop: 12,
  },
  optionChip: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE3E3',
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FAFBFA',
  },
  optionChipActive: {
    backgroundColor: '#40856C',
    borderColor: '#40856C',
  },
  optionText: {
    flex: 1,
    color: '#40545A',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    backgroundColor: '#F7F9F8',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    color: '#263D44',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E5E4',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: '#123C47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
  infoBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#EEF1F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  infoText: {
    flex: 1,
    color: '#66757A',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FBEAEA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  errorBoxText: {
    flex: 1,
    color: '#8E3434',
    fontSize: 13,
    lineHeight: 18,
  },
  successBox: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#EAF4F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  successText: {
    flex: 1,
    color: '#356E5A',
    fontSize: 13,
    lineHeight: 18,
  },
  warningBox: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFF6E8',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  warningTitle: {
    color: '#7F581F',
    fontSize: 14,
    fontWeight: '800',
  },
  warningText: {
    color: '#8B6A39',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  sectionHeading: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#123C47',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionDescription: {
    color: '#66757A',
    fontSize: 13,
    marginTop: 4,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    color: '#123C47',
    fontSize: 16,
    fontWeight: '800',
  },
  photoMeta: {
    color: '#819095',
    fontSize: 12,
    marginTop: 2,
  },
  savedBadge: {
    backgroundColor: '#EAF4F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    color: '#40856C',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  photoFrame: {
    height: 300,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#EFF2F1',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderText: {
    color: '#7E8C90',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 9,
  },
  expandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(18,60,71,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F0',
  },
  switchTitle: {
    color: '#31484F',
    fontSize: 14,
    fontWeight: '700',
  },
  switchDescription: {
    color: '#859195',
    fontSize: 11,
    marginTop: 2,
  },
  photoObservationBlock: {
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F0',
  },
  photoObservationLabel: {
    color: '#31484F',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },
  photoObservationInput: {
    minHeight: 74,
    borderRadius: 13,
    backgroundColor: '#F7F9F8',
    borderWidth: 1,
    borderColor: '#E0E5E4',
    padding: 11,
    color: '#263D44',
    fontSize: 13,
  },
  saveObservationButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EAF4F0',
  },
  saveObservationText: {
    color: '#40856C',
    fontSize: 12,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    backgroundColor: '#EDF2F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: {
    color: '#123C47',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  gridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  gridCenterVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
  gridCenterHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.70)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#123C47',
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageWrap: {
    height: 560,
    maxHeight: '82%',
    backgroundColor: '#111111',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  errorPage: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: '#123C47',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  errorText: {
    color: '#66757A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bottomSpace: {
    height: 28,
  },
});
