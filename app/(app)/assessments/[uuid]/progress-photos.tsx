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
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  deleteProgressPhoto,
  getAssessmentProgressPhotos,
  getProgressPhotoDataUrl,
  revokePhotoConsent,
  savePhotoConsent,
  updateProgressPhoto,
  uploadProgressPhoto,
} from '@/services/progress-photos';
import type {
  AssessmentProgressPhotos,
  ProgressPhotoItem,
  ProgressPhotoPosition,
} from '@/types/progress-photos';

type PhotoUrls =
  Partial<
    Record<
      ProgressPhotoPosition,
      string | null
    >
  >;

type ObservationDrafts =
  Partial<
    Record<
      ProgressPhotoPosition,
      string
    >
  >;

export default function ProgressPhotosScreen() {
  const params =
    useLocalSearchParams<{
      uuid?: string | string[];
      readOnly?: string | string[];
    }>();

  const assessmentUuid =
    getParam(params.uuid);

  const readOnly =
    getParam(params.readOnly) === '1';

  const [data, setData] =
    useState<AssessmentProgressPhotos | null>(
      null
    );

  const [photoUrls, setPhotoUrls] =
    useState<PhotoUrls>({});

  const [
    observationDrafts,
    setObservationDrafts,
  ] =
    useState<ObservationDrafts>({});

  const [purpose, setPurpose] =
    useState('');

  const [consentDate, setConsentDate] =
    useState('');

  const [
    storageAuthorized,
    setStorageAuthorized,
  ] = useState(false);

  const [
    externalUseAllowed,
    setExternalUseAllowed,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [
    previewPosition,
    setPreviewPosition,
  ] =
    useState<ProgressPhotoPosition | null>(
      null
    );

  const hydrate =
    useCallback(
      (
        response:
          AssessmentProgressPhotos
      ) => {
        const consent =
          response.consent;

        setPurpose(
          consent?.purpose ?? ''
        );

        setConsentDate(
          formatDateBr(
            consent?.consent_date ??
              response.evaluation_date
          )
        );

        setStorageAuthorized(
          consent?.storage_authorized ??
            false
        );

        setExternalUseAllowed(
          consent?.external_use_allowed ??
            false
        );

        const drafts:
          ObservationDrafts = {};

        response.positions.forEach(
          photo => {
            drafts[photo.position] =
              photo.observation ?? '';
          }
        );

        setObservationDrafts(
          drafts
        );
      },
      []
    );

  const loadPhotoUrls =
    useCallback(
      async (
        response:
          AssessmentProgressPhotos
      ) => {
        if (!assessmentUuid) {
          return;
        }

        const next: PhotoUrls = {};

        await Promise.all(
          response.positions.map(
            async item => {
              if (!item.has_photo) {
                next[item.position] =
                  null;
                return;
              }

              try {
                next[item.position] =
                  await getProgressPhotoDataUrl(
                    assessmentUuid,
                    item.position
                  );
              } catch {
                next[item.position] =
                  null;
              }
            }
          )
        );

        setPhotoUrls(next);
      },
      [assessmentUuid]
    );

  const load =
    useCallback(
      async (
        showLoading = true
      ) => {
        if (!assessmentUuid) {
          setError(
            'Avaliação inválida.'
          );
          setLoading(false);
          return;
        }

        try {
          if (showLoading) {
            setLoading(true);
          }

          setError('');

          const response =
            await getAssessmentProgressPhotos(
              assessmentUuid
            );

          setData(response);
          hydrate(response);

          await loadPhotoUrls(
            response
          );
        } catch (exception) {
          setError(
            exception instanceof Error
              ? exception.message
              : 'Não foi possível carregar as fotos de evolução.'
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [
        assessmentUuid,
        hydrate,
        loadPhotoUrls,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void load();

      return undefined;
    }, [load])
  );

  async function handleSaveConsent() {
    if (
      !assessmentUuid ||
      readOnly ||
      busy
    ) {
      return;
    }

    const normalizedPurpose =
      purpose.trim();

    if (!normalizedPurpose) {
      setError(
        'Informe a finalidade do uso das fotografias.'
      );
      return;
    }

    const date =
      parseDateBr(
        consentDate
      );

    if (!date) {
      setError(
        'Informe a data do consentimento no formato DD/MM/AAAA.'
      );
      return;
    }

    try {
      setBusy(true);
      setError('');
      setMessage('');

      await savePhotoConsent(
        assessmentUuid,
        {
          purpose:
            normalizedPurpose,

          consent_date:
            date,

          external_use_allowed:
            externalUseAllowed,

          storage_authorized:
            storageAuthorized,
        }
      );

      await load(false);

      setMessage(
        storageAuthorized
          ? 'Consentimento salvo. O registro de fotos está liberado.'
          : 'Consentimento salvo sem autorização de armazenamento.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar o consentimento.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeConsent() {
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

      await revokePhotoConsent(
        assessmentUuid
      );

      await load(false);

      setMessage(
        'Consentimento revogado.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível revogar o consentimento.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function takePhoto(
    position:
      ProgressPhotoPosition
  ) {
    if (
      !canManagePhotos() ||
      busy
    ) {
      return;
    }

    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Permita o acesso à câmera para registrar a fotografia.'
      );
      return;
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

    if (
      result.canceled ||
      !result.assets[0]
    ) {
      return;
    }

    await saveSelectedPhoto(
      position,
      result.assets[0]
    );
  }

  async function choosePhoto(
    position:
      ProgressPhotoPosition
  ) {
    if (
      !canManagePhotos() ||
      busy
    ) {
      return;
    }

    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Permita o acesso às fotos para selecionar uma imagem.'
      );
      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

    if (
      result.canceled ||
      !result.assets[0]
    ) {
      return;
    }

    await saveSelectedPhoto(
      position,
      result.assets[0]
    );
  }

  async function saveSelectedPhoto(
    position:
      ProgressPhotoPosition,
    asset:
      ImagePicker.ImagePickerAsset
  ) {
    if (!assessmentUuid) {
      return;
    }

    try {
      setBusy(true);
      setError('');
      setMessage('');

      await uploadProgressPhoto(
        assessmentUuid,
        position,
        asset,
        observationDrafts[
          position
        ] ?? ''
      );

      await load(false);

      setMessage(
        'Fotografia salva com sucesso.'
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar a fotografia.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveObservation(
    position:
      ProgressPhotoPosition
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

      await updateProgressPhoto(
        assessmentUuid,
        position,
        observationDrafts[
          position
        ] ?? ''
      );

      await load(false);

      setMessage(
        'Observação salva.'
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

  async function removePhoto(
    position:
      ProgressPhotoPosition
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

      await deleteProgressPhoto(
        assessmentUuid,
        position
      );

      await load(false);

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
  }

  function canManagePhotos(): boolean {
    return Boolean(
      !readOnly &&
      data?.consent?.active
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Carregando fotos...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#123C47"
            />
          </Pressable>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.eyebrow
              }
            >
              AVALIAÇÃO FÍSICA
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Fotos de evolução
            </Text>
          </View>
        </View>

        {error ? (
          <Notice
            error
            text={error}
          />
        ) : null}

        {message ? (
          <Notice
            text={message}
          />
        ) : null}

        <StatusCard
          label={
            data?.section
              .status_label ??
            'Não iniciada'
          }
        />

        <SectionTitle
          number="01"
          title="Consentimento"
          description="O consentimento deve estar ativo e autorizar o armazenamento antes da inclusão de fotografias."
        />

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Finalidade
          </Text>

          <TextInput
            style={
              styles.textArea
            }
            value={purpose}
            editable={
              !readOnly
            }
            multiline
            placeholder="Descreva a finalidade do registro das fotos."
            placeholderTextColor="#9AA7AA"
            textAlignVertical="top"
            onChangeText={
              setPurpose
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Data do consentimento
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              consentDate
            }
            editable={
              !readOnly
            }
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#9AA7AA"
            onChangeText={
              setConsentDate
            }
          />

          <ToggleRow
            label="Autoriza armazenamento"
            description="Necessário para incluir fotografias nesta avaliação."
            value={
              storageAuthorized
            }
            disabled={
              readOnly
            }
            onPress={() =>
              setStorageAuthorized(
                value => !value
              )
            }
          />

          <ToggleRow
            label="Autoriza uso externo"
            description="Registra somente a autorização; não publica nem compartilha automaticamente."
            value={
              externalUseAllowed
            }
            disabled={
              readOnly
            }
            onPress={() =>
              setExternalUseAllowed(
                value => !value
              )
            }
          />

          {!readOnly ? (
            <Pressable
              style={
                styles.primaryButton
              }
              disabled={busy}
              onPress={
                handleSaveConsent
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Salvar consentimento
              </Text>
            </Pressable>
          ) : null}

          {!readOnly &&
          data?.consent?.active ? (
            <Pressable
              style={
                styles.dangerOutline
              }
              disabled={busy}
              onPress={
                handleRevokeConsent
              }
            >
              <Text
                style={
                  styles.dangerOutlineText
                }
              >
                Revogar consentimento
              </Text>
            </Pressable>
          ) : null}
        </View>

        <SectionTitle
          number="02"
          title="Posições"
          description="Registre as quatro posições previstas para acompanhamento da evolução física."
        />

        {!data?.consent?.active ? (
          <View
            style={
              styles.warning
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#916A32"
            />

            <Text
              style={
                styles.warningText
              }
            >
              As fotos ficam bloqueadas até existir consentimento ativo com autorização de armazenamento.
            </Text>
          </View>
        ) : null}

        {data?.positions.map(
          item => (
            <PhotoCard
              key={
                item.position
              }
              item={item}
              dataUrl={
                photoUrls[
                  item.position
                ] ?? null
              }
              observation={
                observationDrafts[
                  item.position
                ] ?? ''
              }
              readOnly={
                readOnly
              }
              enabled={
                canManagePhotos()
              }
              busy={busy}
              onObservationChange={
                value =>
                  setObservationDrafts(
                    current => ({
                      ...current,
                      [item.position]:
                        value,
                    })
                  )
              }
              onTake={() =>
                void takePhoto(
                  item.position
                )
              }
              onChoose={() =>
                void choosePhoto(
                  item.position
                )
              }
              onSaveObservation={() =>
                void saveObservation(
                  item.position
                )
              }
              onDelete={() =>
                void removePhoto(
                  item.position
                )
              }
              onPreview={() =>
                setPreviewPosition(
                  item.position
                )
              }
            />
          )
        )}

        {data?.previous ? (
          <View
            style={
              styles.previous
            }
          >
            <Ionicons
              name="time-outline"
              size={20}
              color="#40856C"
            />

            <Text
              style={
                styles.previousText
              }
            >
              Há uma avaliação anterior com fotos em{' '}
              {formatDateBr(
                data.previous
                  .evaluation_date
              )}.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={
          previewPosition !==
          null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPreviewPosition(
            null
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <Pressable
            style={
              styles.modalClose
            }
            onPress={() =>
              setPreviewPosition(
                null
              )
            }
          >
            <Ionicons
              name="close"
              size={28}
              color="#FFFFFF"
            />
          </Pressable>

          {previewPosition &&
          photoUrls[
            previewPosition
          ] ? (
            <Image
              source={{
                uri:
                  photoUrls[
                    previewPosition
                  ] ?? '',
              }}
              resizeMode="contain"
              style={
                styles.modalImage
              }
            />
          ) : null}
        </View>
      </Modal>

      {busy ? (
        <View
          style={
            styles.busyOverlay
          }
        >
          <ActivityIndicator
            size="large"
            color="#FFFFFF"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <View
      style={[
        styles.notice,
        error &&
          styles.noticeError,
      ]}
    >
      <Ionicons
        name={
          error
            ? 'alert-circle-outline'
            : 'checkmark-circle-outline'
        }
        size={19}
        color={
          error
            ? '#B44747'
            : '#40856C'
        }
      />

      <Text
        style={[
          styles.noticeText,
          error &&
            styles.noticeErrorText,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function StatusCard({
  label,
}: {
  label: string;
}) {
  return (
    <View
      style={
        styles.statusCard
      }
    >
      <View
        style={
          styles.statusIcon
        }
      >
        <Ionicons
          name="images-outline"
          size={24}
          color="#40856C"
        />
      </View>

      <View>
        <Text
          style={
            styles.statusCaption
          }
        >
          SITUAÇÃO DA SEÇÃO
        </Text>

        <Text
          style={
            styles.statusLabel
          }
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function SectionTitle({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <View
        style={
          styles.sectionNumber
        }
      >
        <Text
          style={
            styles.sectionNumberText
          }
        >
          {number}
        </Text>
      </View>

      <View
        style={
          styles.sectionHeaderText
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  disabled,
  onPress,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={
        styles.toggleRow
      }
      disabled={
        disabled
      }
      onPress={
        onPress
      }
    >
      <View
        style={
          styles.toggleText
        }
      >
        <Text
          style={
            styles.toggleLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.toggleDescription
          }
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.checkbox,
          value &&
            styles.checkboxActive,
        ]}
      >
        {value ? (
          <Ionicons
            name="checkmark"
            size={17}
            color="#FFFFFF"
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function PhotoCard({
  item,
  dataUrl,
  observation,
  readOnly,
  enabled,
  busy,
  onObservationChange,
  onTake,
  onChoose,
  onSaveObservation,
  onDelete,
  onPreview,
}: {
  item: ProgressPhotoItem;
  dataUrl: string | null;
  observation: string;
  readOnly: boolean;
  enabled: boolean;
  busy: boolean;
  onObservationChange:
    (value: string) => void;
  onTake: () => void;
  onChoose: () => void;
  onSaveObservation:
    () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  return (
    <View
      style={
        styles.photoCard
      }
    >
      <View
        style={
          styles.photoCardHeader
        }
      >
        <View>
          <Text
            style={
              styles.photoLabel
            }
          >
            {item.label}
          </Text>

          <Text
            style={
              styles.photoStatus
            }
          >
            {item.has_photo
              ? 'Foto registrada'
              : 'Sem fotografia'}
          </Text>
        </View>

        {item.has_photo ? (
          <View
            style={
              styles.savedBadge
            }
          >
            <Ionicons
              name="checkmark"
              size={14}
              color="#40856C"
            />

            <Text
              style={
                styles.savedBadgeText
              }
            >
              SALVA
            </Text>
          </View>
        ) : null}
      </View>

      {dataUrl ? (
        <Pressable
          onPress={
            onPreview
          }
        >
          <Image
            source={{
              uri: dataUrl,
            }}
            style={
              styles.photo
            }
          />

          <View
            style={
              styles.zoomHint
            }
          >
            <Ionicons
              name="expand-outline"
              size={16}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.zoomText
              }
            >
              Toque para ampliar
            </Text>
          </View>
        </Pressable>
      ) : (
        <View
          style={
            styles.emptyPhoto
          }
        >
          <Ionicons
            name="camera-outline"
            size={34}
            color="#819094"
          />

          <Text
            style={
              styles.emptyPhotoText
            }
          >
            Nenhuma foto registrada
          </Text>
        </View>
      )}

      {!readOnly ? (
        <View
          style={
            styles.actionRow
          }
        >
          <Pressable
            style={[
              styles.actionButton,
              (!enabled ||
                busy) &&
                styles.disabled,
            ]}
            disabled={
              !enabled ||
              busy
            }
            onPress={onTake}
          >
            <Ionicons
              name="camera-outline"
              size={18}
              color="#123C47"
            />

            <Text
              style={
                styles.actionText
              }
            >
              {item.has_photo
                ? 'Refazer'
                : 'Câmera'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              (!enabled ||
                busy) &&
                styles.disabled,
            ]}
            disabled={
              !enabled ||
              busy
            }
            onPress={
              onChoose
            }
          >
            <Ionicons
              name="images-outline"
              size={18}
              color="#123C47"
            />

            <Text
              style={
                styles.actionText
              }
            >
              Galeria
            </Text>
          </Pressable>
        </View>
      ) : null}

      {item.has_photo ? (
        <>
          <Text
            style={
              styles.label
            }
          >
            Observação
          </Text>

          <TextInput
            style={
              styles.observation
            }
            value={
              observation
            }
            editable={
              !readOnly
            }
            multiline
            textAlignVertical="top"
            placeholder="Observações da fotografia"
            placeholderTextColor="#9AA7AA"
            onChangeText={
              onObservationChange
            }
          />

          {!readOnly ? (
            <View
              style={
                styles.photoFooter
              }
            >
              <Pressable
                style={
                  styles.smallPrimary
                }
                disabled={
                  busy
                }
                onPress={
                  onSaveObservation
                }
              >
                <Text
                  style={
                    styles.smallPrimaryText
                  }
                >
                  Salvar observação
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.deleteButton
                }
                disabled={
                  busy
                }
                onPress={
                  onDelete
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#B44747"
                />
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function getParam(
  value:
    | string
    | string[]
    | undefined
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function formatDateBr(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return '';
  }

  const date =
    value.slice(0, 10);

  const parts =
    date.split('-');

  if (
    parts.length !== 3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function parseDateBr(
  value: string
): string | null {
  const match =
    value
      .trim()
      .match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

  if (!match) {
    return null;
  }

  const day =
    Number(match[1]);
  const month =
    Number(match[2]);
  const year =
    Number(match[3]);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F4F7F6',
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 12,
      backgroundColor:
        '#F4F7F6',
    },

    loadingText: {
      color: '#66777C',
      fontSize: 14,
    },

    content: {
      padding: 18,
      paddingBottom: 36,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#DCE6E3',
      backgroundColor:
        '#FFFFFF',
    },

    headerText: {
      flex: 1,
    },

    eyebrow: {
      color: '#40856C',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },

    title: {
      marginTop: 2,
      color: '#123C47',
      fontSize: 25,
      fontWeight: '800',
    },

    notice: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      marginBottom: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#CFE5DA',
      backgroundColor:
        '#EDF7F2',
    },

    noticeError: {
      borderColor:
        '#EFC9C9',
      backgroundColor:
        '#FFF0F0',
    },

    noticeText: {
      flex: 1,
      color: '#476D60',
      fontSize: 12,
      lineHeight: 18,
    },

    noticeErrorText: {
      color: '#9A4141',
    },

    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      marginBottom: 22,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#DFE8E5',
      backgroundColor:
        '#FFFFFF',
    },

    statusIcon: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 15,
      backgroundColor:
        '#E8F2EE',
    },

    statusCaption: {
      color: '#77888C',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.9,
    },

    statusLabel: {
      marginTop: 3,
      color: '#123C47',
      fontSize: 17,
      fontWeight: '800',
    },

    sectionHeader: {
      flexDirection: 'row',
      gap: 11,
      marginBottom: 11,
    },

    sectionNumber: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      backgroundColor:
        '#E8F2EE',
    },

    sectionNumberText: {
      color: '#40856C',
      fontSize: 11,
      fontWeight: '900',
    },

    sectionHeaderText: {
      flex: 1,
    },

    sectionTitle: {
      color: '#123C47',
      fontSize: 18,
      fontWeight: '800',
    },

    sectionDescription: {
      marginTop: 3,
      color: '#697A7F',
      fontSize: 12,
      lineHeight: 18,
    },

    card: {
      gap: 12,
      padding: 15,
      marginBottom: 23,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#DFE8E5',
      backgroundColor:
        '#FFFFFF',
    },

    label: {
      color: '#53676C',
      fontSize: 12,
      fontWeight: '700',
    },

    input: {
      minHeight: 44,
      paddingHorizontal: 11,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#D4DFDC',
      backgroundColor:
        '#FAFCFB',
      color: '#123C47',
      fontSize: 14,
    },

    textArea: {
      minHeight: 86,
      padding: 11,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#D4DFDC',
      backgroundColor:
        '#FAFCFB',
      color: '#123C47',
      fontSize: 14,
      lineHeight: 20,
    },

    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 6,
    },

    toggleText: {
      flex: 1,
    },

    toggleLabel: {
      color: '#334E55',
      fontSize: 13,
      fontWeight: '800',
    },

    toggleDescription: {
      marginTop: 3,
      color: '#7B898C',
      fontSize: 10,
      lineHeight: 15,
    },

    checkbox: {
      width: 25,
      height: 25,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        '#B8C7C3',
      backgroundColor:
        '#FFFFFF',
    },

    checkboxActive: {
      borderColor:
        '#40856C',
      backgroundColor:
        '#40856C',
    },

    primaryButton: {
      minHeight: 47,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 3,
      borderRadius: 13,
      backgroundColor:
        '#123C47',
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    dangerOutline: {
      minHeight: 43,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#E6BBBB',
    },

    dangerOutlineText: {
      color: '#A54545',
      fontSize: 12,
      fontWeight: '800',
    },

    warning: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 9,
      padding: 13,
      marginBottom: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#E9D7BA',
      backgroundColor:
        '#FFF7EA',
    },

    warningText: {
      flex: 1,
      color: '#806D50',
      fontSize: 11,
      lineHeight: 17,
    },

    photoCard: {
      padding: 14,
      marginBottom: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#DFE8E5',
      backgroundColor:
        '#FFFFFF',
    },

    photoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    photoLabel: {
      color: '#123C47',
      fontSize: 16,
      fontWeight: '800',
    },

    photoStatus: {
      marginTop: 2,
      color: '#7A898D',
      fontSize: 10,
    },

    savedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 9,
      backgroundColor:
        '#E8F2EE',
    },

    savedBadgeText: {
      color: '#40856C',
      fontSize: 8,
      fontWeight: '900',
    },

    photo: {
      width: '100%',
      height: 250,
      borderRadius: 14,
      backgroundColor:
        '#E9EFED',
    },

    zoomHint: {
      position: 'absolute',
      right: 9,
      bottom: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 9,
      backgroundColor:
        'rgba(0,0,0,0.55)',
    },

    zoomText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },

    emptyPhoto: {
      height: 180,
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 7,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor:
        '#C9D5D2',
      backgroundColor:
        '#F8FAF9',
    },

    emptyPhotoText: {
      color: '#819094',
      fontSize: 11,
    },

    actionRow: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 10,
      marginBottom: 12,
    },

    actionButton: {
      flex: 1,
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 6,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#D4DFDC',
      backgroundColor:
        '#F9FBFA',
    },

    actionText: {
      color: '#123C47',
      fontSize: 11,
      fontWeight: '800',
    },

    disabled: {
      opacity: 0.4,
    },

    observation: {
      minHeight: 72,
      marginTop: 7,
      padding: 10,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#D4DFDC',
      backgroundColor:
        '#FAFCFB',
      color: '#123C47',
      fontSize: 13,
    },

    photoFooter: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 9,
    },

    smallPrimary: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      backgroundColor:
        '#E8F2EE',
    },

    smallPrimaryText: {
      color: '#2F6C57',
      fontSize: 11,
      fontWeight: '800',
    },

    deleteButton: {
      width: 43,
      height: 40,
      alignItems: 'center',
      justifyContent:
        'center',
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#E8CACA',
      backgroundColor:
        '#FFF7F7',
    },

    previous: {
      flexDirection: 'row',
      gap: 8,
      padding: 13,
      marginTop: 4,
      borderRadius: 13,
      backgroundColor:
        '#EDF5F2',
    },

    previousText: {
      flex: 1,
      color: '#587168',
      fontSize: 11,
      lineHeight: 17,
    },

    modalBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(0,0,0,0.92)',
    },

    modalClose: {
      position: 'absolute',
      top: 52,
      right: 20,
      zIndex: 2,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    modalImage: {
      width: '100%',
      height: '82%',
    },

    busyOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(18,60,71,0.38)',
    },
  });
