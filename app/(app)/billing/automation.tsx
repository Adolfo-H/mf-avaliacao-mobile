import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMFBillingTheme } from '@/lib/mf-billing-theme';
import { BButton, BCard, BCheck, BError, BField, BText } from '@/components/MFBillingUI';
import { getAutomationHistory, getAutomationSettings, updateAutomationSettings } from '@/services/mf-billing-automation';
import type { BillingAutomationSettings, BillingAutomationInput, BillingAutomationJob } from '@/types/mf-billing-automation';

const tags = ['{nome}', '{mes}', '{data}', '{valor}', '{estudio}', '{dias_atraso}'];
const STATUS: Record<string, string> = {
  reserved: 'Reservada · não enviada', sending: 'Enviando', sent: 'Envio registrado pelo conector',
  unknown: 'Resultado incerto · exige conferência', not_sent: 'Não enviada',
  cancelled: 'Cancelada após nova verificação',
};
const sample = {
  '{nome}': 'Ana', '{mes}': '11/2026', '{data}': '10/11/2026', '{valor}': 'R$ 250,00',
  '{estudio}': 'MF Saúde & Movimento', '{dias_atraso}': '3',
};
function previewMessage(text: string) {
  return tags.reduce((s, key) => s.replaceAll(key, sample[key as keyof typeof sample] ?? ''), text);
}
function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : 'Não foi possível salvar. Atualize e tente novamente.';
}

