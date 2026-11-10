import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useMFBillingTheme } from '@/lib/mf-billing-theme';
import type { BillingStatus } from '@/types/mf-billing';
export function BText({children,muted=false,strong=false,size=14}:{children:ReactNode;muted?:boolean;strong?:boolean;size?:number}) {
  const {colors:c}=useMFBillingTheme();return <Text style={{color:muted?c.muted:c.ink,fontSize:size,fontWeight:strong?'800':'500',lineHeight:Math.round(size*1.5)}}>{children}</Text>;
}
export function BCard({children}:{children:ReactNode}) { const {colors:c}=useMFBillingTheme();return <View style={{backgroundColor:c.surface,borderWidth:1,borderColor:c.border,borderRadius:18,padding:20,gap:14}}>{children}</View>; }
export function BButton({label,onPress,secondary=false,danger=false,disabled=false,busy=false}:{label:string;onPress:()=>void;secondary?:boolean;danger?:boolean;disabled?:boolean;busy?:boolean}) {
  const {colors:c}=useMFBillingTheme();const ink=danger?c.error:secondary?c.ink:c.onLime;
  return <Pressable accessibilityRole="button" accessibilityState={{disabled:disabled||busy}} disabled={disabled||busy} onPress={onPress} style={{borderRadius:12,borderWidth:1,borderColor:danger?c.error:secondary?c.border:c.lime,backgroundColor:danger?c.errorSoft:secondary?c.surface:c.lime,minHeight:48,paddingHorizontal:17,paddingVertical:11,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,opacity:disabled ? 0.6 : 1}}>{busy?<ActivityIndicator color={ink}/>:null}<Text style={{color:ink,fontSize:14,fontWeight:'800',textAlign:'center'}}>{label}</Text></Pressable>;
}
export function BField({label,...props}:TextInputProps & {label:string}) {
  const {colors:c}=useMFBillingTheme();return <View style={{gap:7}}><BText strong>{label}</BText><TextInput {...props} accessibilityLabel={label} placeholderTextColor={c.muted} style={[{backgroundColor:c.soft,color:c.ink,borderColor:c.border,borderWidth:1,borderRadius:12,minHeight:49,fontSize:16,paddingHorizontal:13,paddingVertical:11},props.style]}/></View>;
}
export function BCheck({checked,onChange,label,disabled=false}:{checked:boolean;onChange:(v:boolean)=>void;label:string;disabled?:boolean}) {
  const {colors:c}=useMFBillingTheme();return <Pressable accessibilityRole="checkbox" accessibilityState={{checked,disabled}} disabled={disabled} onPress={()=>onChange(!checked)} style={{flexDirection:'row',alignItems:'flex-start',gap:11,paddingVertical:10}}><View style={{width:23,height:23,borderWidth:2,borderRadius:7,borderColor:checked?c.greenText:c.muted,backgroundColor:checked?c.greenSoft:c.surface,justifyContent:'center',alignItems:'center'}}>{checked?<Ionicons name="checkmark" color={c.greenText} size={17}/>:null}</View><Text style={{flex:1,color:c.ink,fontSize:14,lineHeight:21}}>{label}</Text></Pressable>;
}
export const BILLING_LABELS:Record<BillingStatus,string>={open:'A vencer',due_today:'Vence hoje',overdue:'Em atraso',paid:'Pago',cancelled:'Cancelada'};
export function BBillingBadge({status}:{status:BillingStatus}) {
  const {colors:c}=useMFBillingTheme();const ink=status==='paid'?c.greenText:status==='overdue'?c.error:status==='due_today'?c.warning:c.muted;const bg=status==='paid'?c.greenSoft:status==='overdue'?c.errorSoft:status==='due_today'?c.warningSoft:c.soft;
  return <View style={{backgroundColor:bg,borderRadius:99,paddingHorizontal:11,paddingVertical:7,alignSelf:'flex-start'}}><Text style={{color:ink,fontWeight:'800',fontSize:12}}>● {BILLING_LABELS[status]}</Text></View>;
}
export function BModal({title,children,onClose,busy=false}:{title:string;children:ReactNode;onClose:()=>void;busy?:boolean}) {
  const {colors:c}=useMFBillingTheme();return <Modal visible transparent animationType="fade" onRequestClose={()=>{if(!busy)onClose();}}><View style={{flex:1,backgroundColor:'rgba(0,0,0,.55)',justifyContent:'center',padding:16}}><View style={{maxWidth:640,width:'100%',alignSelf:'center',maxHeight:'92%',backgroundColor:c.surface,borderRadius:22,borderWidth:1,borderColor:c.border,overflow:'hidden'}}><View style={{flexDirection:'row',alignItems:'center',padding:20,borderBottomWidth:1,borderBottomColor:c.border,gap:12}}><View style={{flex:1}}><BText strong size={21}>{title}</BText></View><Pressable accessibilityRole="button" accessibilityLabel="Fechar" disabled={busy} onPress={onClose} style={{padding:8}}><Ionicons name="close" size={24} color={c.ink}/></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16}}>{children}</ScrollView></View></View></Modal>;
}
export function BError({message}:{message:string}) { const {colors:c}=useMFBillingTheme();return message?<View accessibilityRole="alert" style={{padding:14,borderRadius:12,backgroundColor:c.errorSoft}}><Text style={{color:c.error,fontSize:14,lineHeight:21}}>{message}</Text></View>:null; }
