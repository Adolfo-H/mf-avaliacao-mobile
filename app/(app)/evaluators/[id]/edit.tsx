import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  getEvaluator,
  updateEvaluator,
} from '@/services/evaluators';

export default function EditEvaluatorScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const evaluatorId = getEvaluatorId(params.id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [
    professionalRegistration,
    setProfessionalRegistration,
  ] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvaluator() {
      if (!evaluatorId) {
        setError('Avaliador inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const evaluator =
          await getEvaluator(evaluatorId);

        setName(evaluator.name);
        setEmail(evaluator.email);

        setPhone(
          evaluator.profile?.phone ?? ''
        );

        setProfessionalRegistration(
          evaluator.profile
            ?.professional_registration ?? ''
        );

        setSpecialty(
          evaluator.profile?.specialty ?? ''
        );

        setCompanyName(
          evaluator.profile?.company_name ?? ''
        );
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Não foi possível carregar o avaliador.'
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEvaluator();
  }, [evaluatorId]);

  async function handleSave() {
    if (!evaluatorId || saving) {
      return;
    }

    const normalizedName = name.trim();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedName) {
      setError('Informe o nome do avaliador.');
      return;
    }

    if (!normalizedEmail) {
      setError('Informe o e-mail do avaliador.');
      return;
    }

    if (
      password.length > 0 &&
      password.length < 8
    ) {
      setError(
        'A nova senha deve possuir pelo menos 8 caracteres.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateEvaluator(
        evaluatorId,
        {
          name: normalizedName,
          email: normalizedEmail,

          ...(password
            ? {
                password,
              }
            : {}),

          phone: emptyToNull(phone),

          professional_registration:
            emptyToNull(
              professionalRegistration
            ),

          specialty:
            emptyToNull(specialty),

          company_name:
            emptyToNull(companyName),
        }
      );

      router.replace(
        `/(app)/evaluators/${evaluatorId}`
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível salvar as alterações.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text style={styles.loadingText}>
          Carregando dados...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              disabled={saving}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#123C47"
              />
            </Pressable>

            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>
                AVALIADOR
              </Text>

              <Text style={styles.headerTitle}>
                Editar dados
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            Atualize os dados de acesso e as
            informações profissionais do avaliador.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#B44747"
              />

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>
            Identificação
          </Text>

          <View style={styles.card}>
            <Field
              label="Nome completo"
              required
              value={name}
              placeholder="Nome do avaliador"
              editable={!saving}
              onChangeText={(value) => {
                setName(value);
                setError('');
              }}
            />

            <Field
              label="E-mail"
              required
              value={email}
              placeholder="avaliador@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
            />

            <Field
              label="Nova senha"
              value={password}
              placeholder="Deixe vazio para manter a atual"
              secureTextEntry
              editable={!saving}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              helperText="Preencha somente se desejar alterar a senha."
              last
            />
          </View>

          <Text style={styles.sectionTitle}>
            Dados profissionais
          </Text>

          <View style={styles.card}>
            <Field
              label="Telefone"
              value={phone}
              placeholder="(44) 99999-9999"
              keyboardType="phone-pad"
              editable={!saving}
              onChangeText={setPhone}
            />

            <Field
              label="Registro profissional"
              value={
                professionalRegistration
              }
              placeholder="Ex.: CREF 000000-G/PR"
              editable={!saving}
              onChangeText={
                setProfessionalRegistration
              }
            />

            <Field
              label="Especialidade"
              value={specialty}
              placeholder="Ex.: Avaliação Física"
              editable={!saving}
              onChangeText={setSpecialty}
            />

            <Field
              label="Empresa"
              value={companyName}
              placeholder="Nome da empresa"
              editable={!saving}
              onChangeText={setCompanyName}
              last
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,

              pressed &&
                !saving &&
                styles.saveButtonPressed,

              saving &&
                styles.saveButtonDisabled,
            ]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Salvando...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Salvar alterações
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            disabled={saving}
            onPress={() => router.back()}
          >
            <Text
              style={styles.cancelButtonText}
            >
              Cancelar
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;

  required?: boolean;

  helperText?: string;

  secureTextEntry?: boolean;

  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad';

  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';

  editable?: boolean;

  last?: boolean;

  onChangeText: (
    value: string
  ) => void;
};

function Field({
  label,
  value,
  placeholder,
  required = false,
  helperText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  last = false,
  onChangeText,
}: FieldProps) {
  return (
    <View
      style={[
        styles.field,
        last &&
          styles.fieldLast,
      ]}
    >
      <Text style={styles.fieldLabel}>
        {label}

        {required ? (
          <Text style={styles.required}>
            {' *'}
          </Text>
        ) : null}
      </Text>

      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#A1ACAF"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        style={[
          styles.input,

          !editable &&
            styles.inputDisabled,
        ]}
        onChangeText={onChangeText}
      />

      {helperText ? (
        <Text style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function getEvaluatorId(
  value?: string | string[]
): number | null {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  if (!rawValue) {
    return null;
  }

  const id = Number(rawValue);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}

function emptyToNull(
  value: string
): string | null {
  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 44,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 14,
    color: '#66757A',
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerContent: {
    flex: 1,
  },

  headerLabel: {
    color: '#40856C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  headerTitle: {
    color: '#172D34',
    fontSize: 27,
    fontWeight: '800',
  },

  description: {
    color: '#718084',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 22,
    marginBottom: 24,
  },

  errorBox: {
    backgroundColor: '#FFF1F1',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  errorText: {
    flex: 1,
    color: '#B44747',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  sectionTitle: {
    color: '#172D34',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E7',
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingTop: 17,
    marginBottom: 26,
  },

  field: {
    marginBottom: 19,
  },

  fieldLast: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: '#344A51',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  required: {
    color: '#B44747',
  },

  input: {
    minHeight: 54,
    backgroundColor: '#F9FAF9',
    borderWidth: 1,
    borderColor: '#DEE4E2',
    borderRadius: 15,
    paddingHorizontal: 15,
    color: '#172D34',
    fontSize: 15,
  },

  inputDisabled: {
    opacity: 0.7,
  },

  helperText: {
    color: '#8A969A',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },

  saveButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#123C47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  saveButtonPressed: {
    opacity: 0.75,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  cancelButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },

  cancelButtonText: {
    color: '#718084',
    fontSize: 14,
    fontWeight: '700',
  },
});