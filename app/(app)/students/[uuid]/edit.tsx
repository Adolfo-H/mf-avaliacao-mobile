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
  getStudent,
  updateStudent,
} from '@/services/students';
import {
  Student,
  StudentSex,
} from '@/types/student';

export default function EditStudentScreen() {
  const params = useLocalSearchParams<{
    uuid?: string | string[];
  }>();

  const studentUuid = Array.isArray(params.uuid)
    ? params.uuid[0]
    : params.uuid;

  const [student, setStudent] =
    useState<Student | null>(null);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] =
    useState('');
  const [sex, setSex] =
    useState<StudentSex | null>(null);

  const [address, setAddress] =
    useState('');
  const [addressNumber, setAddressNumber] =
    useState('');
  const [
    addressComplement,
    setAddressComplement,
  ] = useState('');
  const [neighborhood, setNeighborhood] =
    useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [mobilePhone, setMobilePhone] =
    useState('');
  const [homePhone, setHomePhone] =
    useState('');
  const [email, setEmail] =
    useState('');

  const [
    administrativeNotes,
    setAdministrativeNotes,
  ] = useState('');

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!studentUuid) {
      setError('Aluno inválido.');
      setLoading(false);
      return;
    }

    void loadStudent(studentUuid);
  }, [studentUuid]);

  async function loadStudent(
    uuid: string
  ) {
    try {
      setLoading(true);
      setError('');

      const response =
        await getStudent(uuid);

      setStudent(response);

      setName(response.name ?? '');

      setBirthDate(
        formatDateForInput(
          response.birth_date
        )
      );

      setSex(response.sex ?? null);

      setAddress(
        response.address?.street ?? ''
      );

      setAddressNumber(
        response.address?.number ?? ''
      );

      setAddressComplement(
        response.address?.complement ?? ''
      );

      setNeighborhood(
        response.address?.neighborhood ??
          ''
      );

      setCity(
        response.address?.city ?? ''
      );

      setState(
        response.address?.state ?? ''
      );

      setMobilePhone(
        response.contact?.mobile_phone ??
          ''
      );

      setHomePhone(
        response.contact?.home_phone ??
          ''
      );

      setEmail(
        response.contact?.email ?? ''
      );

      setAdministrativeNotes(
        response.administrative_notes ??
          ''
      );
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível carregar o aluno.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (
      !student ||
      !studentUuid ||
      saving
    ) {
      return;
    }

    const normalizedName =
      name.trim();

    if (!normalizedName) {
      setError(
        'Informe o nome do aluno.'
      );
      return;
    }

    let isoBirthDate:
      | string
      | null = null;

    if (birthDate.trim()) {
      isoBirthDate =
        parseBrazilianDate(
          birthDate
        );

      if (!isoBirthDate) {
        setError(
          'Informe a data de nascimento no formato DD/MM/AAAA.'
        );
        return;
      }

      const parsedDate = new Date(
        `${isoBirthDate}T12:00:00`
      );

      if (parsedDate > new Date()) {
        setError(
          'A data de nascimento não pode ser futura.'
        );
        return;
      }
    }

    if (
      state.trim() &&
      state.trim().length !== 2
    ) {
      setError(
        'A UF deve possuir exatamente 2 letras.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateStudent(
        studentUuid,
        {
          name: normalizedName,

          birth_date:
            isoBirthDate,

          sex,

          address:
            emptyToNull(address),

          address_number:
            emptyToNull(
              addressNumber
            ),

          address_complement:
            emptyToNull(
              addressComplement
            ),

          neighborhood:
            emptyToNull(
              neighborhood
            ),

          city:
            emptyToNull(city),

          state:
            state.trim()
              ? state
                  .trim()
                  .toUpperCase()
              : null,

          mobile_phone:
            emptyToNull(
              mobilePhone
            ),

          home_phone:
            emptyToNull(
              homePhone
            ),

          email:
            email.trim()
              ? email
                  .trim()
                  .toLowerCase()
              : null,

          administrative_notes:
            emptyToNull(
              administrativeNotes
            ),
        }
      );

      router.back();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível atualizar o aluno.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#123C47"
        />

        <Text
          style={styles.loadingText}
        >
          Carregando aluno...
        </Text>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.errorPage}
        >
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color="#B44747"
          />

          <Text
            style={styles.errorTitle}
          >
            Não foi possível abrir o
            aluno
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            {error ||
              'Cadastro não encontrado.'}
          </Text>

          <Pressable
            style={
              styles.returnButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.returnButtonText
              }
            >
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View style={styles.header}>
            <Pressable
              style={
                styles.backButton
              }
              disabled={saving}
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
                styles.headerContent
              }
            >
              <Text
                style={
                  styles.headerLabel
                }
              >
                ALUNOS
              </Text>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Editar aluno
              </Text>
            </View>
          </View>

          <Text
            style={styles.description}
          >
            Atualize os dados cadastrais
            do aluno.
          </Text>

          {error ? (
            <View
              style={styles.errorBox}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#B44747"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>
          ) : null}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Identificação
          </Text>

          <View style={styles.card}>
            <Field
              label="Nome completo"
              required
              value={name}
              placeholder="Nome do aluno"
              editable={!saving}
              onChangeText={setName}
            />

            <Field
              label="Data de nascimento"
              value={birthDate}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              editable={!saving}
              onChangeText={(value) =>
                setBirthDate(
                  formatBirthDateInput(
                    value
                  )
                )
              }
            />

            <Text
              style={
                styles.fieldLabel
              }
            >
              Sexo
            </Text>

            <View
              style={
                styles.sexOptions
              }
            >
              <SexButton
                label="Masculino"
                selected={
                  sex === 'male'
                }
                onPress={() =>
                  setSex('male')
                }
              />

              <SexButton
                label="Feminino"
                selected={
                  sex === 'female'
                }
                onPress={() =>
                  setSex('female')
                }
              />

              <SexButton
                label="Outro"
                selected={
                  sex === 'other'
                }
                onPress={() =>
                  setSex('other')
                }
              />

              <SexButton
                label="Não informado"
                selected={
                  sex ===
                  'not_informed'
                }
                onPress={() =>
                  setSex(
                    'not_informed'
                  )
                }
              />
            </View>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Endereço
          </Text>

          <View style={styles.card}>
            <Field
              label="Endereço"
              value={address}
              placeholder="Rua, avenida..."
              editable={!saving}
              onChangeText={setAddress}
            />

            <View style={styles.row}>
              <View
                style={
                  styles.rowLarge
                }
              >
                <Field
                  label="Número"
                  value={
                    addressNumber
                  }
                  placeholder="123"
                  editable={!saving}
                  onChangeText={
                    setAddressNumber
                  }
                />
              </View>

              <View
                style={
                  styles.rowLarge
                }
              >
                <Field
                  label="Complemento"
                  value={
                    addressComplement
                  }
                  placeholder="Casa, apto..."
                  editable={!saving}
                  onChangeText={
                    setAddressComplement
                  }
                />
              </View>
            </View>

            <Field
              label="Bairro"
              value={neighborhood}
              placeholder="Bairro"
              editable={!saving}
              onChangeText={
                setNeighborhood
              }
            />

            <View style={styles.row}>
              <View
                style={
                  styles.cityField
                }
              >
                <Field
                  label="Cidade"
                  value={city}
                  placeholder="Cidade"
                  editable={!saving}
                  onChangeText={
                    setCity
                  }
                />
              </View>

              <View
                style={
                  styles.stateField
                }
              >
                <Field
                  label="UF"
                  value={state}
                  placeholder="PR"
                  maxLength={2}
                  autoCapitalize="characters"
                  editable={!saving}
                  onChangeText={(
                    value
                  ) =>
                    setState(
                      value.toUpperCase()
                    )
                  }
                />
              </View>
            </View>
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Contato
          </Text>

          <View style={styles.card}>
            <Field
              label="Celular"
              value={mobilePhone}
              placeholder="(44) 99999-9999"
              keyboardType="phone-pad"
              editable={!saving}
              onChangeText={
                setMobilePhone
              }
            />

            <Field
              label="Telefone residencial"
              value={homePhone}
              placeholder="(44) 3333-3333"
              keyboardType="phone-pad"
              editable={!saving}
              onChangeText={
                setHomePhone
              }
            />

            <Field
              label="E-mail"
              value={email}
              placeholder="aluno@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
              onChangeText={setEmail}
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Observações
          </Text>

          <View style={styles.card}>
            <Text
              style={
                styles.fieldLabel
              }
            >
              Observações
              administrativas
            </Text>

            <TextInput
              value={
                administrativeNotes
              }
              onChangeText={
                setAdministrativeNotes
              }
              placeholder="Informações administrativas..."
              placeholderTextColor="#A1ACAF"
              editable={!saving}
              multiline
              textAlignVertical="top"
              style={
                styles.notesInput
              }
            />

            <Text
              style={
                styles.helperText
              }
            >
              Os dados clínicos devem
              permanecer dentro das
              avaliações.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,

              pressed &&
                !saving &&
                styles.saveButtonPressed,

              saving &&
                styles.buttonDisabled,
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
            style={
              styles.cancelButton
            }
            disabled={saving}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.cancelButtonText
              }
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

  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'numeric';

  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';

  editable?: boolean;
  maxLength?: number;

  onChangeText: (
    value: string
  ) => void;
};

