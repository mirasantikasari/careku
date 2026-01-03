import { getFirebaseApiKey } from '../services/firebaseAuth';
import { getAccessTokenFromRefreshToken, getBaseUrl, getProjectId } from '../services/firestore';

export type ReminderPayload = {
  id?: string;
  userId: string;
  title: string;
  type: string;
  time: string;
  repeat: string;
  enabled?: boolean;
  createdAt?: string;
};

const envDbUrl =
  (globalThis as any)?.process?.env?.FIREBASE_RTDB_URL ||
  (globalThis as any)?.process?.env?.FIREBASE_DATABASE_URL ||
  '';
const REGION_SUFFIX = 'asia-southeast1';
const fallbackRtdb = (projectId: string) =>
  `https://${projectId}-default-rtdb.${REGION_SUFFIX}.firebasedatabase.app`;
const getRtdbUrl = (projectId: string) =>
  (envDbUrl ? envDbUrl.replace(/\/$/, '') : fallbackRtdb(projectId));

const mapFields = (payload: ReminderPayload, createdAt: string, enabled: boolean, id: string) => ({
  id: { stringValue: id },
  userId: { stringValue: payload.userId },
  title: { stringValue: payload.title },
  type: { stringValue: payload.type },
  time: { stringValue: payload.time },
  repeat: { stringValue: payload.repeat },
  enabled: { booleanValue: enabled },
  createdAt: { timestampValue: createdAt },
});

export const saveReminder = async (payload: ReminderPayload, refreshToken: string) => {
  const API_KEY = getFirebaseApiKey();
  const PROJECT_ID = getProjectId();
  if (!API_KEY || !PROJECT_ID) {
    throw new Error('FIREBASE_API_KEY atau PROJECT_ID belum diset.');
  }

  const createdAt = payload.createdAt || new Date().toISOString();
  const enabled = payload.enabled ?? true;
  const docId = payload.id || `${Date.now()}`;
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  // Firestore
  const fsRes = await fetch(`${getBaseUrl()}/reminders?documentId=${docId}&key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields: mapFields(payload, createdAt, enabled, docId) }),
  });

  if (!fsRes.ok) {
    const body = await fsRes.text();
    throw new Error(`Gagal menyimpan ke Firestore: ${body}`);
  }

  // Realtime Database
  const rtRes = await fetch(
    `${getRtdbUrl(PROJECT_ID)}/reminders/${payload.userId}/${docId}.json?auth=${accessToken}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: docId, createdAt, enabled }),
    },
  );

  if (!rtRes.ok) {
    const body = await rtRes.text();
    throw new Error(`Gagal menyimpan ke Realtime DB: ${body}`);
  }

  return { ...payload, id: docId, createdAt, enabled };
};

export const fetchReminders = async (userId: string, refreshToken: string) => {
  const PROJECT_ID = getProjectId();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const rtRes = await fetch(`${getRtdbUrl(PROJECT_ID)}/reminders/${userId}.json?auth=${accessToken}`);

  if (!rtRes.ok) {
    const body = await rtRes.text();
    throw new Error(`Gagal mengambil reminders: ${body}`);
  }

  const data = await rtRes.json();
  if (!data) return [];

  return Object.entries<any>(data).map(([id, item]) => ({
    id,
    userId: item.userId || userId,
    title: item.title,
    type: item.type,
    time: item.time,
    repeat: item.repeat,
    enabled: item.enabled ?? true,
    createdAt: item.createdAt,
  }));
};

export const updateReminderEnabled = async (
  userId: string,
  reminderId: string,
  enabled: boolean,
  refreshToken: string,
) => {
  const PROJECT_ID = getProjectId();
  const API_KEY = getFirebaseApiKey();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  // Realtime DB
  const rtRes = await fetch(
    `${getRtdbUrl(PROJECT_ID)}/reminders/${userId}/${reminderId}.json?auth=${accessToken}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    },
  );

  if (!rtRes.ok) {
    const body = await rtRes.text();
    throw new Error(`Gagal memperbarui status di Realtime DB: ${body}`);
  }

  // Firestore
  const fsRes = await fetch(
    `${getBaseUrl()}/reminders/${reminderId}?updateMask.fieldPaths=enabled&key=${API_KEY}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        fields: {
          enabled: { booleanValue: enabled },
        },
      }),
    },
  );

  if (!fsRes.ok) {
    const body = await fsRes.text();
    throw new Error(`Gagal memperbarui status di Firestore: ${body}`);
  }
};

export const deleteReminder = async (userId: string, reminderId: string, refreshToken: string) => {
  const PROJECT_ID = getProjectId();
  const API_KEY = getFirebaseApiKey();
  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  // Realtime DB
  const rtRes = await fetch(
    `${getRtdbUrl(PROJECT_ID)}/reminders/${userId}/${reminderId}.json?auth=${accessToken}`,
    {
      method: 'DELETE',
    },
  );

  if (!rtRes.ok) {
    const body = await rtRes.text();
    throw new Error(`Gagal menghapus di Realtime DB: ${body}`);
  }

  // Firestore
  const fsRes = await fetch(`${getBaseUrl()}/reminders/${reminderId}?key=${API_KEY}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!fsRes.ok) {
    const body = await fsRes.text();
    throw new Error(`Gagal menghapus di Firestore: ${body}`);
  }
};
