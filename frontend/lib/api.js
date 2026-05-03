import Constants from 'expo-constants';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── API URL Auto-Detection ───────────────────────────────────────────────────
// Priority:
//   1. Local backend (EXPO_PUBLIC_LOCAL_API_URL or Expo-inferred host) — probed at startup
//   2. Production Railway URL (EXPO_PUBLIC_API_URL) — used if local is unreachable

let _resolvedApiUrl = null;       // cached after first probe
let _resolvePromise = null;       // ensures only one probe runs

function inferLocalUrl() {
  // Prefer explicit env variable
  if (process.env.EXPO_PUBLIC_LOCAL_API_URL) {
    return process.env.EXPO_PUBLIC_LOCAL_API_URL.replace(/\/$/, '');
  }

  // Fall back to Expo dev-server host + port 5000
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000/api`;
  }

  const scriptURL = NativeModules?.SourceCode?.scriptURL || '';
  if (scriptURL.includes('://')) {
    const host = (scriptURL.split('://')[1] || '').split(':')[0];
    if (host) return `http://${host}:5000/api`;
  }

  return null;
}

function getProductionUrl() {
  return (
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'https://scmsbackend-production.up.railway.app/api'
  );
}

/**
 * Probe the local backend with a short timeout.
 * Returns the local URL if reachable, otherwise the production URL.
 * Result is cached for the entire app session.
 */
async function resolveApiUrl() {
  if (_resolvedApiUrl) return _resolvedApiUrl;

  if (_resolvePromise) return _resolvePromise;   // de-duplicate concurrent calls

  _resolvePromise = (async () => {
    const localUrl = inferLocalUrl();

    if (localUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // 2 s timeout

        const res = await fetch(`${localUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok || res.status < 500) {
          console.log(`[API] ✅ Local backend reachable → ${localUrl}`);
          _resolvedApiUrl = localUrl;
          return _resolvedApiUrl;
        }
      } catch {
        // local backend not reachable — fall through to production
      }
    }

    const prodUrl = getProductionUrl();
    console.log(`[API] 🌐 Using production backend → ${prodUrl}`);
    _resolvedApiUrl = prodUrl;
    return _resolvedApiUrl;
  })();

  return _resolvePromise;
}

/** Synchronous getter — returns cached URL or production fallback before probe completes */
export function getApiBaseUrl() {
  return _resolvedApiUrl || getProductionUrl();
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    isFormData = false,
  } = options;

  const headers = {};
  
  // Don't set Content-Type for FormData, browser will set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Try to get token from params, then from storage
  let authToken = token;
  if (!authToken) {
    try {
      authToken = await AsyncStorage.getItem('scms_auth_token');
    } catch (error) {
      console.error('Failed to get token:', error);
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const baseUrl = await resolveApiUrl();
  const endpoint = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Handle FormData properly - don't stringify
  let requestBody = undefined;
  if (body) {
    if (isFormData) {
      requestBody = body; // FormData goes as-is
    } else {
      requestBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: requestBody,
    });

    const data = await response.json().catch(() => ({}));

    // Handle token expiration
    if (response.status === 401) {
      console.log('Token expired or invalid, clearing storage...');
      await AsyncStorage.multiRemove(['scms_auth_token', 'scms_auth_user']);
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const message = data?.message || data?.error || 'Request failed';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// ============ CONCERN RELATED API FUNCTIONS ============

// Submit a concern with optional medical report
export async function submitConcernWithReport(concernData, medicalReportFile) {
  const formData = new FormData();
  
  // Add all text fields
  formData.append('concernType', concernData.concernType);
  formData.append('genre', concernData.genre);
  formData.append('description', concernData.description);
  formData.append('studentId', concernData.studentId);
  
  // Add optional fields if they exist
  if (concernData.age) formData.append('age', concernData.age.toString());
  if (concernData.gpa) formData.append('gpa', concernData.gpa.toString());
  if (concernData.year) formData.append('year', concernData.year.toString());
  if (concernData.gender) formData.append('gender', concernData.gender);
  
  // Add medical report if provided
  if (medicalReportFile) {
    formData.append('medicalReport', {
      uri: medicalReportFile.uri,
      name: medicalReportFile.name || `medical-report-${Date.now()}.jpg`,
      type: medicalReportFile.type || 'image/jpeg',
    });
  }
  
  return apiRequest('/concerns/submit', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

// Get all concerns for a specific student
export async function getStudentConcerns(studentId) {
  return apiRequest(`/concerns/my-concerns/${studentId}`, {
    method: 'GET',
  });
}

// Get details of a specific concern
export async function getConcernDetails(concernId) {
  return apiRequest(`/concerns/my-concerns/detail/${concernId}`, {
    method: 'GET',
  });
}

// Delete a student's own pending concern
export async function deleteStudentConcern(concernId) {
  return apiRequest(`/concerns/my-concerns/${concernId}`, {
    method: 'DELETE',
  });
}

// Update a student's own pending concern
export async function updateStudentConcern(concernId, concernData, medicalReportFile) {
  const formData = new FormData();
  
  if (concernData.concernType) formData.append('concernType', concernData.concernType);
  if (concernData.genre) formData.append('genre', concernData.genre);
  if (concernData.description) formData.append('description', concernData.description);
  
  if (medicalReportFile) {
    formData.append('medicalReport', {
      uri: medicalReportFile.uri,
      name: medicalReportFile.name || `medical-report-${Date.now()}.jpg`,
      type: medicalReportFile.type || 'image/jpeg',
    });
  }
  
  return apiRequest(`/concerns/my-concerns/${concernId}`, {
    method: 'PUT',
    body: formData,
    isFormData: true,
  });
}

// ============ REGISTRATION RELATED API FUNCTIONS ============

// Register a new student with photo
export async function registerStudent(studentData, studentIdPhoto) {
  const formData = new FormData();
  
  // Add all student data
  Object.keys(studentData).forEach(key => {
    if (studentData[key] !== null && studentData[key] !== undefined && studentData[key] !== '') {
      formData.append(key, studentData[key].toString());
    }
  });
  
  // Add student ID photo if provided
  if (studentIdPhoto) {
    formData.append('studentIdPhoto', {
      uri: studentIdPhoto.uri,
      name: studentIdPhoto.fileName || `student-id-${Date.now()}.jpg`,
      type: studentIdPhoto.mimeType || 'image/jpeg',
    });
  }
  
  return apiRequest('/auth/register', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

// ============ PROFILE RELATED API FUNCTIONS ============

// Update student profile (age, gpa, year, gender)
export async function updateStudentProfile(profileData) {
  return apiRequest('/students/profile', {
    method: 'PUT',
    body: profileData,
  });
}

// Get student profile
export async function getStudentProfile() {
  return apiRequest('/students/profile', {
    method: 'GET',
  });
}

// ============ ADMIN CONCERN MANAGEMENT FUNCTIONS ============

// Get all concerns (admin only)
export async function getAllConcerns(status = null) {
  const endpoint = status ? `/concerns/all?status=${status}` : '/concerns/all';
  return apiRequest(endpoint, {
    method: 'GET',
  });
}

// Reply to a concern (admin only)
export async function replyToConcern(concernId, reply) {
  return apiRequest(`/concerns/reply/${concernId}`, {
    method: 'POST',
    body: { reply },
  });
}

// Update concern status (admin only)
export async function updateConcernStatus(concernId, status) {
  return apiRequest(`/concerns/status/${concernId}`, {
    method: 'PUT',
    body: { status },
  });
}

// Download medical report (admin only)
export async function downloadMedicalReport(concernId) {
  return apiRequest(`/concerns/download/${concernId}`, {
    method: 'GET',
  });
}

// Delete concern (admin only)
export async function deleteConcern(concernId) {
  return apiRequest(`/concerns/${concernId}`, {
    method: 'DELETE',
  });
}

// ============ NOTICE (BROADCAST) FUNCTIONS ============

export async function getNotices() {
  return apiRequest('/notices', {
    method: 'GET',
  });
}

export async function createNotice(noticeData) {
  return apiRequest('/notices', {
    method: 'POST',
    body: noticeData,
  });
}

export async function updateNotice(id, noticeData) {
  return apiRequest(`/notices/${id}`, {
    method: 'PATCH',
    body: noticeData,
  });
}

export async function deleteNotice(id) {
  return apiRequest(`/notices/${id}`, {
    method: 'DELETE',
  });
}

export async function dismissNotice(id) {
  return apiRequest(`/notices/${id}/dismiss`, {
    method: 'POST',
  });
}

// ============ NOTIFICATION FUNCTIONS ============

export async function getMyNotifications() {
  return apiRequest('/notifications/my', {
    method: 'GET',
  });
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}

// ============ UTILITY FUNCTIONS ============

// Upload a generic file
export async function uploadFile(file, endpoint = '/upload') {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || `upload-${Date.now()}.jpg`,
    type: file.type || 'image/jpeg',
  });
  
  return apiRequest(endpoint, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

// Check server health
export async function checkHealth() {
  return apiRequest('/health', {
    method: 'GET',
  });
}

export default {
  apiRequest,
  getApiBaseUrl,
  submitConcernWithReport,
  getStudentConcerns,
  getConcernDetails,
  registerStudent,
  updateStudentProfile,
  getStudentProfile,
  getAllConcerns,
  replyToConcern,
  updateConcernStatus,
  downloadMedicalReport,
  deleteConcern,
  deleteStudentConcern,
  updateStudentConcern,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  dismissNotice,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  uploadFile,
  checkHealth,
};