function Field({
  label,
  value,
  placeholder,
  required = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  maxLength,
  onChangeText,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text
        style={styles.fieldLabel}
      >
        {label}

        {required ? (
          <Text
            style={styles.required}
          >
            {' *'}
          </Text>
        ) : null}
      </Text>

      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#A1ACAF"
        keyboardType={keyboardType}
        autoCapitalize={
          autoCapitalize
        }
        autoCorrect={false}
        editable={editable}
        maxLength={maxLength}
        style={styles.input}
        onChangeText={onChangeText}
      />
    </View>
  );
}

type SexButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SexButton({
  label,
  selected,
  onPress,
}: SexButtonProps) {
  return (
    <Pressable
      style={[
        styles.sexButton,

        selected &&
          styles.sexButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.sexButtonText,

          selected &&
            styles.sexButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function emptyToNull(
  value: string
): string | null {
  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function formatBirthDateInput(
  value: string
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(
      0,
      2
    )}/${digits.slice(2)}`;
  }

  return `${digits.slice(
    0,
    2
  )}/${digits.slice(
    2,
    4
  )}/${digits.slice(4)}`;
}

function formatDateForInput(
  value: string | null
): string {
  if (!value) {
    return '';
  }

  const parts =
    value.split('-');

  if (parts.length !== 3) {
    return '';
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function parseBrazilianDate(
  value: string
): string | null {
  const match = value.match(
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
    date.getFullYear() !== year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(
    4,
    '0'
  )}-${String(month).padStart(
    2,
    '0'
  )}-${String(day).padStart(
    2,
    '0'
  )}`;
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8F6',
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
      backgroundColor:
        '#F7F8F6',
      alignItems: 'center',
      justifyContent:
        'center',
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
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E9E7',
      alignItems: 'center',
      justifyContent:
        'center',
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
      backgroundColor:
        '#FFF1F1',
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
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
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E4E9E7',
      borderRadius: 22,
      paddingHorizontal: 17,
      paddingTop: 17,
      marginBottom: 26,
    },

    field: {
      flex: 1,
      marginBottom: 18,
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
      backgroundColor:
        '#F9FAF9',
      borderWidth: 1,
      borderColor: '#DEE4E2',
      borderRadius: 15,
      paddingHorizontal: 15,
      color: '#172D34',
      fontSize: 15,
    },

    row: {
      flexDirection: 'row',
      gap: 10,
    },

    rowLarge: {
      flex: 1,
    },

    cityField: {
      flex: 3,
    },

    stateField: {
      flex: 1,
    },

    sexOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 18,
    },

    sexButton: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: '#DEE4E2',
      backgroundColor:
        '#F9FAF9',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    sexButtonSelected: {
      backgroundColor:
        '#EAF3EF',
      borderColor: '#BEDACA',
    },

    sexButtonText: {
      color: '#718084',
      fontSize: 12,
      fontWeight: '700',
    },

    sexButtonTextSelected: {
      color: '#40856C',
    },

    notesInput: {
      minHeight: 110,
      backgroundColor:
        '#F9FAF9',
      borderWidth: 1,
      borderColor: '#DEE4E2',
      borderRadius: 15,
      paddingHorizontal: 15,
      paddingVertical: 13,
      color: '#172D34',
      fontSize: 14,
    },

    helperText: {
      color: '#8A969A',
      fontSize: 11,
      lineHeight: 16,
      marginTop: 7,
      marginBottom: 17,
    },

    saveButton: {
      height: 58,
      borderRadius: 18,
      backgroundColor:
        '#123C47',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
    },

    saveButtonPressed: {
      opacity: 0.75,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    cancelButton: {
      height: 52,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 7,
    },

    cancelButtonText: {
      color: '#718084',
      fontSize: 14,
      fontWeight: '700',
    },

    errorPage: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    errorTitle: {
      color: '#172D34',
      fontSize: 19,
      fontWeight: '800',
      marginTop: 18,
      textAlign: 'center',
    },

    errorDescription: {
      color: '#718084',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 22,
    },

    returnButton: {
      minHeight: 50,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor:
        '#123C47',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    returnButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });