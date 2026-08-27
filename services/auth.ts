import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { apiRequest } from '@/lib/api';

const TOKEN_KEY = 'mf_avaliacao_auth_token';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

type LoginResponse = {
  token: string;
  token_type: string;
  user: AuthUser;
};

type MeResponse = {
  user: AuthUser;
};

async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      device_name:
        Platform.OS === 'web'
          ? 'mf-avaliacao-web-dev'
          : 'mf-avaliacao-mobile',
    }),
  });

  await saveToken(response.token);

  return response.user;
}

export async function getMe(): Promise<AuthUser> {
  const token = await getToken();

  if (!token) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await apiRequest<MeResponse>('/auth/me', {
    token,
  });

  return response.user;
}

export async function restoreSession(): Promise<AuthUser | null> {
  const token = await getToken();

  if (!token) {
    return null;
  }

  try {
    return await getMe();
  } catch {
    await deleteToken();
    return null;
  }
}

export async function logout(): Promise<void> {
  const token = await getToken();

  try {
    if (token) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token,
      });
    }
  } finally {
    await deleteToken();
  }
}