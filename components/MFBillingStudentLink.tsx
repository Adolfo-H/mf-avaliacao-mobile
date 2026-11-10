import { router } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { BButton } from '@/components/MFBillingUI';
export function MFBillingStudentLink({studentUuid}:{studentUuid:string}) {
  const {user}=useAuth();
  if(!user || !['admin','reception'].includes(user.role??''))return null;
  return <View style={{marginVertical:16}}><BButton secondary label="Mensalidades deste aluno" onPress={()=>router.push({pathname:'/(app)/billing',params:{studentUuid}})}/></View>;
}