export default function BillingAutomationScreen() {
  const { user } = useAuth();
  const { colors: c, desktop } = useMFBillingTheme();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState<BillingAutomationSettings | null>(null);
  const [history, setHistory] = useState<BillingAutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activePreview, setActivePreview] = useState(0);
  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [s, h] = await Promise.all([getAutomationSettings(), getAutomationHistory()]);
      setData(s); setHistory(h); setError('');
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [isAdmin]);
  // Atualiza somente o estado operacional: nao perde alteracoes nao salvas nos campos.
  const refreshConnection = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const fresh = await getAutomationSettings();
      setData(previous => previous ? {
        ...previous,
        worker_online: fresh.worker_online,
        worker_matches_sender: fresh.worker_matches_sender,
        server_armed: fresh.server_armed,
        worker_seen_at: fresh.worker_seen_at,
      } : fresh);
    } catch {
      setData(previous => previous ? {...previous,worker_online:false} : previous);
    }
  }, [isAdmin]);
  useFocusEffect(useCallback(() => {
    void load();
    const handle = setInterval(() => { void refreshConnection(); }, 30000);
    return () => clearInterval(handle);
  }, [load,refreshConnection]));

  const patch = (value: Partial<BillingAutomationSettings>) => setData(old => old ? { ...old, ...value } : old);
  const save = async () => {
    if (!data || saving) return;
    try {
      setSaving(true); setError(''); setNotice('');
      if (data.enabled && !data.sender_phone.trim()) throw new Error('Informe o número do WhatsApp com DDI.');
      if (!/^(0[7-9]|1[0-8]):[0-5]\d$/.test(data.send_time)) throw new Error('Use um horário entre 07:00 e 18:59.');
      if (data.templates.some(t => t.trim().length < 30)) throw new Error('Cada mensagem deve ter pelo menos 30 caracteres.');
      const input: BillingAutomationInput = {
        enabled: data.enabled,
        sender_phone: data.sender_phone,
        first_after_days: data.first_after_days,
        repeat_interval_days: data.repeat_interval_days,
        max_reminders: data.max_reminders,
        send_time: data.send_time,
        templates: data.templates,
        revision: data.revision,
      };
      const updated = await updateAutomationSettings(input);
      setData(updated);
      setNotice('Preferências salvas. Os avisos começam após a conexão do WhatsApp.');
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };

  if (!isAdmin) return <View style={{flex:1,backgroundColor:c.bg,padding:22}}><BCard><BText strong>Configuração restrita</BText><BText muted>Somente o administrador configura os lembretes automáticos.</BText><BButton secondary label="Voltar" onPress={()=>router.back()}/></BCard></View>;
  return <ScrollView style={{flex:1,backgroundColor:c.bg}} keyboardShouldPersistTaps="handled"
    contentContainerStyle={{width:'100%',maxWidth:920,alignSelf:'center',padding:desktop?30:16,gap:18,paddingBottom:65}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar às mensalidades" onPress={()=>router.back()} style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:10}}>
      <Ionicons name="chevron-back" color={c.ink} size={22}/><Text style={{color:c.ink,fontWeight:'700'}}>Voltar às mensalidades</Text>
    </Pressable>
    <View style={{gap:6}}><Text style={{color:c.greenText,fontSize:11,fontWeight:'800',letterSpacing:1.1}}>FINANCEIRO · CONFIGURAÇÃO</Text>
      <BText strong size={desktop?31:25}>Lembretes automáticos</BText>
      <BText muted>Escolha o número, os horários e as mensagens de cobrança.</BText>
    </View>
    <BCard><BText strong>Como funciona</BText><BText muted>Os avisos seguem os prazos definidos abaixo. Quando o pagamento é registrado, os próximos avisos param.</BText></BCard>
    <BError message={error}/>{notice?<View style={{padding:14,backgroundColor:c.greenSoft,borderRadius:12}}><Text style={{color:c.greenText,fontWeight:'700'}}>{notice}</Text></View>:null}
    {loading?<ActivityIndicator color={c.greenText} size="large"/>:null}
    {data?<>
      <BCard><View style={{gap:8}}><BText strong size={19}>1 · Ativação e número</BText>
        <BCheck label="Ativar os lembretes automáticos" checked={data.enabled} onChange={enabled=>patch({enabled})} disabled={saving}/>
        <BField label="Meu WhatsApp remetente (com DDI)" value={data.sender_phone} onChangeText={sender_phone=>patch({sender_phone})}
          editable={!saving} placeholder="+55 45 99999-0000" keyboardType="phone-pad"/>
        <View style={{padding:12,borderRadius:10,backgroundColor:data.server_armed&&data.worker_online&&data.worker_matches_sender?c.greenSoft:c.warningSoft}}>
          <Text style={{color:data.server_armed&&data.worker_online&&data.worker_matches_sender?c.greenText:c.warning,fontWeight:'800'}}>
            {data.server_armed&&data.worker_online&&data.worker_matches_sender?'● WhatsApp conectado':'● WhatsApp não conectado'}
          </Text>
          <Text style={{color:c.muted,fontSize:12,marginTop:6}}>Conexão verificada automaticamente a cada 30 segundos. Se cair, os lembretes ficam indisponíveis até a reconexão.</Text>
        </View>
      </View></BCard>
      <BCard><BText strong size={19}>2 · Prazo e repetição</BText>
        <BText strong>Primeiro aviso após quantos dias do vencimento?</BText>
        <View style={{flexDirection:'row',gap:10}}>{[3,4,5].map(days=><Pressable key={days} onPress={()=>patch({first_after_days:days})}
          accessibilityRole="radio" accessibilityState={{checked:data.first_after_days===days}}
          style={{flex:1,paddingVertical:13,borderWidth:1,borderRadius:12,borderColor:data.first_after_days===days?c.greenText:c.border,backgroundColor:data.first_after_days===days?c.greenSoft:c.surface,alignItems:'center'}}>
          <Text style={{fontWeight:'800',color:data.first_after_days===days?c.greenText:c.ink}}>{days} dias</Text></Pressable>)}</View>
        <BField label="Intervalo entre avisos seguintes (dias)" value={String(data.repeat_interval_days)}
          onChangeText={v=>patch({repeat_interval_days:Math.max(2,Math.min(30,Number(v.replace(/\D/g,''))||2))})}
          keyboardType="number-pad" maxLength={2} editable={!saving}/>
        <BText strong>Máximo de lembretes por mensalidade</BText>
        <View style={{flexDirection:'row',gap:10}}>{[1,2,3].map(count=><Pressable key={count} accessibilityRole="radio" accessibilityState={{checked:data.max_reminders===count}}
          onPress={()=>patch({max_reminders:count})} style={{flex:1,paddingVertical:13,borderWidth:1,borderRadius:12,borderColor:data.max_reminders===count?c.greenText:c.border,backgroundColor:data.max_reminders===count?c.greenSoft:c.surface,alignItems:'center'}}><Text style={{color:data.max_reminders===count?c.greenText:c.ink,fontWeight:'800'}}>{count}</Text></Pressable>)}</View>
        <BField label="Horário do estúdio (HH:MM)" value={data.send_time} editable={!saving} onChangeText={send_time=>patch({send_time})} placeholder="09:00" maxLength={5}/>
        <View style={{backgroundColor:c.soft,borderRadius:12,padding:14,gap:4}}><BText strong>Exemplo: mensalidade vence dia 10</BText>
          <BText muted>1º aviso: dia {10+data.first_after_days} · {data.send_time}</BText>
          {data.max_reminders>=2?<BText muted>2º aviso: dia {10+data.first_after_days+data.repeat_interval_days} · {data.send_time}</BText>:null}
          {data.max_reminders>=3?<BText muted>3º aviso: após mais {data.repeat_interval_days} dias · {data.send_time}</BText>:null}
          <BText muted size={12}>Se o mês terminar, a contagem continua no mês seguinte.</BText>
        </View>
      </BCard>
      <BCard><BText strong size={19}>3 · Mensagens personalizadas</BText>
        <BText muted>Personalize o texto de cada aviso. Campos disponíveis: {tags.join(' · ')}</BText>
        {data.templates.map((t,index)=><View key={index} style={{gap:8}}>
          <BField label={`${index+1}ª mensagem${index>=data.max_reminders?' (não usada no limite atual)':''}`} value={t}
            multiline numberOfLines={5} maxLength={950} editable={!saving} onChangeText={v=>patch({templates:data.templates.map((old,i)=>i===index?v:old)})}
            style={{minHeight:130,textAlignVertical:'top'}}/>
          <Pressable onPress={()=>setActivePreview(index)} style={{paddingVertical:6}}><Text style={{color:c.greenText,fontWeight:'700'}}>Visualizar mensagem {index+1}</Text></Pressable>
        </View>)}
        <View style={{padding:16,borderRadius:14,backgroundColor:c.greenSoft,gap:8}}><Text style={{color:c.greenText,fontWeight:'800'}}>Prévia da mensagem {activePreview+1}</Text><Text style={{color:c.ink,fontSize:14,lineHeight:23}}>{previewMessage(data.templates[activePreview]||'')}</Text><Text style={{color:c.muted,fontSize:12}}>O aviso final também incluirá opção para deixar de receber lembretes.</Text></View>
      </BCard>
      <BCard><BText strong size={19}>4 · Salvar preferências</BText>
        <BText muted>Os avisos são direcionados apenas a mensalidades pendentes de alunos que autorizaram contato.</BText>
        <BButton label="Salvar configuração" onPress={()=>void save()} busy={saving}/>
      </BCard>
      <BCard><View style={{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'center'}}><BText strong size={19}>Histórico recente</BText><BButton secondary label="Atualizar" onPress={()=>void load()}/></View>
        {history.length===0?<BText muted>Ainda não há lembretes automáticos registrados.</BText>:history.slice(0,30).map(item=><View key={item.uuid} style={{paddingVertical:9,borderBottomWidth:1,borderBottomColor:c.border,gap:3}}>
          <BText strong>{item.student_name} · {item.reference_month} · aviso {item.step}</BText>
          <BText muted>{STATUS[item.status]??'Registro efetuado'} · {item.created_at?new Date(item.created_at).toLocaleString('pt-BR'):'—'}</BText>
        </View>)}
      </BCard>
    </>:null}
  </ScrollView>;
}
