import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { downloadAssessmentReport } from '@/services/assessment-reports';
import { listStudentAssessmentHistory } from '@/services/assessment-history';
import type { StudentAssessmentHistoryEntry } from '@/types/assessment-history';

function dateBR(value: string | null): string {
  if (!value) return 'Data indisponível';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const PAGE_SIZE = 20;

export default function AssessmentReportsScreen() {
  const params = useLocalSearchParams<{ uuid?: string | string[] }>();
  const studentUuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;

  const [items, setItems] = useState<StudentAssessmentHistoryEntry[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [report, setReport] = useState<{ file: File; uuid: string } | null>(null);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async (nextPage = 1, append = false, refresh = false) => {
    const id = ++requestId.current;
    if (!studentUuid) {
      setError('Aluno não identificado.');
      setLoading(false);
      return;
    }
    try {
      if (append) setLoadingMore(true);
      else if (refresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const result = await listStudentAssessmentHistory(studentUuid, {
        status: 'completed',
        per_page: PAGE_SIZE,
        page: nextPage,
      });
      if (id !== requestId.current) return;
      setItems(current => {
        if (!append) return result.data;
        const known = new Set(current.map(item => item.uuid));
        return [...current, ...result.data.filter(item => !known.has(item.uuid))];
      });
      setPage(result.meta.current_page);
      setLastPage(result.meta.last_page);
    } catch (exception) {
      if (id !== requestId.current) return;
      setError(exception instanceof Error ? exception.message : 'Falha ao carregar avaliações.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, [studentUuid]);

  useFocusEffect(useCallback(() => {
    void load(1);
    return () => { requestId.current += 1; };
  }, [load]));

  async function openReport() {
    if (!studentUuid || !selectedUuid || downloading) return;
    setDownloading(true);
    setError('');
    try {
      if (report?.file.exists) {
        report.file.delete();
      }
      setReport(null);
      const file = await downloadAssessmentReport(studentUuid, selectedUuid);
      setReport({ file, uuid: selectedUuid });
      await file.preview({ title: 'Relatório de avaliação física', mimeType: 'application/pdf' });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Falha ao abrir o PDF.');
    } finally {
      setDownloading(false);
    }
  }

  async function shareReport() {
    if (!report || report.uuid !== selectedUuid || downloading) return;
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhamento indisponível', 'Este dispositivo não permite compartilhar arquivos neste momento.');
        return;
      }
      await Sharing.shareAsync(report.file.uri, {
        dialogTitle: 'Compartilhar relatório de avaliação física',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível compartilhar o PDF.');
    }
  }

  function clearTemporaryPdf() {
    if (report?.file.exists) {
      report.file.delete();
    }
    setReport(null);
    Alert.alert('Arquivo temporário', 'A cópia local do PDF foi excluída do cache do aplicativo.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load(1, false, true)} />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" color="#123C47" size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MF SAÚDE E MOVIMENTO</Text>
            <Text style={styles.title}>Relatórios PDF</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Escolha uma avaliação concluída para gerar um relatório com as medidas e o acompanhamento disponível.
        </Text>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" color="#40856C" size={19} />
          <Text style={styles.noticeText}>
            Documento confidencial. Nesta primeira versão, o relatório não inclui fotos, laudos ou classificações clínicas ainda não aprovadas.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load(1)}>
              <Text style={styles.retry}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#40856C" />
            <Text style={styles.muted}>Carregando avaliações concluídas...</Text>
          </View>
        ) : items.length === 0 && !error ? (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={34} color="#8A9998" />
            <Text style={styles.emptyTitle}>Nenhuma avaliação concluída</Text>
            <Text style={styles.muted}>Finalize uma avaliação antes de gerar o relatório.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Selecione uma avaliação</Text>
            {items.map(item => {
              const selected = selectedUuid === item.uuid;
              return (
                <Pressable
                  key={item.uuid}
                  disabled={downloading}
                  style={[styles.item, selected && styles.itemSelected]}
                  onPress={() => { setSelectedUuid(item.uuid); setError(''); }}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? '#40856C' : '#90A3A1'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{dateBR(item.evaluation_date)}</Text>
                    <Text style={styles.muted}>{item.evaluator?.name || 'Avaliador não informado'}</Text>
                    <Text style={styles.itemCaption}>
                      Peso: {item.weight_kg === null ? '—' : `${item.weight_kg} kg`} · IMC: {item.bmi ?? '—'}
                    </Text>
                  </View>
                  <Ionicons name="document-attach-outline" size={21} color="#40856C" />
                </Pressable>
              );
            })}
            {page < lastPage ? (
              <Pressable
                style={styles.loadMore}
                disabled={loadingMore}
                onPress={() => void load(page + 1, true)}
              >
                <Text style={styles.loadMoreText}>{loadingMore ? 'Carregando...' : 'Ver mais avaliações'}</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <Pressable
          style={[styles.mainButton, (!selectedUuid || downloading) && styles.disabled]}
          disabled={!selectedUuid || downloading}
          onPress={() => void openReport()}
        >
          {downloading ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="document-text-outline" color="#FFFFFF" size={20} />}
          <Text style={styles.mainButtonText}>{downloading ? 'Gerando PDF...' : 'Gerar e visualizar PDF'}</Text>
        </Pressable>

        {report && report.uuid === selectedUuid ? (
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={() => void shareReport()}>
              <Ionicons name="share-outline" color="#40856C" size={19} />
              <Text style={styles.actionText}>Compartilhar ou imprimir</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={clearTemporaryPdf}>
              <Ionicons name="trash-outline" color="#9F5555" size={18} />
              <Text style={styles.deleteText}>Excluir cópia temporária</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={styles.footer}>
          O PDF é gerado na API com autorização de acesso e guardado temporariamente no cache do dispositivo. Não compartilhe sem a finalidade e autorização adequadas.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8F6' },
  container: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 17, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#40856C', fontWeight: '800', fontSize: 10 },
  title: { fontSize: 21, color: '#123C47', fontWeight: '800', marginTop: 4 },
  description: { color: '#617779', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  notice: { borderRadius: 15, backgroundColor: '#EAF3EF', padding: 14, flexDirection: 'row', gap: 10, marginBottom: 20 },
  noticeText: { flex: 1, fontSize: 11, color: '#315F52', lineHeight: 17 },
  errorBox: { borderRadius: 14, padding: 15, backgroundColor: '#FFF0EF', marginBottom: 16 },
  errorText: { color: '#A34949', fontSize: 12 },
  retry: { color: '#123C47', fontWeight: '800', fontSize: 12, marginTop: 8 },
  center: { alignItems: 'center', padding: 28, gap: 10 },
  emptyTitle: { color: '#123C47', fontWeight: '800', fontSize: 14 },
  muted: { color: '#809091', fontSize: 11, marginTop: 4 },
  sectionTitle: { color: '#123C47', fontSize: 13, fontWeight: '800', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E9E5', padding: 15, borderRadius: 16, marginBottom: 9 },
  itemSelected: { borderColor: '#40856C', backgroundColor: '#F1F8F3' },
  itemTitle: { fontSize: 14, fontWeight: '800', color: '#123C47' },
  itemCaption: { color: '#647D7E', fontSize: 10, marginTop: 7 },
  loadMore: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14 },
  loadMoreText: { color: '#40856C', fontSize: 12, fontWeight: '800' },
  mainButton: { marginTop: 20, flexDirection: 'row', gap: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#123C47', padding: 17, borderRadius: 15 },
  mainButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  actions: { gap: 9, marginTop: 12 },
  actionButton: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#40856C', padding: 14, borderRadius: 14 },
  actionText: { color: '#40856C', fontWeight: '800', fontSize: 12 },
  deleteButton: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', padding: 13 },
  deleteText: { color: '#9F5555', fontWeight: '700', fontSize: 12 },
  footer: { marginTop: 20, color: '#718487', textAlign: 'center', fontSize: 10, lineHeight: 16 },
});
