import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getStudentAssessmentPhotoComparison } from '@/services/assessment-photo-comparison';
import { listStudentAssessmentHistory } from '@/services/assessment-history';
import { getProgressPhotoDataUrl } from '@/services/progress-photos';
import type {
  AssessmentPhotoComparisonResponse,
  PhotoComparisonItem,
} from '@/types/assessment-photo-comparison';
import type { StudentAssessmentHistoryEntry } from '@/types/assessment-history';
import type { ProgressPhotoPosition } from '@/types/progress-photos';

type Comparison = AssessmentPhotoComparisonResponse['data'];
type PhotoSides = { base: string | null; target: string | null };
type Preview = { uri: string; title: string } | null;

const PER_PAGE = 20;
const EMPTY_PHOTOS: PhotoSides = { base: null, target: null };

function dateBr(value: string | null): string {
  if (!value) return 'Sem data';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function compareDate(a: StudentAssessmentHistoryEntry, b: StudentAssessmentHistoryEntry) {
  const byDate = (a.evaluation_date ?? '').localeCompare(b.evaluation_date ?? '');
  return byDate || a.uuid.localeCompare(b.uuid);
}

function PhotoPanel({
  title,
  date,
  photo,
  imageUri,
  loading,
  onPreview,
}: {
  title: string;
  date: string;
  photo: PhotoComparisonItem;
  imageUri: string | null;
  loading: boolean;
  onPreview: (uri: string, title: string) => void;
}) {
  return (
    <View style={styles.photoPanel}>
      <Text style={styles.photoTitle}>{title}</Text>
      <Text style={styles.photoDate}>{dateBr(date)}</Text>
      {loading && photo.has_photo ? (
        <View style={styles.photoFrame}>
          <ActivityIndicator size="small" color="#40856C" />
        </View>
      ) : imageUri ? (
        <Pressable
          style={styles.photoFrame}
          onPress={() => onPreview(imageUri, `${title} • ${dateBr(date)}`)}
          accessibilityLabel={`Ampliar foto ${title}`}
        >
          <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.image} />
          <View style={styles.expandIcon}>
            <Ionicons name="expand-outline" color="#FFFFFF" size={16} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.photoFrame}>
          <Ionicons name="image-outline" color="#95A29F" size={30} />
          <Text style={styles.missingText}>
            {photo.has_photo ? 'Imagem indisponível' : 'Sem foto nesta posição'}
          </Text>
        </View>
      )}
      <Text style={styles.capturedText}>
        {photo.captured_at ? `Registro: ${dateBr(photo.captured_at)}` : 'Data da foto não informada'}
      </Text>
      {photo.observation ? (
        <Text style={styles.photoObservation} numberOfLines={4}>
          {photo.observation}
        </Text>
      ) : null}
    </View>
  );
}

export default function AssessmentPhotoComparisonScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const studentUuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;

  const [items, setItems] = useState<StudentAssessmentHistoryEntry[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [position, setPosition] = useState<ProgressPhotoPosition>('front');
  const [photos, setPhotos] = useState<PhotoSides>(EMPTY_PHOTOS);
  const [preview, setPreview] = useState<Preview>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const historyRequest = useRef(0);
  const photoRequest = useRef(0);

  const loadHistory = useCallback(
    async (requestedPage: number, append = false, refresh = false) => {
      const requestId = ++historyRequest.current;
      if (!studentUuid) {
        setLoading(false);
        setError('Identificação do aluno inválida.');
        return;
      }

      if (append) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const response = await listStudentAssessmentHistory(studentUuid, {
          page: requestedPage,
          per_page: PER_PAGE,
          status: 'completed',
        });
        if (historyRequest.current !== requestId) return;
        setItems(previous => {
          if (!append) return response.data;
          const existing = new Set(previous.map(value => value.uuid));
          return [...previous, ...response.data.filter(value => !existing.has(value.uuid))];
        });
        setPage(response.meta.current_page);
        setLastPage(response.meta.last_page);
      } catch (exception) {
        if (historyRequest.current !== requestId) return;
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar as avaliações concluídas.'
        );
      } finally {
        if (historyRequest.current === requestId) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [studentUuid]
  );

  const resetComparison = useCallback(() => {
    photoRequest.current += 1;
    setComparison(null);
    setPhotos(EMPTY_PHOTOS);
    setPhotoError('');
    setLoadingPhotos(false);
    setComparisonError('');
    setPosition('front');
    setPreview(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSelection([]);
      resetComparison();
      void loadHistory(1);
      return () => {
        historyRequest.current += 1;
        photoRequest.current += 1;
        setPhotos(EMPTY_PHOTOS);
        setPreview(null);
      };
    }, [loadHistory, resetComparison])
  );

  useEffect(() => {
    const id = ++photoRequest.current;
    // Limpeza e indicador de carregamento ficam nos eventos de selecao,
    // nao dentro do Effect. O Effect apenas busca imagens privadas.
    if (!comparison) return;
    const selected = comparison.positions.find(value => value.position === position);
    if (!selected) return;
    if (!selected.base.has_photo && !selected.target.has_photo) return;

    void (async () => {
      try {
        const [base, target] = await Promise.all([
          selected.base.has_photo
            ? getProgressPhotoDataUrl(comparison.base.uuid, position)
            : Promise.resolve(null),
          selected.target.has_photo
            ? getProgressPhotoDataUrl(comparison.target.uuid, position)
            : Promise.resolve(null),
        ]);
        if (photoRequest.current !== id) return;
        setPhotos({ base, target });
      } catch (exception) {
        if (photoRequest.current !== id) return;
        setPhotoError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar as fotografias privadas.'
        );
      } finally {
        if (photoRequest.current === id) setLoadingPhotos(false);
      }
    })();

    return () => {
      photoRequest.current += 1;
    };
  }, [comparison, position]);

  function toggleSelection(uuid: string) {
    if (comparing) return;
    resetComparison();
    setSelection(current => {
      if (current.includes(uuid)) return current.filter(value => value !== uuid);
      return current.length >= 2 ? [uuid] : [...current, uuid];
    });
  }

  async function comparePhotos() {
    if (!studentUuid || selection.length !== 2 || comparing) return;
    setComparing(true);
    resetComparison();
    try {
      const result = await getStudentAssessmentPhotoComparison(
        studentUuid,
        selection[0],
        selection[1]
      );
      const firstAvailable =
        result.positions.find(value => value.both_available) ??
        result.positions.find(value => value.base.has_photo || value.target.has_photo);
      setLoadingPhotos(Boolean(firstAvailable?.base.has_photo || firstAvailable?.target.has_photo));
      setPosition(firstAvailable?.position ?? 'front');
      setComparison(result);
    } catch (exception) {
      setComparisonError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível comparar as fotografias.'
      );
    } finally {
      setComparing(false);
    }
  }

  function refresh() {
    if (comparing) return;
    setSelection([]);
    resetComparison();
    void loadHistory(1, false, true);
  }

  const selectedPosition = comparison?.positions.find(value => value.position === position);
  const selectedItems = items.filter(item => selection.includes(item.uuid)).sort(compareDate);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.headingRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color="#123C47" />
          </Pressable>
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>EVOLUÇÃO FÍSICA</Text>
            <Text style={styles.heading}>Comparação de fotografias</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Selecione duas avaliações concluídas do mesmo aluno. A comparação
          utiliza apenas fotografias autorizadas para acompanhamento clínico.
        </Text>

        <View style={styles.counterCard}>
          <Ionicons name="images-outline" size={20} color="#40856C" />
          <Text style={styles.counterText}>Selecionadas: {selection.length}/2</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadHistory(1)}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && items.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#40856C" />
            <Text style={styles.muted}>Carregando avaliações...</Text>
          </View>
        ) : !error && items.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="calendar-outline" size={30} color="#889A94" />
            <Text style={styles.emptyText}>Ainda não há avaliações concluídas.</Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            {items.map(item => {
              const selected = selection.includes(item.uuid);
              return (
                <Pressable
                  key={item.uuid}
                  style={[styles.assessmentCard, selected && styles.assessmentSelected]}
                  onPress={() => toggleSelection(item.uuid)}
                  disabled={comparing}
                >
                  <View style={styles.assessmentContent}>
                    <Text style={styles.assessmentDate}>{dateBr(item.evaluation_date)}</Text>
                    <Text style={styles.assessmentEvaluator}>
                      {item.evaluator.name || 'Avaliador não informado'}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={selected ? '#40856C' : '#A4B1AD'}
                  />
                </Pressable>
              );
            })}
            {!loading && page < lastPage ? (
              <Pressable
                style={styles.loadMoreButton}
                onPress={() => void loadHistory(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? <ActivityIndicator color="#123C47" /> : (
                  <Text style={styles.loadMoreText}>Carregar mais avaliações</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}

        {selection.length === 2 && selectedItems.length === 2 ? (
          <Text style={styles.selectionHint}>
            {dateBr(selectedItems[0].evaluation_date)} até {dateBr(selectedItems[1].evaluation_date)}
          </Text>
        ) : null}

        <Pressable
          style={[styles.compareButton, (selection.length !== 2 || comparing) && styles.disabled]}
          onPress={() => void comparePhotos()}
          disabled={selection.length !== 2 || comparing}
        >
          {comparing ? <ActivityIndicator color="#FFFFFF" /> : (
            <Ionicons name="git-compare-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.compareText}>
            {comparing ? 'Carregando comparação...' : 'Comparar fotografias'}
          </Text>
        </Pressable>

        {comparisonError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{comparisonError}</Text>
          </View>
        ) : null}

        {comparison ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultHeading}>Comparação por posição</Text>
            <Text style={styles.muted}>
              {comparison.available_pairs} de 4 posições com fotos nas duas datas
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.positionScroll}>
              {comparison.positions.map(item => (
                <Pressable
                  key={item.position}
                  onPress={() => {
                     if (position === item.position) return;
                     // Cancela a busca anterior e limpa imagens antes de mudar a posicao.
                     photoRequest.current += 1;
                     setPreview(null);
                     setPhotos(EMPTY_PHOTOS);
                     setPhotoError('');
                     setLoadingPhotos(item.base.has_photo || item.target.has_photo);
                     setPosition(item.position);
                   }}
                  style={[styles.positionChip, position === item.position && styles.positionActive]}
                >
                  <Text style={[styles.positionText, position === item.position && styles.positionTextActive]}>
                    {item.label}{item.both_available ? ' ✓' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {selectedPosition ? (
              <View style={styles.photoRow}>
                <PhotoPanel
                  title="Anterior"
                  date={comparison.base.evaluation_date}
                  photo={selectedPosition.base}
                  imageUri={photos.base}
                  loading={loadingPhotos}
                  onPreview={(uri, title) => setPreview({ uri, title })}
                />
                <PhotoPanel
                  title="Mais recente"
                  date={comparison.target.evaluation_date}
                  photo={selectedPosition.target}
                  imageUri={photos.target}
                  loading={loadingPhotos}
                  onPreview={(uri, title) => setPreview({ uri, title })}
                />
              </View>
            ) : null}

            {photoError ? <Text style={styles.warningText}>{photoError}</Text> : null}
            <Text style={styles.notice}>{comparison.note}</Text>
            <Text style={styles.privacyNote}>
              Fotos privadas, exibidas somente após autenticação. Não há link público nem exportação nesta tela.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={preview !== null} animationType="fade" transparent onRequestClose={() => setPreview(null)}>
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{preview?.title ?? ''}</Text>
            <Pressable onPress={() => setPreview(null)} accessibilityLabel="Fechar foto ampliada">
              <Ionicons name="close-circle" size={29} color="#FFFFFF" />
            </Pressable>
          </View>
          {preview ? (
            <Image source={{ uri: preview.uri }} resizeMode="contain" style={styles.modalImage} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8F6' },
  content: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 55 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backButton: { backgroundColor: '#FFFFFF', borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1 },
  eyebrow: { color: '#40856C', fontSize: 10, fontWeight: '800' },
  heading: { color: '#172D34', fontSize: 20, fontWeight: '800' },
  description: { color: '#607679', fontSize: 12, lineHeight: 19, marginBottom: 15 },
  counterCard: { backgroundColor: '#EAF3EF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13 },
  counterText: { color: '#336B55', fontSize: 12, fontWeight: '800' },
  listSection: { gap: 9 },
  assessmentCard: { backgroundColor: '#FFFFFF', borderColor: '#E3E9E6', borderWidth: 1, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center' },
  assessmentSelected: { borderColor: '#40856C', backgroundColor: '#F0F8F3' },
  assessmentContent: { flex: 1 },
  assessmentDate: { color: '#172D34', fontWeight: '800', fontSize: 14 },
  assessmentEvaluator: { color: '#82908F', fontSize: 11, marginTop: 4 },
  loadMoreButton: { paddingVertical: 14, alignItems: 'center', backgroundColor: '#EDF2EF', borderRadius: 13, marginTop: 4 },
  loadMoreText: { color: '#123C47', fontSize: 12, fontWeight: '800' },
  selectionHint: { color: '#62787A', textAlign: 'center', marginTop: 15, fontSize: 11 },
  compareButton: { borderRadius: 15, backgroundColor: '#123C47', marginVertical: 15, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  compareText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.48 },
  errorBox: { backgroundColor: '#FFF0EE', borderRadius: 15, padding: 15, marginVertical: 8, gap: 8 },
  errorText: { color: '#9F4545', fontSize: 12, lineHeight: 18 },
  retryText: { color: '#123C47', fontSize: 12, fontWeight: '800' },
  centerBox: { minHeight: 105, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: '#7D8C8E', fontSize: 12 },
  muted: { color: '#7B8B8E', fontSize: 11, lineHeight: 16 },
  resultSection: { marginTop: 12, gap: 10 },
  resultHeading: { fontSize: 17, fontWeight: '800', color: '#172D34' },
  positionScroll: { marginVertical: 7 },
  positionChip: { backgroundColor: '#FFFFFF', borderColor: '#DFE7E2', borderWidth: 1, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 13, marginRight: 7 },
  positionActive: { backgroundColor: '#40856C', borderColor: '#40856C' },
  positionText: { fontSize: 11, fontWeight: '700', color: '#5E7472' },
  positionTextActive: { color: '#FFFFFF' },
  photoRow: { flexDirection: 'row', gap: 9 },
  photoPanel: { flex: 1, minWidth: 0, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 9, gap: 6 },
  photoTitle: { textAlign: 'center', fontWeight: '800', color: '#172D34', fontSize: 12 },
  photoDate: { color: '#7B898A', textAlign: 'center', fontSize: 10 },
  photoFrame: { width: '100%', height: 220, backgroundColor: '#EAF0ED', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  expandIcon: { position: 'absolute', right: 7, bottom: 7, backgroundColor: '#123C47CC', borderRadius: 8, padding: 6 },
  missingText: { color: '#80918F', textAlign: 'center', fontSize: 10, marginTop: 8, paddingHorizontal: 5 },
  capturedText: { color: '#84928F', fontSize: 9, lineHeight: 13 },
  photoObservation: { color: '#53666A', fontSize: 10, lineHeight: 15 },
  warningText: { color: '#9A4C44', fontSize: 12 },
  notice: { color: '#607A76', fontSize: 11, lineHeight: 18, marginTop: 5 },
  privacyNote: { color: '#879694', fontSize: 10, lineHeight: 16 },
  modalRoot: { flex: 1, backgroundColor: '#091A1E', padding: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  modalTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, flex: 1 },
  modalImage: { flex: 1, width: '100%' },
});
