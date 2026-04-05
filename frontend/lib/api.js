import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

function inferHostFromExpo() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  if (scriptURL.includes('://')) {
    const part = scriptURL.split('://')[1] || '';
    return part.split(':')[0];
  }

  return null;
}

export function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const host = inferHostFromExpo();
  if (host) {
    return `http://${host}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    isFormData = false,
  } = options;

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(endpoint, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}
